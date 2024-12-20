import { Router } from 'express'
import bodyParser from 'body-parser'
import MetricsController from './controller'

export default function getMetricsRouter (): Router {
  const controller = new MetricsController()

  const router = Router()
  router.use(bodyParser.json())
  router.get('/', controller.getMetrics)

  return router
}
