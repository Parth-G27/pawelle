import express, { Router } from 'express'
import { ApiError } from '../lib/errors.js'
import { sniffImage } from '../lib/image.js'

export const MAX_PHOTO_BYTES = 1024 * 1024

const NOT_IMAGE =
  'Pawelle only takes photos, not videos. Try a JPG, PNG or WebP picture.'

export default function photosRoutes(db) {
  const router = Router()

  const requirePet = (id) => {
    if (!db.prepare('SELECT 1 FROM pets WHERE id = ?').get(Number(id))) {
      throw new ApiError(404, 'NOT_FOUND', "Pawelle couldn't find that cat.")
    }
    return Number(id)
  }

  const parseSlot = (raw) => {
    const slot = Number(raw)
    if (slot !== 1 && slot !== 2) {
      throw new ApiError(
        400,
        'TOO_MANY_PHOTOS',
        'A cat can have two photos. Replace one of them instead.',
      )
    }
    return slot
  }

  const slotsOf = (petId) =>
    db.prepare('SELECT slot FROM pet_photos WHERE pet_id = ? ORDER BY slot').all(petId).map((r) => r.slot)

  router.put(
    '/pets/:id/photos/:slot',
    express.raw({ type: () => true, limit: MAX_PHOTO_BYTES }),
    (req, res) => {
      const petId = requirePet(req.params.id)
      let slot = parseSlot(req.params.slot)
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        throw new ApiError(415, 'NOT_AN_IMAGE', NOT_IMAGE)
      }
      const mime = sniffImage(req.body)
      if (!mime) throw new ApiError(415, 'NOT_AN_IMAGE', NOT_IMAGE)
      // No gaps: a second photo with no first photo becomes the first.
      if (slot === 2 && !slotsOf(petId).includes(1)) slot = 1
      db.prepare(
        `INSERT INTO pet_photos (pet_id, slot, mime, data) VALUES (?, ?, ?, ?)
         ON CONFLICT (pet_id, slot) DO UPDATE SET mime = excluded.mime, data = excluded.data,
           updated_at = datetime('now')`,
      ).run(petId, slot, mime, req.body)
      res.status(200).json({ photos: slotsOf(petId) })
    },
  )

  router.get('/pets/:id/photos/:slot', (req, res) => {
    const petId = requirePet(req.params.id)
    const slot = parseSlot(req.params.slot)
    const row = db
      .prepare('SELECT mime, data, updated_at FROM pet_photos WHERE pet_id = ? AND slot = ?')
      .get(petId, slot)
    if (!row) throw new ApiError(404, 'NOT_FOUND', "Pawelle couldn't find that photo.")
    const etag = `"${petId}-${slot}-${row.updated_at}-${row.data.length}"`
    res.set('ETag', etag)
    res.set('Cache-Control', 'no-cache')
    if (req.headers['if-none-match'] === etag) return res.status(304).end()
    res.type(row.mime).send(row.data)
  })

  router.delete('/pets/:id/photos/:slot', (req, res) => {
    const petId = requirePet(req.params.id)
    const slot = parseSlot(req.params.slot)
    db.transaction(() => {
      db.prepare('DELETE FROM pet_photos WHERE pet_id = ? AND slot = ?').run(petId, slot)
      // Close the gap: if the avatar was removed, photo 2 becomes photo 1.
      if (slot === 1) {
        db.prepare('UPDATE pet_photos SET slot = 1 WHERE pet_id = ? AND slot = 2').run(petId)
      }
    })()
    res.json({ photos: slotsOf(petId) })
  })

  return router
}
