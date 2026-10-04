import Database from 'better-sqlite3'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_DIR = path.resolve(here, '../../../data')

// Numbered upgrade steps. Step N upgrades schema version N-1 to N.
// Empty for now: version 1 is the schema in schema.sql.
export const MIGRATIONS = []
export const SCHEMA_VERSION = 1 + MIGRATIONS.length

export const KEEP_BACKUPS = 5

// The database holds a family's pet details and photos: keep it private to this user.
// (Best effort: not every file system supports Unix permissions.)
const lock = (target, mode) => {
  try {
    fs.chmodSync(target, mode)
  } catch {
    /* ignore */
  }
}

// Copy an existing database file into backups/, keep only the newest few.
export function backupDatabase(file, backupDir, keep = KEEP_BACKUPS) {
  if (!fs.existsSync(file)) return null
  if (fs.mkdirSync(backupDir, { recursive: true })) lock(backupDir, 0o700)
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const target = path.join(backupDir, `pawelle-${stamp}.db`)
  fs.copyFileSync(file, target)
  lock(target, 0o600)
  const backups = fs
    .readdirSync(backupDir)
    .filter((f) => f.startsWith('pawelle-') && f.endsWith('.db'))
    .sort()
  for (const old of backups.slice(0, Math.max(0, backups.length - keep))) {
    fs.rmSync(path.join(backupDir, old))
  }
  return target
}

// Run pending upgrade steps, tracked with SQLite's built-in user_version.
export function migrate(db, migrations = MIGRATIONS) {
  const target = 1 + migrations.length
  let version = db.pragma('user_version', { simple: true })
  if (version === 0) version = 1 // fresh or version-1 database
  while (version < target) {
    const step = migrations[version - 1]
    db.transaction(() => step(db))()
    version += 1
  }
  db.pragma(`user_version = ${version}`)
  return version
}

export function openDatabase({ file, backupDir } = {}) {
  const dbFile = file ?? path.join(DEFAULT_DIR, 'pawelle.db')
  if (dbFile !== ':memory:') {
    if (fs.mkdirSync(path.dirname(dbFile), { recursive: true })) lock(path.dirname(dbFile), 0o700)
    backupDatabase(dbFile, backupDir ?? path.join(path.dirname(dbFile), 'backups'))
  }
  const db = new Database(dbFile)
  db.pragma('journal_mode = WAL')
  if (dbFile !== ':memory:') for (const suffix of ['', '-wal', '-shm']) lock(dbFile + suffix, 0o600)
  db.pragma('foreign_keys = ON')
  db.exec(fs.readFileSync(path.join(here, 'schema.sql'), 'utf8'))
  migrate(db)
  return db
}
