import MetricService from "../api/metrics/service";
import Aave from "./aave";
import BigNumber from "bignumber.js";
import {rayToDecimalString} from "./aave-helpers";

export enum GAUGE_NAMES {
    aave_borrow_apy = 'aave_borrow_apy',
}

export class AAVEMetrics {
    private readonly metricsService: MetricService;
    private readonly intervals: NodeJS.Timeout[] = [];
    private readonly aaveCoinServices: { aave: Aave, coin: string }[] = [];

    constructor(aaveServices: { aave: Aave, coin: string }[]) {
        this.metricsService = MetricService.instanceOf();
        this.aaveCoinServices = aaveServices;
    }
    start(){
        const gauges = [
            {
                name: GAUGE_NAMES.aave_borrow_apy,
                help: "Borrow APY payable by the bot",
                labelNames: ["coin", "networkType"],
                collect: this.getAllBorrowAPYs.bind(this),
                collectIntervalMs: process.env.AAVE_METRICS_INTERVAL_MS ? parseInt(process.env.AAVE_METRICS_INTERVAL_MS) : 10000
            }
        ];
        gauges.map(gauge => {
            this.metricsService.createGauge(gauge.name, gauge.help, gauge.labelNames);
            this.intervals.push(setInterval(gauge.collect, gauge.collectIntervalMs))
        })
    }

    stop(){
        this.intervals.map(interval => {
            clearInterval(interval);
        })
    }

    async getAllBorrowAPYs(): Promise<void> {
        await Promise.all(this.aaveCoinServices.map(async ({aave, coin}) => {
            try {
                const reserveData = await aave.getCoinReserveData(coin);
                const borrowRate = new BigNumber(rayToDecimalString(reserveData.raw.variableBorrowRate));
                this.metricsService.updateGauge(
                    GAUGE_NAMES.aave_borrow_apy,
                    Number(borrowRate.toFixed(5)),
                    { coin: coin.toLowerCase(), networkType: aave.networkType }
                )
            } catch (e) {
                console.error("could not update borrow metrics", e)
            }
        }))
    }
}
