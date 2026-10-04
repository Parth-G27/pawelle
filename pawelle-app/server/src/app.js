import express from 'express'
import { errorHandler, notFound } from './lib/errors.js'
import healthRoutes from './routes/health.js'
import petsRoutes from './routes/pets.js'
import photosRoutes from './routes/photos.js'

export function createApp({ db }) {
  const app = express()
  app.disable('x-powered-by')
  app.use('/api', healthRoutes)
  app.use('/api', photosRoutes(db))
  app.use('/api', petsRoutes(db))
  app.use('/api', notFound)
  app.use(errorHandler)
  return app
}
