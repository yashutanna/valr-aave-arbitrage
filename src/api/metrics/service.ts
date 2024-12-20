import { Gauge, register, collectDefaultMetrics } from 'prom-client'

export default class MetricService {
  private gauges: Record<string, Gauge<string>>
  private static instance: MetricService

  private constructor () {
    // Initialize the collection of Gauge instances
    this.gauges = {}

    // Collect default metrics (CPU, memory, etc.)
    // collectDefaultMetrics()
  }

  static instanceOf (): MetricService {
    if (this.instance !== undefined) {
      return this.instance
    } else {
      this.instance = new MetricService()
      return this.instance
    }
  }

  /**
     * Create or get an existing Gauge
     * @param name - The unique name of the Gauge
     * @param help - A description of what the Gauge measures (for Prometheus UI)
     * @param labels - An array of label names (optional) for distinguishing metrics
     */
  public createGauge (name: string, help: string, labels?: string[]): void {
    if (this.gauges[name]) {
      console.warn(`Gauge with name "${name}" already exists.`)
      return
    }

    // Create a new Gauge instance and store it
    this.gauges[name] = new Gauge({
      name,
      help,
      labelNames: labels ? labels : [],
      registers: [register] // Automatically register with the default registry
    })
  }

  /**
     * Update the value of a Gauge
     * @param name - The name of the Gauge to update
     * @param value - The numeric value to set
     * @param labelValues - (Optional) Labels to specify in case of labeled metrics
     */
  public updateGauge (name: string, value: number, labelValues?: Record<string, string>): void {
    const gauge = this.gauges[name]

    if (!gauge) {
      throw new Error(`Gauge with name "${name}" does not exist.`)
    }

    if (labelValues) {
      gauge.set(labelValues, value) // For labeled metrics
    } else {
      gauge.set(value) // For metrics without labels
    }
  }

  /**
     * Get all registered metrics in Prometheus-compatible format
     */
  public async getMetrics (): Promise<string> {
    return await register.metrics()
  }
}
