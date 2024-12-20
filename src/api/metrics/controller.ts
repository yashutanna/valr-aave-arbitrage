import MetricService from './service'
import type { Request, Response } from 'express'

export default class MetricsController {
  private readonly metricService: MetricService

  constructor () {
    this.metricService = MetricService.instanceOf()
    this.getMetrics = this.getMetrics.bind(this)
  }

  async getMetrics (_: Request, res: Response): Promise<void> {
    const metrics = await this.metricService.getMetrics();
    res
      .status(200)
      .type('text/plain; charset=utf-8')
      .send(metrics)
  }
}
