import express, { Router } from 'express'
import { ApiError } from '../lib/errors.js'
import { fieldErrors, petInputSchema } from '../lib/petSchema.js'
import { computeCompleteness } from '../services/completeness.js'

const FRIENDLY_VALIDATION = 'Something needs a quick look. Check the highlighted fields.'

function serialize(db, row) {
  const photos = db
    .prepare('SELECT slot FROM pet_photos WHERE pet_id = ? ORDER BY slot')
    .all(row.id)
    .map((p) => p.slot)
  const pet = {
    id: row.id,
    name: row.name,
    species: row.species,
    sex: row.sex,
    neutered: row.neutered,
    birthdate: row.birthdate,
    birthdate_estimated: !!row.birthdate_estimated,
    breed: row.breed,
    weight_kg: row.weight_kg,
    activity_level: row.activity_level,
    diet_type: row.diet_type,
    allergies: row.allergies == null ? null : JSON.parse(row.allergies),
    conditions: row.conditions == null ? null : JSON.parse(row.conditions),
    notes: row.notes,
    photos,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
  const { percent, next } = computeCompleteness({ ...pet, photoCount: photos.length })
  return { ...pet, completeness: percent, next_suggestion: next }
}

function toColumns(d) {
  return {
    ...d,
    allergies: d.allergies == null ? null : JSON.stringify(d.allergies),
    conditions: d.conditions == null ? null : JSON.stringify(d.conditions),
  }
}

function parseBody(body) {
  const result = petInputSchema.safeParse(body ?? {})
  if (!result.success) {
    throw new ApiError(422, 'VALIDATION', FRIENDLY_VALIDATION, fieldErrors(result.error))
  }
  return result.data
}

export default function petsRoutes(db) {
  const router = Router()
  router.use(express.json({ limit: '100kb' }))

  const getRow = (id) => {
    const row = db.prepare('SELECT * FROM pets WHERE id = ?').get(Number(id))
    if (!row) throw new ApiError(404, 'NOT_FOUND', "Pawelle couldn't find that cat.")
    return row
  }

  router.get('/pets', (_req, res) => {
    const rows = db.prepare('SELECT * FROM pets ORDER BY id').all()
    res.json(rows.map((r) => serialize(db, r)))
  })

  router.post('/pets', (req, res) => {
    const data = toColumns(parseBody(req.body))
    if (db.prepare('SELECT COUNT(*) AS c FROM pets').get().c > 0) {
      throw new ApiError(
        409,
        'ALREADY_EXISTS',
        'Pawelle looks after one cat for now, and a profile already exists.',
      )
    }
    const info = db
      .prepare(
        `INSERT INTO pets (name, sex, neutered, birthdate, birthdate_estimated, breed, weight_kg,
                           activity_level, diet_type, allergies, conditions, notes)
         VALUES (@name, @sex, @neutered, @birthdate, @birthdate_estimated, @breed, @weight_kg,
                 @activity_level, @diet_type, @allergies, @conditions, @notes)`,
      )
      .run(data)
    res.status(201).json(serialize(db, getRow(info.lastInsertRowid)))
  })

  router.get('/pets/:id', (req, res) => {
    res.json(serialize(db, getRow(req.params.id)))
  })

  router.put('/pets/:id', (req, res) => {
    getRow(req.params.id)
    const data = toColumns(parseBody(req.body))
    db.prepare(
      `UPDATE pets SET name=@name, sex=@sex, neutered=@neutered, birthdate=@birthdate,
         birthdate_estimated=@birthdate_estimated, breed=@breed, weight_kg=@weight_kg,
         activity_level=@activity_level, diet_type=@diet_type, allergies=@allergies,
         conditions=@conditions, notes=@notes, updated_at=datetime('now')
       WHERE id=@id`,
    ).run({ ...data, id: Number(req.params.id) })
    res.json(serialize(db, getRow(req.params.id)))
  })

  router.delete('/pets/:id', (req, res) => {
    getRow(req.params.id)
    db.prepare('DELETE FROM pets WHERE id = ?').run(Number(req.params.id))
    res.status(204).end()
  })

  return router
}
