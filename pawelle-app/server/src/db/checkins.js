import { addDaysIso, utcToday } from '../lib/dates.js'
import { checkinFlags } from '../services/safety.js'

const FIELDS = ['mood', 'appetite', 'energy', 'play_minutes', 'litter', 'note']

export function getCheckin(db, petId, date) {
  return db.prepare('SELECT * FROM checkins WHERE pet_id = ? AND date = ?').get(petId, date) ?? null
}

// Create or update that day's check-in (one per cat per day).
export function upsertCheckin(db, petId, date, data) {
  db.prepare(
    `INSERT INTO checkins (pet_id, date, mood, appetite, energy, play_minutes, litter, note)
     VALUES (@pet_id, @date, @mood, @appetite, @energy, @play_minutes, @litter, @note)
     ON CONFLICT (pet_id, date) DO UPDATE SET
       mood = excluded.mood, appetite = excluded.appetite, energy = excluded.energy,
       play_minutes = excluded.play_minutes, litter = excluded.litter, note = excluded.note,
       updated_at = datetime('now')`,
  ).run({ pet_id: petId, date, ...data })
  return getCheckin(db, petId, date)
}

// Attach heads-up flags, comparing each day with the stored check-in for the day before.
export function withFlags(db, pet, row) {
  const previous = getCheckin(db, pet.id, addDaysIso(row.date, -1))
  const out = { id: row.id, date: row.date }
  for (const f of FIELDS) out[f] = row[f]
  out.created_at = row.created_at
  out.updated_at = row.updated_at
  out.flags = checkinFlags(row, previous, pet.name)
  return out
}

// Newest first. The window is generous by one day because the server does not know the
// owner's local date; the client trims what it shows.
export function listCheckins(db, petId, days = 14, now = new Date()) {
  const from = addDaysIso(utcToday(now), 1 - days)
  return db
    .prepare('SELECT * FROM checkins WHERE pet_id = ? AND date >= ? ORDER BY date DESC')
    .all(petId, from)
}

// For feature 003 (AI plan): the last few days as structured data, with flags.
export function listRecentCheckins(db, petId, days = 7, now = new Date()) {
  const pet = db.prepare('SELECT id, name FROM pets WHERE id = ?').get(petId)
  if (!pet) return []
  return listCheckins(db, petId, days, now).map((row) => withFlags(db, pet, row))
}
