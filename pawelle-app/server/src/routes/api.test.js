import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../app.js'
import { openDatabase } from '../db/index.js'

let server, base, db

beforeAll(async () => {
  db = openDatabase({ file: ':memory:' })
  server = createApp({ db }).listen(0, '127.0.0.1')
  await new Promise((r) => server.once('listening', r))
  base = `http://127.0.0.1:${server.address().port}/api`
})
afterAll(() => {
  server.close()
  db.close()
})
beforeEach(() => {
  db.exec('DELETE FROM pets')
})

const json = (path, method = 'GET', body) =>
  fetch(base + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })

const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64, 1)])
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(64, 2)])
const MP4 = Buffer.concat([Buffer.alloc(4), Buffer.from('ftypisom'), Buffer.alloc(64)])

const putPhoto = (id, slot, body, type = 'image/jpeg') =>
  fetch(`${base}/pets/${id}/photos/${slot}`, { method: 'PUT', headers: { 'Content-Type': type }, body })

const create = async (data = { name: 'Pinky' }) => (await json('/pets', 'POST', data)).json()

describe('health', () => {
  it('reports the server is ok', async () => {
    expect(await (await json('/health')).json()).toEqual({ server: 'ok' })
  })
})

describe('pets', () => {
  it('starts empty (AC1: onboarding)', async () => {
    expect(await (await json('/pets')).json()).toEqual([])
  })

  it('creates a name-only pet (AC3, AC4)', async () => {
    const res = await json('/pets', 'POST', { name: '  Pinky ' })
    expect(res.status).toBe(201)
    const pet = await res.json()
    expect(pet).toMatchObject({
      name: 'Pinky',
      species: 'cat',
      activity_level: 'balanced',
      weight_kg: null,
      allergies: null,
      photos: [],
      completeness: 20,
    })
    expect(pet.next_suggestion.field).toBe('weight_kg')
  })

  it('returns friendly field errors (AC2, AC6, AC7)', async () => {
    const res = await json('/pets', 'POST', { name: '', weight_kg: 99, birthdate: '2999-01-01' })
    expect(res.status).toBe(422)
    const { error } = await res.json()
    expect(error.code).toBe('VALIDATION')
    expect(Object.keys(error.fields).sort()).toEqual(['birthdate', 'name', 'weight_kg'])
  })

  it('refuses a second pet with a 409', async () => {
    await create()
    const res = await json('/pets', 'POST', { name: 'Other' })
    expect(res.status).toBe(409)
  })

  it('stores allergies "none" as an empty list, not as unanswered (AC8)', async () => {
    const pet = await create({ name: 'Pinky', allergies: [], conditions: ['Chicken', 'chicken'] })
    expect(pet.allergies).toEqual([])
    expect(pet.conditions).toEqual(['Chicken'])
  })

  it('stores notes literally as text (AC9)', async () => {
    const pet = await create({ name: 'Pinky', notes: '<script>alert(1)</script>' })
    expect(pet.notes).toBe('<script>alert(1)</script>')
  })

  it('reads one pet and 404s for a missing one', async () => {
    const pet = await create()
    expect((await (await json(`/pets/${pet.id}`)).json()).name).toBe('Pinky')
    expect((await json('/pets/999')).status).toBe(404)
  })

  it('updates a pet and the completeness follows (AC10, AC11)', async () => {
    const pet = await create()
    const res = await json(`/pets/${pet.id}`, 'PUT', { name: 'Pinky', weight_kg: 4.2, birthdate: '2021-05-01' })
    const updated = await res.json()
    expect(updated.weight_kg).toBe(4.2)
    expect(updated.completeness).toBe(50)
    expect(updated.next_suggestion.field).toBe('allergies')
  })

  it('deletes a pet (AC12)', async () => {
    const pet = await create()
    expect((await json(`/pets/${pet.id}`, 'DELETE')).status).toBe(204)
    expect(await (await json('/pets')).json()).toEqual([])
  })
})

describe('photos', () => {
  it('stores, serves and lists two photos (AC16)', async () => {
    const pet = await create()
    expect((await putPhoto(pet.id, 1, JPEG)).status).toBe(200)
    const second = await putPhoto(pet.id, 2, PNG, 'image/png')
    expect(await second.json()).toEqual({ photos: [1, 2] })
    const got = await fetch(`${base}/pets/${pet.id}/photos/1`)
    expect(got.headers.get('content-type')).toContain('image/jpeg')
    expect(Buffer.from(await got.arrayBuffer()).equals(JPEG)).toBe(true)
    expect((await (await json(`/pets/${pet.id}`)).json()).photos).toEqual([1, 2])
  })

  it('replaces a photo in place', async () => {
    const pet = await create()
    await putPhoto(pet.id, 1, JPEG)
    await putPhoto(pet.id, 1, PNG, 'image/png')
    const got = await fetch(`${base}/pets/${pet.id}/photos/1`)
    expect(got.headers.get('content-type')).toContain('image/png')
  })

  it('refuses a third photo with a friendly message (AC16)', async () => {
    const pet = await create()
    const res = await putPhoto(pet.id, 3, JPEG)
    expect(res.status).toBe(400)
    expect((await res.json()).error.message).toMatch(/two photos/i)
  })

  it('refuses videos and fake images even with an image content type (AC17)', async () => {
    const pet = await create()
    const video = await putPhoto(pet.id, 1, MP4, 'video/mp4')
    expect(video.status).toBe(415)
    expect((await video.json()).error.message).toMatch(/not videos/i)
    const fake = await putPhoto(pet.id, 1, Buffer.from('not really an image at all'), 'image/jpeg')
    expect(fake.status).toBe(415)
  })

  it('refuses photos over 1 MB', async () => {
    const pet = await create()
    const big = Buffer.concat([JPEG, Buffer.alloc(1024 * 1024)])
    expect((await putPhoto(pet.id, 1, big)).status).toBe(413)
  })

  it('puts a lone second photo in slot 1 (no gaps)', async () => {
    const pet = await create()
    const res = await putPhoto(pet.id, 2, JPEG)
    expect(await res.json()).toEqual({ photos: [1] })
  })

  it('moves photo 2 into the avatar slot when photo 1 is removed (AC16)', async () => {
    const pet = await create()
    await putPhoto(pet.id, 1, JPEG)
    await putPhoto(pet.id, 2, PNG, 'image/png')
    const res = await json(`/pets/${pet.id}/photos/1`, 'DELETE')
    expect(await res.json()).toEqual({ photos: [1] })
    const got = await fetch(`${base}/pets/${pet.id}/photos/1`)
    expect(got.headers.get('content-type')).toContain('image/png')
  })

  it('serves 304 when the ETag matches', async () => {
    const pet = await create()
    await putPhoto(pet.id, 1, JPEG)
    const first = await fetch(`${base}/pets/${pet.id}/photos/1`)
    const again = await fetch(`${base}/pets/${pet.id}/photos/1`, {
      headers: { 'If-None-Match': first.headers.get('etag') },
    })
    expect(again.status).toBe(304)
  })

  it('deletes photos together with the pet (AC12, AC18)', async () => {
    const pet = await create()
    await putPhoto(pet.id, 1, JPEG)
    await json(`/pets/${pet.id}`, 'DELETE')
    expect(db.prepare('SELECT COUNT(*) c FROM pet_photos').get().c).toBe(0)
  })

  it('raises completeness when a photo is added', async () => {
    const pet = await create()
    await putPhoto(pet.id, 1, JPEG)
    expect((await (await json(`/pets/${pet.id}`)).json()).completeness).toBe(25)
  })
})
