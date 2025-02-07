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

      // Normalization factor
      const normalizationFactor = this.calculateNormalizationFactor(bAppToken)

      this.logToken(bAppToken.token, `📊  Normalization constant: ${normalizationFactor}`)

      // Total amount obligated to bApp
      const totalBAppAmount = this.calculateTotalBAppAmount(bAppToken.token)

      this.logToken(bAppToken.token, `🗂️  Total amount obligated to bApp: ${totalBAppAmount}`)

      for (const strategy of this.strategies) {
        // Calculate normalized weight for each strategy
        const strategyToken = getStrategyToken(strategy, bAppToken.token)
        const weight = this.CalculateNormalizedWeightFormula(
          strategy.id,
          strategyToken,
          bAppToken,
          totalBAppAmount,
          normalizationFactor,
        )

        // Store weight
        if (!tokenWeights.has(strategy.id)) {
          tokenWeights.set(strategy.id, new Map<Token, number>())
        }
        tokenWeights.get(strategy.id)!.set(bAppToken.token, weight)
      }
    }

    return tokenWeights
  }

  // Calculate the normalization factor for a token
  private calculateNormalizationFactor(bAppToken: BAppToken): number {
    // Total amount obligated to bApp
    const totalBAppAmount = this.calculateTotalBAppAmount(bAppToken.token)

    let total = 0
    for (const strategy of this.strategies) {
      // Add strategy's weight
      const strategyToken = getStrategyToken(strategy, bAppToken.token)
      total += this.CalculateWeightFormula(strategy.id, strategyToken, bAppToken, totalBAppAmount)
    }

    return 1 / total
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

  // Calculate the unnormalized weight for a token for a strategy as in the formula
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
    return obligationParticipation * Math.exp(-beta * Math.max(1, risk))
  }

  // Calculate the weight for a token for a strategy as in the formula
  private CalculateNormalizedWeightFormula(
    strategyID: StrategyID,
    strategyToken: StrategyToken,
    bAppToken: BAppToken,
    totalBAppAmount: number,
    normalizationFactor: number,
  ): number {
    const obligation = strategyToken.obligationPercentage * strategyToken.amount
    const obligationParticipation = obligation / totalBAppAmount
    const risk = strategyToken.risk
    const beta = bAppToken.sharedRiskLevel

    const weight = normalizationFactor * obligationParticipation * Math.exp(-beta * Math.max(1, risk))

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
  - Normalization factor: ${normalizationFactor}
  - Weight (normalization factor * obligation participation * exp(-beta * max(1, risk))): ${weight}`,
    )

    return weight
  }

  // Calculate the weights for validator balance
  private calculateValidatorBalanceWeights(): Map<StrategyID, number> {
    this.logVB('🪙  Calculating validator balance weights')

    const validatorBalanceWeights = new Map<StrategyID, number>()

    // Total validator balance for bApp
    const totalValidatorBalance = this.calculateTotalValidatorBalance()

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
  - Weight (validator balance / total amount): ${weight}`,
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

    // Normalization factor for final weight
    const normalizationFactor = this.calculateFinalWeightNormalizationFactor(tokenWeights, validatorBalanceWeights)

    this.logFinalWeight(`📊  Normalization constant: ${normalizationFactor}`)

    for (const strategy of tokenWeights.keys()) {
      // Calculate final weight for strategy
      const tokenWeight = tokenWeights.get(strategy)!
      const validatorBalanceWeight = validatorBalanceWeights.get(strategy)!

      finalWeights.set(
        strategy,
        this.calculateNormalizedHarmonicWeight(strategy, tokenWeight, validatorBalanceWeight, normalizationFactor),
      )
    }

    return finalWeights
  }

  // Calculate the normalization factor for the final weight
  private calculateFinalWeightNormalizationFactor(
    tokenWeights: Map<StrategyID, Map<Token, number>>,
    validatorBalanceWeights: Map<StrategyID, number>,
  ): number {
    let total = 0
    for (const strategy of tokenWeights.keys()) {
      // Sum harmonic weight for each strategy
      const tokenWeight = tokenWeights.get(strategy)!
      const validatorBalanceWeight = validatorBalanceWeights.get(strategy)!

      total += this.calculateHarmonicWeight(tokenWeight, validatorBalanceWeight)
    }

    return 1 / total
  }

  // Calculate the harmonic weight considering each token's (and validator balance) significance
  private calculateHarmonicWeight(tokenWeights: Map<Token, number>, validatorBalanceWeight: number): number {
    let harmonicMean = 0
    for (const token of tokenWeights.keys()) {
      const bAppToken = getBAppToken(this.bApp, token)
      harmonicMean += bAppToken.significance / tokenWeights.get(token)!
    }
    harmonicMean += this.bApp.validatorBalanceSignificance / validatorBalanceWeight

    return 1 / harmonicMean
  }
  // Calculate the harmonic weight considering each token's (and validator balance) significance
  private calculateNormalizedHarmonicWeight(
    strategyID: StrategyID,
    tokenWeights: Map<Token, number>,
    validatorBalanceWeight: number,
    normalizationFactor: number,
  ): number {
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

    log += `  - Normalization factor: ${normalizationFactor}.\n`

    harmonicMean = normalizationFactor * (1 / harmonicMean)
    log += `  - Harmonic mean = (normalization factor * 1/(sum_t significance_t / weight_t)): ${harmonicMean}\n`

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
