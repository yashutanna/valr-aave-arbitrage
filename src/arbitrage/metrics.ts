import MetricService from "../api/metrics/service";
import Aave from "../aave/aave";
import BigNumber from "bignumber.js";
import {rayToDecimalString} from "../aave/aave-helpers";
import Valr, {ValrLendRates} from "../valr/valr";

export enum GAUGE_NAMES {
    arbitrage_lend_borrow_delta = 'arbitrage_lend_borrow_delta',
    arbitrage_daily_profit_10000 = 'arbitrage_daily_profit_10000',
    arbitrage_weekly_profit_10000 = 'arbitrage_weekly_profit_10000',
    arbitrage_monthly_profit_10000 = 'arbitrage_monthly_profit_10000',
}

export class ArbitrageMetrics {
    private readonly metricsService: MetricService;
    private readonly intervals: NodeJS.Timeout[] = [];
    private readonly valr: Valr;
    private readonly aaveCoinServices: { aave: Aave, coin: string }[] = [];

    constructor(aaveServices: { aave: Aave, coin: string }[], valr: Valr) {
        this.metricsService = MetricService.instanceOf();
        this.aaveCoinServices = aaveServices;
        this.valr = valr;
    }
    start(){
        const nonCollectGauge = [
            {
                name: GAUGE_NAMES.arbitrage_daily_profit_10000,
                help: "The daily profit on 10000 USDC",
                labelNames: ["coin", "networkType"],
            },
            {
                name: GAUGE_NAMES.arbitrage_weekly_profit_10000,
                help: "The weekly profit on 10000 USDC",
                labelNames: ["coin", "networkType"],
            },
            {
                name: GAUGE_NAMES.arbitrage_monthly_profit_10000,
                help: "The monthly profit on 10000 USDC",
                labelNames: ["coin", "networkType"],
            }
        ];
        nonCollectGauge.map(gauge => {
            this.metricsService.createGauge(gauge.name, gauge.help, gauge.labelNames);
        })
        const gauges = [
            {
                name: GAUGE_NAMES.arbitrage_lend_borrow_delta,
                help: "The difference between the lend rate and borrow rate for a coin (Lend - Borrow)",
                labelNames: ["coin", "networkType"],
                collect: this.getAllLendBorrowDeltas.bind(this),
                collectIntervalMs: process.env.LEND_BORROW_DELTA_METRICS_INTERVAL_MS ? parseInt(process.env.LEND_BORROW_DELTA_METRICS_INTERVAL_MS) : 10000
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

    async getAllLendBorrowDeltas(): Promise<void> {
        const valrLendRates = await this.valr.getLendingRates();
        const { markPrice: ethPrice } = await this.valr.getMarketSummaryForPair('ETHUSDC');
        const ratesByCoin: {[coin: string]: ValrLendRates} = valrLendRates.reduce((collection, lendingRate) => {
            return {
                ...collection,
                [lendingRate.currency.toLowerCase()]: lendingRate,
            }
        }, {})
        await Promise.all(this.aaveCoinServices.map(async ({aave, coin}) => {
            try {
                const reserveData = await aave.getCoinReserveData(coin);
                if(ratesByCoin[coin.toLowerCase()]){
                    const borrowRate = new BigNumber(rayToDecimalString(reserveData.raw.variableBorrowRate));
                    const lendRate = Number(new BigNumber(ratesByCoin[coin.toLowerCase()].estimatedNextRate).multipliedBy(24).multipliedBy(365));
                    this.metricsService.updateGauge(
                        GAUGE_NAMES.arbitrage_lend_borrow_delta,
                        new BigNumber(lendRate).minus(borrowRate).toNumber(),
                        { coin: coin.toLowerCase(), networkType: aave.networkType }
                    )

                    const dailyProfit10000 = this.getProfitForAmountAndHours(borrowRate, lendRate, ethPrice, 10000, 24);
                    const weeklyProfit10000 = this.getProfitForAmountAndHours(borrowRate, lendRate, ethPrice, 10000, 24 * 7);
                    const monthlyProfit10000 = this.getProfitForAmountAndHours(borrowRate, lendRate, ethPrice, 10000, 24 * 7 * 4);
                    this.metricsService.updateGauge(
                        GAUGE_NAMES.arbitrage_daily_profit_10000,
                        dailyProfit10000.toNumber(),
                        { coin: coin.toLowerCase(), networkType: aave.networkType }
                    )
                    this.metricsService.updateGauge(
                        GAUGE_NAMES.arbitrage_weekly_profit_10000,
                        weeklyProfit10000.toNumber(),
                        { coin: coin.toLowerCase(), networkType: aave.networkType }
                    )
                    this.metricsService.updateGauge(
                        GAUGE_NAMES.arbitrage_monthly_profit_10000,
                        monthlyProfit10000.toNumber(),
                        { coin: coin.toLowerCase(), networkType: aave.networkType }
                    )
                }
            } catch (e) {
                console.error("could not update lend/borrow delta metrics", e)
            }
        }))
    }

    private getProfitForAmountAndHours(borrowRate: BigNumber, lendRate: number, ethPrice: string, amount: number, hours: number) {
        const depositedAmount = new BigNumber(amount)

        const borrowRateHourly = new BigNumber(borrowRate).dividedBy(24).dividedBy(365)
        const lendRateHourly = new BigNumber(lendRate).dividedBy(24).dividedBy(365)

        const repayment = new BigNumber(depositedAmount).multipliedBy(borrowRateHourly);
        const interestEarned = new BigNumber(depositedAmount).multipliedBy(lendRateHourly);
        const rawHourlyProfit = depositedAmount.plus(interestEarned).minus(repayment).minus(depositedAmount)

        const repaymentGasPrice = process.env.REPAYMENT_GAS_PRICE_GWEI ? parseInt(process.env.REPAYMENT_GAS_PRICE_GWEI) : 0.01;
        const repaymentGasPriceWei = new BigNumber(repaymentGasPrice).multipliedBy(1000000000);
        const repaymentGasLimit = process.env.REPAYMENT_GAS_LIMIT ? parseInt(process.env.REPAYMENT_GAS_LIMIT) : 5_000_000;

        const repaymentGasCost = new BigNumber(repaymentGasLimit)
            .multipliedBy(repaymentGasPriceWei)
            .dividedBy(1_000_000_000_000_000_000)
            .multipliedBy(ethPrice)
        const valrWithdrawalFee = new BigNumber(0.5)
        const fixedFee = repaymentGasCost.plus(valrWithdrawalFee);


        return (rawHourlyProfit.multipliedBy(hours)).minus(new BigNumber(fixedFee));
    }
}
