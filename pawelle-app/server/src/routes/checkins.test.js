import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { createApp } from '../app.js'
import { openDatabase } from '../db/index.js'
import { listRecentCheckins } from '../db/checkins.js'
import { addDaysIso, utcToday } from '../lib/dates.js'

let server, base, db, petId

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
beforeEach(async () => {
  db.exec('DELETE FROM pets')
  const res = await fetch(`${base}/pets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Pinky' }),
  })
  petId = (await res.json()).id
})

const today = () => utcToday()
const ago = (n) => addDaysIso(today(), -n)

const put = (date, body, id = petId) =>
  fetch(`${base}/pets/${id}/checkins/${date}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
const list = (query = '', id = petId) => fetch(`${base}/pets/${id}/checkins${query}`)

describe('PUT /pets/:id/checkins/:date', () => {
  it('creates a check-in and returns it with empty flags (AC1)', async () => {
    const res = await put(today(), { mood: 'happy', appetite: 'normal' })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({
      date: today(), mood: 'happy', appetite: 'normal', energy: null, play_minutes: null, litter: null, note: null, flags: [],
    })
  })

  it('updates the same day instead of adding a second row (AC6)', async () => {
    await put(today(), { mood: 'happy' })
    const again = await put(today(), { mood: 'grumpy', note: 'Hissed at the vacuum' })
    expect((await again.json()).mood).toBe('grumpy')
    expect(db.prepare('SELECT COUNT(*) c FROM checkins').get().c).toBe(1)
  })

  it('is safe to repeat the same request (idempotent)', async () => {
    const a = await (await put(today(), { mood: 'calm', play_minutes: 0 })).json()
    const b = await (await put(today(), { mood: 'calm', play_minutes: 0 })).json()
    expect(b).toMatchObject({ mood: 'calm', play_minutes: 0, id: a.id })
    expect(db.prepare('SELECT COUNT(*) c FROM checkins').get().c).toBe(1)
  })

  it('replaces answers, so a cleared chip is stored as empty (AC5)', async () => {
    await put(today(), { mood: 'happy', energy: 'high' })
    const res = await put(today(), { mood: 'happy' })
    expect((await res.json()).energy).toBeNull()
  })

  it('rejects an empty check-in with a friendly message (AC2)', async () => {
    const res = await put(today(), {})
    expect(res.status).toBe(422)
    const { error } = await res.json()
    expect(error.message).toBe('Pick at least one answer first.')
  })

  it('rejects unknown choices and long notes', async () => {
    expect((await put(today(), { mood: 'ecstatic' })).status).toBe(422)
    expect((await put(today(), { note: 'a'.repeat(301) })).status).toBe(422)
  })

  it('rejects far-future and impossible dates', async () => {
    expect((await put(addDaysIso(today(), 3), { mood: 'happy' })).status).toBe(422)
    expect((await put('2026-02-30', { mood: 'happy' })).status).toBe(422)
    expect((await put('nonsense', { mood: 'happy' })).status).toBe(422)
  })

  it('stores a note as literal text (AC9)', async () => {
    const res = await put(today(), { note: '<img src=x onerror=alert(1)>' })
    expect((await res.json()).note).toBe('<img src=x onerror=alert(1)>')
  })

  it('returns 404 for a missing cat', async () => {
    expect((await put(today(), { mood: 'happy' }, 9999)).status).toBe(404)
  })
})

describe('heads-up flags (AC10)', () => {
  it('flags one day of not eating as attention', async () => {
    const saved = await (await put(today(), { appetite: 'none' })).json()
    expect(saved.flags).toHaveLength(1)
    expect(saved.flags[0]).toMatchObject({ code: 'not_eating', level: 'attention' })
  })

  it('flags two consecutive days as urgent, and a gap day as attention', async () => {
    await put(ago(1), { appetite: 'none' })
    const urgent = await (await put(today(), { appetite: 'none' })).json()
    expect(urgent.flags[0]).toMatchObject({ code: 'not_eating_2d', level: 'urgent' })

    await put(ago(5), { appetite: 'none' })
    const gap = await (await put(ago(3), { appetite: 'none' })).json()
    expect(gap.flags[0]).toMatchObject({ code: 'not_eating', level: 'attention' })
  })

  it('flags the litter box as attention', async () => {
    const saved = await (await put(today(), { litter: 'off' })).json()
    expect(saved.flags[0]).toMatchObject({ code: 'litter_off', level: 'attention' })
  })

  it('keeps a past day\'s flag attached to that day in the list', async () => {
    await put(ago(2), { litter: 'off' })
    await put(today(), { mood: 'happy' })
    const rows = await (await list()).json()
    expect(rows.find((r) => r.date === ago(2)).flags[0].code).toBe('litter_off')
    expect(rows.find((r) => r.date === today()).flags).toEqual([])
  })
})

describe('GET /pets/:id/checkins', () => {
  it('lists newest first (AC13)', async () => {
    await put(ago(2), { mood: 'calm' })
    await put(today(), { mood: 'happy' })
    await put(ago(1), { mood: 'grumpy' })
    const rows = await (await list()).json()
    expect(rows.map((r) => r.date)).toEqual([today(), ago(1), ago(2)])
  })

  it('limits to the requested number of days and caps at 90', async () => {
    await put(today(), { mood: 'happy' })
    await put(ago(20), { mood: 'calm' })
    await put(ago(60), { mood: 'calm' })
    expect((await (await list()).json()).map((r) => r.date)).toEqual([today()])
    expect(await (await list('?days=30')).json()).toHaveLength(2)
    expect(await (await list('?days=90')).json()).toHaveLength(3)
    expect(await (await list('?days=5000')).json()).toHaveLength(3)
    expect(await (await list('?days=abc')).json()).toHaveLength(1)
  })

  it('returns an empty list for a new cat (AC14)', async () => {
    expect(await (await list()).json()).toEqual([])
  })

  it('returns 404 for a missing cat', async () => {
    expect((await list('', 9999)).status).toBe(404)
  })
})

describe('cleanup and feature 003 access', () => {
  it('deletes check-ins together with the cat (AC16)', async () => {
    await put(today(), { mood: 'happy' })
    await fetch(`${base}/pets/${petId}`, { method: 'DELETE' })
    expect(db.prepare('SELECT COUNT(*) c FROM checkins').get().c).toBe(0)
  })

  it('exposes recent check-ins with flags for the AI plan', async () => {
    await put(today(), { appetite: 'none' })
    const recent = listRecentCheckins(db, petId, 7)
    expect(recent).toHaveLength(1)
    expect(recent[0].flags[0].code).toBe('not_eating')
  })
})
