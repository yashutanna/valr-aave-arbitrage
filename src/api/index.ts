import express from 'express'
import getMetricsRouter from './metrics/router'

const api = express()

const metricsRouter = getMetricsRouter()

api.use('/metrics', metricsRouter)

export default api
