import { createApp } from './app.js'
import { openDatabase } from './db/index.js'
import { createOllama } from './services/ollama.js'

const PORT = Number(process.env.PAWELLE_PORT) || 3001
const db = openDatabase({ file: process.env.PAWELLE_DB })
// OLLAMA_URL must be localhost; the client refuses anything else.
const ai = createOllama({ url: process.env.OLLAMA_URL, model: process.env.OLLAMA_MODEL })

createApp({ db, ai }).listen(PORT, '127.0.0.1', () => {
  console.log(`Pawelle server on http://127.0.0.1:${PORT} (AI model: ${ai.model})`)
  // Load the model in the background so the first plan is quicker.
  ai.health().then((h) => h.running && h.modelReady && ai.warm())
})
