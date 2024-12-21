import MetricService from "../api/metrics/service";
import Valr, {VALR_EARN_TYPES} from "./valr";
import BigNumber from "bignumber.js";

export enum GAUGE_NAMES {
    valr_upcoming_lend_rate = 'valr_upcoming_lend_rate',
    valr_lend_rate = 'valr_lend_rate',
    valr_defi_lend_rate = 'valr_defi_lend_rate',
    valr_stake_rate = 'valr_stake_rate',
    valr_eth_price = 'valr_eth_price',
}

export class ValrMetrics {
    private readonly metricsService: MetricService;
    private readonly intervals: NodeJS.Timeout[] = [];
    private readonly valr: Valr;

    constructor(valr: Valr) {
        this.metricsService = MetricService.instanceOf();
        this.valr = valr;
    }
    start(){
        const nonCollectionGauge = [
            {
                name: GAUGE_NAMES.valr_upcoming_lend_rate,
                help: "Upcoming estimated Lend APY at VALR",
                labelNames: ["coin"],
            },
            {
                name: GAUGE_NAMES.valr_stake_rate,
                help: "Upcoming estimated Stake APY at VALR",
                labelNames: ["coin"],
            }
        ];
        nonCollectionGauge.map(gauge => {
            this.metricsService.createGauge(gauge.name, gauge.help, gauge.labelNames);
        })
        const gauges = [
            {
                name: GAUGE_NAMES.valr_lend_rate,
                help: "Lend APY earned at VALR by the bot",
                labelNames: ["coin"],
                collect: this.getLendAPYs.bind(this),
                collectIntervalMs: process.env.VALR_LEND_RATE_METRIC_INTERVAL ? parseInt(process.env.VALR_LEND_RATE_METRIC_INTERVAL) : 10000
            },
            {
                name: GAUGE_NAMES.valr_defi_lend_rate,
                help: " Defi  Lend APY earned at VALR by the bot",
                labelNames: ["coin"],
                collect: this.getStakingRates.bind(this),
                collectIntervalMs: process.env.VALR_DEFI_LEND_RATE_METRIC_INTERVAL ? parseInt(process.env.VALR_DEFI_LEND_RATE_METRIC_INTERVAL) : 10000
            },
            {
                name: GAUGE_NAMES.valr_eth_price,
                help: "ETH USDC price at VALR",
                labelNames: [],
                collect: this.getValrEthPrice.bind(this),
                collectIntervalMs: process.env.VALR_ETH_PRICE_METRIC_INTERVAL ? parseInt(process.env.VALR_ETH_PRICE_METRIC_INTERVAL) : 10000
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

    async getLendAPYs(): Promise<void> {
        try {
            const lendingRates = await this.valr.getLendingRates();

            await Promise.all(lendingRates.map(async ({currency, estimatedNextRate, previousFundingRate}) => {
                this.metricsService.updateGauge(
                    GAUGE_NAMES.valr_upcoming_lend_rate,
                    Number(new BigNumber(estimatedNextRate).multipliedBy(24).multipliedBy(365)),
                    { coin: currency.toLowerCase() }
                )
                this.metricsService.updateGauge(
                    GAUGE_NAMES.valr_lend_rate,
                    Number(new BigNumber(previousFundingRate).multipliedBy(24).multipliedBy(365)),
                    { coin: currency.toLowerCase() }
                )
            }))
        } catch (e) {
            console.error("could not update borrow metrics", e)
        }
    }
    async getStakingRates(): Promise<void> {
        try {
            const lendingRates = await this.valr.getStakingRates(VALR_EARN_TYPES.LEND);
            await Promise.all(lendingRates.map(async ({currencySymbol, rate}) => {
                this.metricsService.updateGauge(
                    GAUGE_NAMES.valr_defi_lend_rate,
                    Number(new BigNumber(rate).multipliedBy(24).multipliedBy(365)),
                    { coin: currencySymbol.toLowerCase() }
                )
            }))
            const stakingRates = await this.valr.getStakingRates(VALR_EARN_TYPES.STAKE);
            await Promise.all(stakingRates.map(async ({currencySymbol, rate}) => {
                this.metricsService.updateGauge(
                    GAUGE_NAMES.valr_stake_rate,
                    Number(new BigNumber(rate).multipliedBy(24).multipliedBy(365)),
                    { coin: currencySymbol.toLowerCase() }
                )
            }))
        } catch (e) {
            console.error(`could not staking metrics for`, e)
        }
    }
    async getValrEthPrice(): Promise<void> {
        try {
            const marketSummary = await this.valr.getMarketSummaryForPair('ETHUSDC');

            this.metricsService.updateGauge(
                GAUGE_NAMES.valr_eth_price,
                Number(marketSummary.markPrice),
            )
        } catch (e) {
            console.error("could not update borrow metrics", e)
        }
    }
}
