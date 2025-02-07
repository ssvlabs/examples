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
