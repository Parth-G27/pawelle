import { addDaysIso, utcToday } from '../lib/dates.js'
import { getCheckin } from './checkins.js'

export const getPlanRow = (db, petId, date, kind = 'daily') =>
  db.prepare('SELECT * FROM plans WHERE pet_id = ? AND date = ? AND kind = ?').get(petId, date, kind) ?? null

// One plan per cat per day: saving again replaces it.
export function upsertPlanRow(db, { petId, date, kind = 'daily', source, model, reason, content, checkinStamp }) {
  db.prepare(
    `INSERT INTO plans (pet_id, date, kind, source, model, reason, content, checkin_stamp)
     VALUES (@petId, @date, @kind, @source, @model, @reason, @content, @checkinStamp)
     ON CONFLICT (pet_id, date, kind) DO UPDATE SET
       source = excluded.source, model = excluded.model, reason = excluded.reason,
       content = excluded.content, checkin_stamp = excluded.checkin_stamp,
       updated_at = datetime('now')`,
  ).run({
    petId, date, kind, source, model: model ?? null, reason: reason ?? null,
    content: JSON.stringify(content), checkinStamp: checkinStamp ?? null,
  })
  return getPlanRow(db, petId, date, kind)
}

// Newest first. The window is generous by a day (the server does not know the local date).
export function listPlanRows(db, petId, days = 30, now = new Date()) {
  const from = addDaysIso(utcToday(now), 1 - days)
  return db
    .prepare("SELECT * FROM plans WHERE pet_id = ? AND kind = 'daily' AND date >= ? ORDER BY date DESC")
    .all(petId, from)
}

// The check-in "stamp" a plan was made from; a different stamp later means the plan is stale.
export const checkinStamp = (db, petId, date) => getCheckin(db, petId, date)?.updated_at ?? null
export const isStale = (row, currentStamp) => (row.checkin_stamp ?? null) !== (currentStamp ?? null)
