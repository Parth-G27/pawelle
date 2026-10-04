import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../data')

// Reviewable data lives in server/src/data/*.json so it can be edited without touching code.
export const loadJson = (name) => JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'))
