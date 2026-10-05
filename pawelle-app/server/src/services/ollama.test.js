import { describe, expect, it } from 'vitest'
import { OllamaError, assertLocalUrl, createOllama } from './ollama.js'

const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
const refused = () => { const e = new TypeError('fetch failed'); e.cause = { code: 'ECONNREFUSED' }; throw e }
const timeout = () => { throw new DOMException('timed out', 'TimeoutError') }
const make = (fetchImpl) => createOllama({ url: 'http://127.0.0.1:11434', model: 'gemma3:1b', fetchImpl })
const rejects = async (p) => p.then(() => null, (e) => e)

describe('URL guard (Constitution I.2)', () => {
  it('accepts only this computer', () => {
    for (const u of ['http://127.0.0.1:11434', 'http://localhost:11434', 'http://[::1]:11434/']) expect(() => assertLocalUrl(u)).not.toThrow()
    for (const u of ['http://example.com:11434', 'http://192.168.1.20:11434', 'https://api.openai.com']) expect(() => assertLocalUrl(u)).toThrow(/localhost/)
    expect(() => createOllama({ url: 'http://evil.example' })).toThrow()
  })
})

describe('chat', () => {
  it('sends the schema and returns the parsed answer', async () => {
    let sent
    const ai = make(async (url, init) => { sent = { url, body: JSON.parse(init.body) }; return json({ message: { content: '{"summary":"hi"}' } }) })
    expect(await ai.chat({ messages: [{ role: 'user', content: 'x' }], schema: { type: 'object' } })).toEqual({ summary: 'hi' })
    expect(sent.url).toBe('http://127.0.0.1:11434/api/chat')
    expect(sent.body).toMatchObject({ model: 'gemma3:1b', stream: false, format: { type: 'object' } })
    expect(sent.body.options.temperature).toBe(0.3)
  })
  it('never follows a redirect to somewhere else', async () => {
    let init
    const ai = make(async (_url, i) => { init = i; return json({ message: { content: '{}' } }) })
    await ai.chat({ messages: [], schema: {} })
    expect(init.redirect).toBe('error')
  })
  it('maps a refused connection to offline (AC17)', async () => {
    const e = await rejects(make(refused).chat({ messages: [], schema: {} }))
    expect(e).toBeInstanceOf(OllamaError)
    expect(e.kind).toBe('offline')
  })
  it('maps a 404 to model_missing, a timeout to timeout, and junk to bad_output', async () => {
    expect((await rejects(make(async () => json({ error: 'model not found' }, 404)).chat({ messages: [], schema: {} }))).kind).toBe('model_missing')
    expect((await rejects(make(timeout).chat({ messages: [], schema: {} }))).kind).toBe('timeout')
    expect((await rejects(make(async () => json({ message: { content: 'not json' } })).chat({ messages: [], schema: {} }))).kind).toBe('bad_output')
    expect((await rejects(make(async () => json({}, 500)).chat({ messages: [], schema: {} }))).kind).toBe('error')
  })
})

describe('health', () => {
  it('reports running and ready when the model is listed', async () => {
    const ai = make(async () => json({ models: [{ name: 'gemma3:1b', model: 'gemma3:1b' }] }))
    expect(await ai.health()).toEqual({ running: true, model: 'gemma3:1b', modelReady: true })
  })
  it('reports running but not ready when the model is missing', async () => {
    const ai = make(async () => json({ models: [{ name: 'llama3:8b' }] }))
    expect(await ai.health()).toEqual({ running: true, model: 'gemma3:1b', modelReady: false })
  })
  it('reports not running when Ollama cannot be reached', async () => {
    expect(await make(refused).health()).toEqual({ running: false, model: 'gemma3:1b', modelReady: false })
  })
  it('warm never throws', async () => {
    await expect(make(refused).warm()).resolves.toBeUndefined()
  })
})
