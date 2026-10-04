import { Router } from 'express'

export default function healthRoutes(ai) {
  const router = Router()
  router.get('/health', async (_req, res) => {
    res.json({ server: 'ok', ollama: await ai.health() })
  })
  return router
}
