import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import Database from 'better-sqlite3'
import { backupDatabase, migrate, openDatabase } from './index.js'

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'pawelle-'))

describe('backupDatabase', () => {
  it('returns null when there is nothing to back up', () => {
    const dir = tmp()
    expect(backupDatabase(path.join(dir, 'nope.db'), path.join(dir, 'b'))).toBeNull()
  })

  it('keeps only the newest backups', () => {
    const dir = tmp()
    const file = path.join(dir, 'pawelle.db')
    fs.writeFileSync(file, 'x')
    const bdir = path.join(dir, 'b')
    fs.mkdirSync(bdir)
    for (let i = 1; i <= 6; i++) fs.writeFileSync(path.join(bdir, `pawelle-2020-0${i}.db`), 'old')
    backupDatabase(file, bdir, 5)
    const left = fs.readdirSync(bdir).sort()
    expect(left).toHaveLength(5)
    expect(left).not.toContain('pawelle-2020-01.db')
    expect(left).not.toContain('pawelle-2020-02.db')
  })
})

describe('migrate', () => {
  it('runs each upgrade step once and records the version', () => {
    const db = new Database(':memory:')
    const calls = []
    const steps = [(d) => { calls.push(2); d.exec('CREATE TABLE a (x)') }]
    expect(migrate(db, steps)).toBe(2)
    expect(migrate(db, steps)).toBe(2)
    expect(calls).toEqual([2])
    expect(db.pragma('user_version', { simple: true })).toBe(2)
  })
})

describe('openDatabase', () => {
  it('creates the schema, turns on foreign keys, and backs up on restart', () => {
    const dir = tmp()
    const file = path.join(dir, 'pawelle.db')
    const db = openDatabase({ file })
    expect(db.pragma('foreign_keys', { simple: true })).toBe(1)
    expect(db.prepare("select count(*) c from sqlite_master where name in ('pets','pet_photos','checkins','plans')").get().c).toBe(4)
    db.close()
    openDatabase({ file }).close()
    expect(fs.readdirSync(path.join(dir, 'backups'))).toHaveLength(1)
  })
})

describe('database privacy on disk', () => {
  it.skipIf(process.platform === 'win32')('keeps the database and its backups private to this user (0600)', () => {
    const dir = tmp()
    const file = path.join(dir, 'data', 'pawelle.db')
    openDatabase({ file }).close()
    openDatabase({ file }).close() // second start makes a backup
    const mode = (f) => fs.statSync(f).mode & 0o777
    expect(mode(file)).toBe(0o600)
    const backups = path.join(dir, 'data', 'backups')
    expect(mode(backups)).toBe(0o700)
    for (const f of fs.readdirSync(backups)) expect(mode(path.join(backups, f))).toBe(0o600)
    expect(mode(path.join(dir, 'data'))).toBe(0o700)
  })
})
