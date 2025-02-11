import { BApp, BAppToken, Strategy, StrategyToken, Address } from './app_interface'

export function getStrategyToken(strategy: Strategy, tokenAddress: Address): StrategyToken {
  for (const strategyToken of strategy.tokens) {
    if (strategyToken.address === tokenAddress) {
      return strategyToken
    }
  }
  throw new Error(`Token ${tokenAddress} not found in strategy ${strategy.id}`)
}

export function getBAppToken(bApp: BApp, tokenAddress: Address): BAppToken {
  for (const bAppToken of bApp.tokens) {
    if (bAppToken.address === tokenAddress) {
      return bAppToken
    }
  }
  throw new Error(`Token ${tokenAddress} not found in bApp ${bApp.address}`)
}

export const hexToUint8Array = (hex: string): Uint8Array => {
  if (hex.startsWith('0x')) hex = hex.slice(2)
  return new Uint8Array(hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)))
}
