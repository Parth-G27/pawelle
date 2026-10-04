import express from 'express'
import { errorHandler, notFound } from './lib/errors.js'
import checkinsRoutes from './routes/checkins.js'
import healthRoutes from './routes/health.js'
import petsRoutes from './routes/pets.js'
import photosRoutes from './routes/photos.js'
import plansRoutes from './routes/plans.js'
import { OllamaError } from './services/ollama.js'
import { createPlanService } from './services/planService.js'

// Used when no AI client is given (for example in tests that don't need one).
const noAi = {
  model: 'none',
  health: async () => ({ running: false, model: 'none', modelReady: false }),
  chat: async () => {
    throw new OllamaError('offline')
  },
}

export function createApp({ db, ai = noAi, planOptions } = {}) {
  const app = express()
  app.disable('x-powered-by')
  const plans = createPlanService({ db, ai, ...planOptions })
  app.use('/api', healthRoutes(ai))
  app.use('/api', photosRoutes(db))
  app.use('/api', petsRoutes(db))
  app.use('/api', checkinsRoutes(db))
  app.use('/api', plansRoutes(db, plans))
  app.use('/api', notFound)
  app.use(errorHandler)
  return app
}
