import { BApp, BAppToken, Strategy, StrategyID, StrategyToken, Token } from './app_interface'
import { getBAppToken, getStrategyToken } from './util'

// Abstract class for calculating weight
export interface WeightCalculator {
  calculateParticipantsWeight(bApp: BApp, strategies: Strategy[]): Map<StrategyID, number>
}

// Harmonic mean combination function implementation
// Formula:
//    W_final = normalization_factor *
//              (1 /
//                (significance_{ValidatorBalance}/W_{VB} + sum_{token} significance_{token} /W_{token} )
//              )
export class HarmonicWeightCalculator implements WeightCalculator {
  bApp: BApp
  strategies: Strategy[]

  constructor() {
    this.bApp = {} as BApp
    this.strategies = []
  }

  calculateParticipantsWeight(bApp: BApp, strategies: Strategy[]): Map<StrategyID, number> {
    this.bApp = bApp
    this.strategies = strategies

    const tokenWeights = this.calculateTokenWeights()
    const validatorBalanceWeights = this.calculateValidatorBalanceWeights()

    return this.calculateFinalWeights(tokenWeights, validatorBalanceWeights)
  }

  private calculateTokenWeights(): Map<StrategyID, Map<Token, number>> {
    // StrategyID -> Token -> Weight
    const tokenWeights = new Map<StrategyID, Map<Token, number>>()

    for (const bAppToken of this.bApp.token) {
      this.logToken(bAppToken.token, '🪙  Calculating token weights')

      // Total amount obligated to bApp
      var totalBAppAmount = this.calculateTotalBAppAmount(bAppToken.token)
      if (totalBAppAmount === 0) {
        totalBAppAmount = 1
      }
      this.logToken(bAppToken.token, `🗂️  Total amount obligated to bApp: ${totalBAppAmount}`)

      // Calculate weights for each strategy
      var weightSum: number = 0
      for (const strategy of this.strategies) {
        const strategyToken = getStrategyToken(strategy, bAppToken.token)
        const weight = this.CalculateWeightFormula(
          strategy.id,
          strategyToken,
          bAppToken,
          totalBAppAmount,
        )
        weightSum += weight

        // Store weight
        if (!tokenWeights.has(strategy.id)) {
          tokenWeights.set(strategy.id, new Map<Token, number>())
        }
        tokenWeights.get(strategy.id)!.set(bAppToken.token, weight)
      }

      if (weightSum === 0) {
        weightSum = 1
      }
      // Normalize weights
      var normWeightsLog = `📊  Normalized weights: \n`
      for (const strategy of this.strategies) {
        const weight = tokenWeights.get(strategy.id)!.get(bAppToken.token)!
        const normalizedWeight = (weight / weightSum)
        tokenWeights.get(strategy.id)!.set(bAppToken.token, normalizedWeight)

        normWeightsLog += `   - strategy ${strategy.id}: ${(100*normalizedWeight).toFixed(2)}%\n`
      }
      this.logToken(bAppToken.token, normWeightsLog)
    }

    return tokenWeights
  }

  // Calculate the total amount obligated to the bApp for a token
  private calculateTotalBAppAmount(token: Token): number {
    let total = 0
    for (const strategy of this.strategies) {
      // Sum strategy's obligated balance
      const strategyToken = getStrategyToken(strategy, token)
      const amount = strategyToken.amount
      const obligationPercentage = strategyToken.obligationPercentage
      total += amount * obligationPercentage
    }

    return total
  }

  // Calculate the weight for a token for a strategy as in the formula
  private CalculateWeightFormula(
    strategyID: StrategyID,
    strategyToken: StrategyToken,
    bAppToken: BAppToken,
    totalBAppAmount: number,
  ): number {
    const obligation = strategyToken.obligationPercentage * strategyToken.amount
    const obligationParticipation = obligation / totalBAppAmount
    const risk = strategyToken.risk
    const beta = bAppToken.sharedRiskLevel

    const weight = obligationParticipation * Math.exp(-beta * Math.max(1, risk))

    this.logTokenStrategy(
      bAppToken.token,
      strategyID,
      `🧮 Calculating normalized weight:
  - Obligation percentage: ${strategyToken.obligationPercentage}
  - Balance: ${strategyToken.amount}
  - Obligated balance (obligation percentage * balance): ${obligation}
  - Total bApp amount: ${totalBAppAmount}
  - Obligation participation (obligated balance / total bApp amount): ${obligationParticipation}
  - Risk: ${risk}
  - Beta: ${beta}
  - Weight (obligation participation * exp(-beta * max(1, risk))): ${weight}`,
    )

    return weight
  }

  // Calculate the weights for validator balance
  private calculateValidatorBalanceWeights(): Map<StrategyID, number> {
    this.logVB('🪙  Calculating validator balance weights')

    const validatorBalanceWeights = new Map<StrategyID, number>()

    // Total validator balance for bApp
    var totalValidatorBalance = this.calculateTotalValidatorBalance()
    if (totalValidatorBalance === 0) {
      totalValidatorBalance = 1
    }

    this.logVB(`🗂️  Total VB amount in bApp: ${totalValidatorBalance}`)

    for (const strategy of this.strategies) {
      // Calculate weight for each strategy
      const weight = strategy.validatorBalance / totalValidatorBalance
      validatorBalanceWeights.set(strategy.id, weight)

      this.logVBStrategy(
        strategy.id,
        `🧮 Calculating normalized weight:
  - Validator Balance: ${strategy.validatorBalance}
  - Total VB amount in bApp: ${totalValidatorBalance}
  - Weight (validator balance / total amount): ${(100*weight).toFixed(2)}%`,
      )
    }

    return validatorBalanceWeights
  }

  // Calculate the total validator balance for the bApp
  private calculateTotalValidatorBalance(): number {
    let total = 0
    for (const strategy of this.strategies) {
      total += strategy.validatorBalance
    }

    return total
  }

  // Calculate the final weights given the weights for each token and validator balance
  private calculateFinalWeights(
    tokenWeights: Map<StrategyID, Map<Token, number>>,
    validatorBalanceWeights: Map<StrategyID, number>,
  ): Map<StrategyID, number> {
    const finalWeights = new Map<StrategyID, number>()

    var weightSum: number = 0
    for (const strategy of tokenWeights.keys()) {
      // Calculate final weight for strategy
      const tokenWeight = tokenWeights.get(strategy)!
      const validatorBalanceWeight = validatorBalanceWeights.get(strategy)!

      const harmonicWeight = this.calculateHarmonicWeight(strategy, tokenWeight, validatorBalanceWeight)

      finalWeights.set(strategy, harmonicWeight)

      weightSum += harmonicWeight
    }

    if (weightSum === 0) {
      weightSum = 1
    }

    // Normalize weights
    var normWeightsLog = `📊  Normalized final weights: \n`
    for (const strategy of tokenWeights.keys()) {
      const weight = finalWeights.get(strategy)!
      const normalizedWeight = weight / weightSum
      finalWeights.set(strategy, normalizedWeight)

      normWeightsLog += `   - strategy ${strategy}: ${(100*normalizedWeight).toFixed(2)}%\n`
    }
    this.logFinalWeight(normWeightsLog)

    return finalWeights
  }

  // Calculate the harmonic weight considering each token's (and validator balance) significance
  private calculateHarmonicWeight(
    strategyID: StrategyID,
    tokenWeights: Map<Token, number>,
    validatorBalanceWeight: number,
  ): number {

    // Edge case: weigth is 0 for a token (or validator balance)
    for (const [token, weight] of tokenWeights) {
      const bAppToken = getBAppToken(this.bApp, token)
      if (bAppToken.significance != 0 && weight == 0) {
        this.logFinalWeightStrategy(strategyID, `⚠️  Token ${token} has significance but strategy's weight is 0. Final weight will be 0.`)
        return 0
      }
    }
    if (this.bApp.validatorBalanceSignificance != 0 && validatorBalanceWeight == 0) {
      this.logFinalWeightStrategy(strategyID, `⚠️  Validator balance has significance but strategy's weight is 0. Final weight will be 0.`)
      return 0
    }

    let log: string = '🧮 Calculating normalized final weight:\n'

    let harmonicMean = 0
    for (const token of tokenWeights.keys()) {
      const bAppToken = getBAppToken(this.bApp, token)
      const weight = tokenWeights.get(token)!
      harmonicMean += bAppToken.significance / weight
      log += `  - Token: ${token}
    - Significance: ${bAppToken.significance}
    - Weight: ${weight}
    - Significance / Weight = ${bAppToken.significance / weight}\n`
    }
    harmonicMean += this.bApp.validatorBalanceSignificance / validatorBalanceWeight
    log += `  - Validator Balance
    - Significance: ${this.bApp.validatorBalanceSignificance}
    - Weight: ${validatorBalanceWeight}
    - Significance / Weight = ${this.bApp.validatorBalanceSignificance / validatorBalanceWeight}\n`

    harmonicMean = 1 / harmonicMean
    log += `  - Harmonic mean = (1/(sum_t significance_t / weight_t)): ${harmonicMean}\n`

    this.logFinalWeightStrategy(strategyID, log)

    return harmonicMean
  }

  // Logger function with color
  private logToken(token: Token, message: string): void {
    const color = this.getColorForToken(token)
    console.log(`${color}[💲 Token ${token}]${this.colorReset()} ${message}`)
  }
  private logVB(message: string): void {
    const color = this.getColorForValidatorBalance()
    console.log(`${color}[🔑 Validator Balance]${this.colorReset()} ${message}`)
  }
  private logFinalWeight(message: string): void {
    const color = this.getColorForFinalWeight()
    console.log(`${color}[⚖️  Final Weight]${this.colorReset()} ${message}`)
  }
  private logTokenStrategy(token: Token, strategy: StrategyID, message: string): void {
    this.logToken(
      token,
      `${this.getColorForStrategy(strategy)}[🧍‍♂️ strategy ${strategy}]${this.colorReset()} ${message}`,
    )
  }
  private logVBStrategy(strategy: StrategyID, message: string): void {
    this.logVB(`${this.getColorForStrategy(strategy)}[🧍‍♂️ strategy ${strategy}]${this.colorReset()} ${message}`)
  }
  private logFinalWeightStrategy(strategy: StrategyID, message: string): void {
    this.logFinalWeight(`${this.getColorForStrategy(strategy)}[🧍‍♂️ strategy ${strategy}]${this.colorReset()} ${message}`)
  }
  private getColorForToken(token: string): string {
    const colors = ['\x1b[31m', '\x1b[32m', '\x1b[33m', '\x1b[34m', '\x1b[35m', '\x1b[36m']
    let hash = 0
    for (let i = 0; i < token.length; i++) {
      hash = token.charCodeAt(i) + ((hash << 5) - hash)
    }
    const colorIndex = Math.abs(hash) % colors.length
    return colors[colorIndex]
  }
  private getColorForValidatorBalance(): string {
    return '\x1b[36m'
  }
  private getColorForFinalWeight(): string {
    return '\x1b[35m'
  }
  private getColorForStrategy(id: number): string {
    const colors = ['\x1b[31m', '\x1b[32m', '\x1b[33m', '\x1b[34m', '\x1b[35m', '\x1b[36m']
    return colors[id % colors.length]
  }
  private colorReset(): string {
    return '\x1b[0m'
  }
}
