import {getHeaders} from "./auth";

export type ValrLendRates = {
    currency: string,
    previousFundingRate: number,
    estimatedNextRate: number,
    estimatedNextBorrowRate: string
};
export type MarketSummary = {
    "currencyPair": string;
    "askPrice": string;
    "bidPrice": string;
    "lastTradedPrice": string;
    "previousClosePrice": string;
    "baseVolume": string;
    "quoteVolume": string;
    "highPrice": string;
    "lowPrice": string;
    "created": string;
    "changeFromPrevious": string;
    "markPrice": string;
};

export default class Valr {
    private readonly apiKey: string;
    private readonly apiSecret: string;

    constructor(apiKey: string, apiSecret: string) {
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
    }

    async getLendingRates(): Promise<ValrLendRates[]> {
        let timestamp = (new Date()).getTime();
        const path = `/v1/loans/rates`
        const options = {
            method: "GET",
            headers: getHeaders(this.apiKey, this.apiSecret, timestamp, "GET", path)
        };
        const response = await fetch(`https://api.valr.com${path}`, options);
        const json = await response.json();
        return json
    }
    async getMarketSummaryForPair(pair: string): Promise<MarketSummary> {
        let timestamp = (new Date()).getTime();
        const path = `/v1/public/${pair}/marketsummary`
        const options = {
            method: "GET",
            headers: getHeaders(this.apiKey, this.apiSecret, timestamp, "GET", path)
        };
        const response = await fetch(`https://api.valr.com${path}`, options);
        const json = await response.json();
        return json
    }
}
