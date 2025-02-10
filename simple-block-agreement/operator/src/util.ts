import { BApp, BAppToken, Strategy, StrategyToken, Token } from './app_interface'

export function getStrategyToken(strategy: Strategy, token: Token): StrategyToken {
  for (const strategyToken of strategy.token) {
    if (strategyToken.token === token) {
      return strategyToken
    }
  }
  throw new Error(`Token ${token} not found in strategy ${strategy.id}`)
}

export function getBAppToken(bApp: BApp, token: Token): BAppToken {
  for (const bAppToken of bApp.token) {
    if (bAppToken.token === token) {
      return bAppToken
    }
  }
  throw new Error(`Token ${token} not found in bApp ${bApp.address}`)
}

export const hexToUint8Array = (hex: string): Uint8Array => {
  if (hex.startsWith('0x')) hex = hex.slice(2)
  return new Uint8Array(hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)))
}
