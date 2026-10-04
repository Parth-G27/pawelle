import express, { Router } from 'express'
import { ApiError } from '../lib/errors.js'
import { checkinInputSchema } from '../lib/checkinSchema.js'
import { parseCheckinDate } from '../lib/dates.js'
import { fieldErrors } from '../lib/petSchema.js'
import { listCheckins, upsertCheckin, withFlags } from '../db/checkins.js'

export const DEFAULT_DAYS = 14
export const MAX_DAYS = 90

export default function checkinsRoutes(db) {
  const router = Router()
  router.use(express.json({ limit: '50kb' }))

  const requirePet = (id) => {
    const pet = db.prepare('SELECT id, name FROM pets WHERE id = ?').get(Number(id))
    if (!pet) throw new ApiError(404, 'NOT_FOUND', "Pawelle couldn't find that cat.")
    return pet
  }

  router.put('/pets/:id/checkins/:date', (req, res) => {
    const pet = requirePet(req.params.id)
    const date = parseCheckinDate(req.params.date)
    if (!date.ok) throw new ApiError(422, 'VALIDATION', date.message, { date: date.message })
    const parsed = checkinInputSchema.safeParse(req.body ?? {})
    if (!parsed.success) {
      const fields = fieldErrors(parsed.error)
      const message = fields._ ?? 'Something needs a quick look. Check the highlighted answers.'
      throw new ApiError(422, 'VALIDATION', message, fields)
    }
    const row = upsertCheckin(db, pet.id, date.date, parsed.data)
    res.json(withFlags(db, pet, row))
  })

  router.get('/pets/:id/checkins', (req, res) => {
    const pet = requirePet(req.params.id)
    const asked = Number.parseInt(req.query.days, 10)
    const days = Number.isFinite(asked) ? Math.min(MAX_DAYS, Math.max(1, asked)) : DEFAULT_DAYS
    res.json(listCheckins(db, pet.id, days).map((row) => withFlags(db, pet, row)))
  })

  return router
}
