import BigNumber from "bignumber.js";

export enum NetworkTypes {
    Arbitrum = 'Arbitrum',
    Ethereum = 'Ethereum',
}

export type Coins = {
    [symbol: string]: {
        decimals: number,
        networks: {
            [network in NetworkTypes]: {
                chains: {
                    [chainId: number]: {
                        contractAddress: string
                    }
                }
            }
        }
    }
}

export const coins: Coins = {
    usdc: {
        decimals: 6,
        networks: {
            [NetworkTypes.Arbitrum]: {
                chains: {
                    42161: { contractAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'},
                    421614: { contractAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d'}
                }
            },
            [NetworkTypes.Ethereum]: {
                chains: {
                    11155111: { contractAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238' },
                    1: { contractAddress: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' }
                }
            }
        }
    }
}

const contractCoins: { [contractAddress: string]: string } = Object.entries(coins)
    .reduce((acc, [coin, coinDetails]) => ({
        ...acc,
        ...Object.entries(coinDetails.networks)
            .reduce((acc2, [network, networkDetails]) => ({
                ...acc2,
                ...Object.entries(networkDetails.chains)
                    .reduce((acc, [chain, { contractAddress }]) => ({
                        ...acc,
                        [contractAddress.toLowerCase()]: coin
                    }), {})
            }), {})
        })
    , {});

export function isSupportedToken(contractAddress: string) {
    const coin = contractCoins[contractAddress.toLowerCase()];
    return !!coin;
}

export function getCoinContractAddress(coin: string, chainId: number, networkType: NetworkTypes): string {
    const contractAddress = coins[coin]?.networks[networkType]?.chains[chainId].contractAddress;
    if(!contractAddress){
        throw new Error(`could not get coin contract address for coin(${coin}) network(${networkType.toString()}) chain(${chainId})`)
    }
    return contractAddress;
}
export function getCoinFromContractAddress(contractAddress: string): string {
    const coin = contractCoins[contractAddress];
    if(!coin){
        throw new Error(`could not get coin for contractAddress(${contractAddress})`)
    }
    return coin;
}
export function getCoinDecimals(coin: string): number {
    const decimals = coins[coin]?.decimals;
    if(!decimals){
        throw new Error(`could not get coin contract address for coin(${coin})`)
    }
    return decimals;
}

export function fromMinorUnitToMajorUnit(value: string, coin: string): BigNumber{
    const decimals = getCoinDecimals(coin);
    return new BigNumber(value).shiftedBy(-Number(decimals));
}

export function fromMajorUnitToMinorUnit(value: string, coin: string): BigNumber{
    const decimals = getCoinDecimals(coin);
    return new BigNumber(value).shiftedBy(Number(decimals));
}

export function getNetworkTypeFromChain(chainId: number): NetworkTypes{
    switch (chainId){
        case 42161:         return NetworkTypes.Arbitrum;
        case 421614:        return NetworkTypes.Arbitrum;
        case 11155111:      return NetworkTypes.Ethereum;
        case 1:             return NetworkTypes.Ethereum;
        default:            throw new Error(`unsupported chain(${chainId})`)
    }
}

