import BigNumber from 'bignumber.js';
import {ethers} from 'ethers';
import {ChainId, EthereumTransactionTypeExtended} from '@aave/contract-helpers';
import * as markets from '@bgd-labs/aave-address-book';
import {NetworkTypes} from "./constants";

export type SupportedMarketType = {
    UI_POOL_DATA_PROVIDER: string
    POOL_ADDRESSES_PROVIDER: string
    POOL: string
}
export const getMarketForNetworkAndChain = (networkType: NetworkTypes, chainId: number): SupportedMarketType => {
    switch (networkType) {
        case NetworkTypes.Arbitrum: {
            switch (chainId) {
                case ChainId.arbitrum_one: return markets.AaveV3Arbitrum as SupportedMarketType
                case ChainId.arbitrum_sepolia: return markets.AaveV3ArbitrumSepolia as SupportedMarketType
                default: throw new Error(`unsupported network(${networkType}) and chainIn(${chainId})`)
            }
        }
        case NetworkTypes.Ethereum: {
            switch (chainId) {
                case ChainId.mainnet: return markets.AaveV3Ethereum as SupportedMarketType
                case ChainId.sepolia: return markets.AaveV3Sepolia as SupportedMarketType
                default: throw new Error(`unsupported network(${networkType}) and chainIn(${chainId})`)
            }
        }
        default: {
            throw new Error(`unsupported network(${networkType}) and chainIn(${chainId})`)
        }
    }
}

export const rayToDecimalString = (ray: string) => {
    const rayBn = new BigNumber(ray);
    return rayBn.shiftedBy(-27).toFixed();
}
export const decimalStringToRay = (ray: string) => {
    const rayBn = new BigNumber(ray);
    return rayBn.shiftedBy(27).toFixed();
}

export const getTxDetailsFromExtendedTx = async (from: string, provider: ethers.providers.JsonRpcProvider, tx: EthereumTransactionTypeExtended) => {
    const gas = await tx.gas();
    const txDetails = await tx.tx()
    const nonce = await provider.getTransactionCount(from);
    return {
        ...txDetails,
        nonce,
        gasPrice: Number(gas?.gasPrice || -1),
        gasLimit: Number(gas?.gasLimit || -1),
        value: BigNumber(txDetails.value || 0).toNumber()
    }
}