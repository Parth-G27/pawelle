// A thin client for Ollama running on THIS machine. No other network target is allowed (Constitution I.2).
export class OllamaError extends Error {
  constructor(kind, message) {
    super(message ?? kind)
    this.kind = kind // 'offline' | 'model_missing' | 'timeout' | 'bad_output' | 'error'
  }
}

export const DEFAULT_URL = 'http://127.0.0.1:11434'
export const DEFAULT_MODEL = 'gemma3:1b'
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

export function assertLocalUrl(url) {
  const host = new URL(url).hostname
  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(`OLLAMA_URL must point at this computer (localhost), not "${host}".`)
  }
  return url.replace(/\/$/, '')
}

const isTimeout = (e) => e?.name === 'TimeoutError' || e?.name === 'AbortError'

export function createOllama({ url = DEFAULT_URL, model = DEFAULT_MODEL, fetchImpl = fetch } = {}) {
  const base = assertLocalUrl(url)

  async function call(path, init, timeoutMs) {
    try {
      return await fetchImpl(`${base}${path}`, { ...init, signal: AbortSignal.timeout(timeoutMs) })
    } catch (e) {
      if (isTimeout(e)) throw new OllamaError('timeout')
      throw new OllamaError('offline')
    }
  }

  return {
    model,

    // -> the parsed JSON object the model returned
    async chat({ messages, schema, timeoutMs = 60_000 }) {
      const res = await call(
        '/api/chat',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages,
            stream: false,
            format: schema,
            keep_alive: '10m',
            options: { temperature: 0.3, num_ctx: 4096, num_predict: 700 },
          }),
        },
        timeoutMs,
      )
      if (res.status === 404) throw new OllamaError('model_missing')
      if (!res.ok) throw new OllamaError('error', `Ollama returned ${res.status}`)
      let body
      try {
        body = await res.json()
        return JSON.parse(body.message.content)
      } catch {
        throw new OllamaError('bad_output')
      }
    },

    // -> { running, model, modelReady }
    async health() {
      try {
        const res = await call('/api/tags', { method: 'GET' }, 1500)
        if (!res.ok) return { running: true, model, modelReady: false }
        const { models = [] } = await res.json()
        const ready = models.some((m) => [m.name, m.model].some((n) => n === model || n === `${model}:latest`))
        return { running: true, model, modelReady: ready }
      } catch {
        return { running: false, model, modelReady: false }
      }
    },

    // Load the model into memory in the background so the first plan is quicker.
    async warm() {
      try {
        await call('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model, messages: [], keep_alive: '10m' }) }, 30_000)
      } catch {
        /* ignore: warming is best effort */
      }
    },
  }
}
