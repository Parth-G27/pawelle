import express, { Router } from 'express'
import { ApiError } from '../lib/errors.js'
import { parseCheckinDate } from '../lib/dates.js'
import { getPet } from '../db/pets.js'
import { listPlanRows } from '../db/plans.js'

export default function plansRoutes(db, service) {
  const router = Router()
  router.use(express.json({ limit: '10kb' }))

  const requirePet = (id) => {
    const pet = getPet(db, id)
    if (!pet) throw new ApiError(404, 'NOT_FOUND', "Pawelle couldn't find that cat.")
    return pet
  }
  const requireDate = (value) => {
    const d = parseCheckinDate(value)
    if (!d.ok) throw new ApiError(422, 'VALIDATION', d.message, { date: d.message })
    return d.date
  }

  router.get('/pets/:id/plans/:date', (req, res) => {
    const pet = requirePet(req.params.id)
    res.json(service.getState(pet, requireDate(req.params.date)))
  })

  router.post('/pets/:id/plans/:date/generate', async (req, res) => {
    const pet = requirePet(req.params.id)
    const date = requireDate(req.params.date)
    const mode = req.body?.mode === 'basic' ? 'basic' : undefined
    res.json(await service.generate(pet, date, { mode }))
  })

  router.get('/pets/:id/plans', (req, res) => {
    const pet = requirePet(req.params.id)
    const asked = Number.parseInt(req.query.days, 10)
    const days = Number.isFinite(asked) ? Math.min(90, Math.max(1, asked)) : 30
    res.json(
      listPlanRows(db, pet.id, days).map((row) => ({
        date: row.date,
        source: row.source,
        model: row.model,
        summary: JSON.parse(row.content).summary,
      })),
    )
  })

  return router
}
