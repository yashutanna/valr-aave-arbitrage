import API from './api/index'
import AAVE from './aave/aave';
import {NetworkTypes} from "./aave/constants";
import {ChainId} from "@aave/contract-helpers";
import {AAVEMetrics} from "./aave/metrics";
import Valr from "./valr/valr";
import {ValrMetrics} from "./valr/metrics";
import Aave from "./aave/aave";
import {ArbitrageMetrics} from "./arbitrage/metrics";
import {configDotenv} from "dotenv";
configDotenv();

async function startAave(aaveCoinConfig: { aave: Aave, coin: string }[]){
  const aaveMetrics = new AAVEMetrics(aaveCoinConfig);
  aaveMetrics.start();
}

async function startValr(){
  const apiKey = process.env.VALR_API_KEY;
  const apiSecret = process.env.VALR_API_SECRET;
  if(!apiKey || !apiSecret){
    throw new Error('VALR_API_KEY and VALR_API_SECRET must be set')
  }
  const valr = new Valr(apiKey, apiSecret);
  const valrMetrics = new ValrMetrics(valr);
  valrMetrics.start();
  return valr;
}

async function start (port: number): Promise<void> {
  const ethAave = new AAVE(
      'https://mainnet.infura.io/v3/f750133e5c62415ea53fa73ef97f2cdc',
      NetworkTypes.Ethereum,
      ChainId.mainnet
  )
  const arbtrumAave = new AAVE(
      'https://arbitrum-mainnet.infura.io/v3/f750133e5c62415ea53fa73ef97f2cdc',
      NetworkTypes.Arbitrum,
      ChainId.arbitrum_one
  )
  await startAave([
    {aave: ethAave, coin: 'usdc'},
    {aave: arbtrumAave, coin: 'usdc'}
  ]);
  const valr = await startValr();
  const arbitrageMetrics = new ArbitrageMetrics([
    {aave: ethAave, coin: 'usdc'},
    {aave: arbtrumAave, coin: 'usdc'}
  ], valr);
  arbitrageMetrics.start();
  console.log(`Starting API on port ${port}...`)
  API.listen(port)
}

start(process.env.PORT ? Number(process.env.PORT) : 3000).catch(e => {
  console.error(e);
  process.exit(1);
})

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: shutting down gracefully');
  process.exit(0);
})
