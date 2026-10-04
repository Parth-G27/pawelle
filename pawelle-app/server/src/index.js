import { createApp } from './app.js'
import { openDatabase } from './db/index.js'

const PORT = Number(process.env.PAWELLE_PORT) || 3001
const db = openDatabase()
createApp({ db }).listen(PORT, '127.0.0.1', () => {
  console.log(`Pawelle server on http://127.0.0.1:${PORT}`)
})
