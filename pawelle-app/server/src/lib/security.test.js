import http from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createApp } from '../app.js'
import { openDatabase } from '../db/index.js'
import { isLocalHost, isLocalOrigin } from './security.js'

describe('isLocalHost / isLocalOrigin', () => {
  it('accepts this computer on any port', () => {
    for (const h of ['localhost', 'localhost:5173', '127.0.0.1:3001', '127.0.0.1', '[::1]:3001']) expect(isLocalHost(h), h).toBe(true)
    for (const o of ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://[::1]:5173']) expect(isLocalOrigin(o), o).toBe(true)
  })
  it('refuses everything else, including look-alikes and rebinding names', () => {
    for (const h of ['evil.example', 'evil.example:3001', 'localhost.evil.example', '127.0.0.1.evil.example', 'evil.example@127.0.0.1', '0.0.0.0', '192.168.1.5:3001', '', undefined, 'localhost.']) {
      expect(isLocalHost(h), String(h)).toBe(false)
    }
    for (const o of ['https://evil.example', 'http://localhost.evil.example', 'null', 'file://', '', 'http://127.0.0.1.evil.example']) {
      expect(isLocalOrigin(o), o).toBe(false)
    }
  })
})

let server, db, port
beforeAll(async () => {
  db = openDatabase({ file: ':memory:' })
  server = createApp({ db }).listen(0, '127.0.0.1')
  await new Promise((r) => server.once('listening', r))
  port = server.address().port
  db.prepare("INSERT INTO pets (name) VALUES ('Pinky')").run()
})
afterAll(() => { server.close(); db.close() })

// node:http lets us set Host and Origin exactly, like a hostile page would.
const req = (path, { method = 'GET', headers = {} } = {}) =>
  new Promise((resolve, reject) => {
    const r = http.request({ host: '127.0.0.1', port, path, method, headers }, (res) => {
      let body = ''
      res.on('data', (c) => (body += c))
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }))
    })
    r.on('error', reject)
    r.end()
  })

describe('local-only guard on the API', () => {
  it('serves the app\'s own requests (any local host name, no Origin or a local one)', async () => {
    expect((await req('/api/pets')).status).toBe(200)
    expect((await req('/api/pets', { headers: { Host: 'localhost:5173' } })).status).toBe(200)
    expect((await req('/api/pets', { headers: { Origin: 'http://127.0.0.1:5173' } })).status).toBe(200)
    expect((await req('/api/pets', { headers: { 'Sec-Fetch-Site': 'same-origin' } })).status).toBe(200)
  })

  it('blocks DNS rebinding: a hostile Host header gets nothing, and no data', async () => {
    const r = await req('/api/pets', { headers: { Host: 'evil.example' } })
    expect(r.status).toBe(403)
    expect(r.body).not.toContain('Pinky')
    expect(JSON.parse(r.body).error.code).toBe('LOCAL_ONLY')
  })

  it('blocks cross-site requests: a foreign Origin cannot read, write or delete', async () => {
    const evil = { Origin: 'https://evil.example' }
    expect((await req('/api/pets', { headers: evil })).status).toBe(403)
    expect((await req('/api/pets/1/plans/2026-10-05/generate', { method: 'POST', headers: { ...evil, 'Content-Type': 'text/plain' } })).status).toBe(403)
    expect((await req('/api/pets/1', { method: 'DELETE', headers: evil })).status).toBe(403)
    expect(db.prepare('SELECT COUNT(*) c FROM pets').get().c).toBe(1)
  })

  it('blocks sandboxed pages (Origin: null) and browser-labelled cross-site fetches', async () => {
    expect((await req('/api/pets', { headers: { Origin: 'null' } })).status).toBe(403)
    expect((await req('/api/pets', { headers: { 'Sec-Fetch-Site': 'cross-site' } })).status).toBe(403)
  })

  it('also guards the health route', async () => {
    expect((await req('/api/health', { headers: { Host: 'evil.example' } })).status).toBe(403)
  })
})

describe('security headers', () => {
  it('are set on every API response, including refusals and 404s', async () => {
    for (const r of [await req('/api/pets'), await req('/api/nope'), await req('/api/pets', { headers: { Host: 'evil.example' } })]) {
      expect(r.headers['x-content-type-options']).toBe('nosniff')
      expect(r.headers['x-frame-options']).toBe('DENY')
      expect(r.headers['referrer-policy']).toBe('no-referrer')
      expect(r.headers['cross-origin-resource-policy']).toBe('same-origin')
      expect(r.headers['content-security-policy']).toContain("default-src 'none'")
      expect(r.headers['cache-control']).toBe('no-store')
      expect(r.headers['x-powered-by']).toBeUndefined()
    }
  })
  it('never sends CORS headers, so no other site can read responses', async () => {
    const r = await req('/api/pets', { headers: { Origin: 'http://localhost:5173' } })
    expect(Object.keys(r.headers).filter((h) => h.startsWith('access-control'))).toEqual([])
  })
})
