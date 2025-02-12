import { config } from '../config'
import { BApp, BAppToken, Strategy, StrategyID, StrategyToken, Address } from './app_interface'
import {
  BLUE,
  GREEN,
  logFinalWeightStrategy,
  logNormalizedFinalWeights,
  logStrategyTokenWeights,
  logToken,
  logTokenStrategy,
  logValidatorBalanceTable,
  logVB,
  logVBStrategy,
  RESET,
} from './logging'
import { getBAppToken, getStrategyToken } from './util'

// ==================== Weight Formula ====================

export type WeightFormula = (
  strategyID: StrategyID,
  strategyToken: StrategyToken,
  bAppToken: BAppToken,
  totalBAppAmount: number,
) => number

// Calculate the weight for a token for a strategy that decreases exponentially with the strategy's risk
export function exponentialWeightFormula(
  strategyID: StrategyID,
  strategyToken: StrategyToken,
  bAppToken: BAppToken,
  totalBAppAmount: number,
): number {
  const obligation = strategyToken.obligationPercentage * strategyToken.amount
  const obligationParticipation = obligation / totalBAppAmount
  const risk = strategyToken.risk
  console.log('RISK:', risk)
  const beta = bAppToken.sharedRiskLevel

  const weight = obligationParticipation * Math.exp(-beta * Math.max(1, risk))

  logTokenStrategy(
    bAppToken.address,
    strategyID,
    `🧮 Calculating weight (exponential formula):
  -> Obligation participation (obligated balance / total bApp amount): ${obligationParticipation}
  - Risk: ${risk}
  -> Weight (obligation participation * exp(-beta * max(1, risk))): ${GREEN}${weight}${RESET}`,
  )

  return weight
}

// Calculate the weight for a token for a strategy that decreases polynomially with the strategy's risk
export function polynomialWeightFormula(
  strategyID: StrategyID,
  strategyToken: StrategyToken,
  bAppToken: BAppToken,
  totalBAppAmount: number,
): number {
  const obligation = strategyToken.obligationPercentage * strategyToken.amount
  const obligationParticipation = obligation / totalBAppAmount
  const risk = strategyToken.risk
  const beta = bAppToken.sharedRiskLevel

  const weight = obligationParticipation / Math.pow(Math.max(1, risk), beta)

  logTokenStrategy(
    bAppToken.address,
    strategyID,
    `🧮 Calculating weight (polynomial formula):
  -> Obligation participation (obligated balance / total bApp amount): ${obligationParticipation}
  - Risk: ${risk}
  -> Weight (obligation participation / (max(1, risk)^{beta})): ${GREEN}${weight}${RESET}`,
  )

  return weight
}

// ==================== Combination Functions ====================

export type CombinationFunction = (
  bApp: BApp,
  strategyID: StrategyID,
  tokenWeights: Map<Address, number>,
  validatorBalanceWeight: number,
) => number

// Calculate the harmonic weight considering each token's (and validator balance) significance
export function harmonicCombinationFunction(
  bApp: BApp,
  strategyID: StrategyID,
  tokenWeights: Map<Address, number>,
  validatorBalanceWeight: number,
): number {
  // Edge case: weight is 0 for a token (or validator balance)
  for (const [token, weight] of tokenWeights) {
    const bAppToken = getBAppToken(bApp, token)
    if (bAppToken.significance != 0 && weight == 0) {
      logFinalWeightStrategy(
        strategyID,
        `⚠️  Token ${token} has significance but strategy's weight is 0. Final weight will be 0.`,
      )
      return 0
    }
  }
  if (bApp.validatorBalanceSignificance != 0 && validatorBalanceWeight == 0) {
    logFinalWeightStrategy(
      strategyID,
      `⚠️  Validator balance has significance but strategy's weight is 0. Final weight will be 0.`,
    )
    return 0
  }

  // Calculate the harmonic mean
  let log: string = '🧮 Calculating Final Weight:\n'

  const significanceSum = SignificanceSum(bApp)
  log += `  -> Total significance sum: ${significanceSum}\n`

  let harmonicMean = 0
  // Sum the significance / weight for each token
  for (const token of tokenWeights.keys()) {
    const bAppToken = getBAppToken(bApp, token)
    const weight = tokenWeights.get(token)!
    const weightContribution = bAppToken.significance / significanceSum / weight
    harmonicMean += weightContribution
    log += `  - Token: ${config.tokenMap[token].symbol}
  - Significance: ${bAppToken.significance}
  - Weight: ${weight}
  -> (Significance/Significance Sum) / Weight = ${BLUE}${weightContribution}${RESET}\n`
  }
  // Sum the significance / weight for the validator balance
  const validatorBalanceWeightContribution =
    bApp.validatorBalanceSignificance / significanceSum / validatorBalanceWeight
  harmonicMean += validatorBalanceWeightContribution
  log += `  - Validator Balance
  - Significance: ${bApp.validatorBalanceSignificance}
  - Weight: ${validatorBalanceWeight}
  -> (Significance/Significance Sum) / Weight = ${BLUE}${validatorBalanceWeightContribution}${RESET}\n`

  // Invert the sum to get the harmonic mean
  harmonicMean = 1 / harmonicMean
  log += `  --> Harmonic mean = (1/(sum_t (significance_t/significance sum) / weight_t)): ${GREEN}${harmonicMean}${RESET}\n`

  logFinalWeightStrategy(strategyID, log)

  return harmonicMean
}

// Calculate the arithmetic weight considering each token's (and validator balance) significance
export function arithmeticCombinationFunction(
  bApp: BApp,
  strategyID: StrategyID,
  tokenWeights: Map<Address, number>,
  validatorBalanceWeight: number,
): number {
  let log: string = '🧮 Calculating Final Weight:\n'

  const significanceSum = SignificanceSum(bApp)
  log += `  -> Total significance sum: ${significanceSum}\n`

  let arithmeticMean = 0
  // Sum the significance * weight for each token
  for (const token of tokenWeights.keys()) {
    const bAppToken = getBAppToken(bApp, token)
    const weight = tokenWeights.get(token)!
    const weightContribution = (bAppToken.significance / significanceSum) * weight
    arithmeticMean += weightContribution
    log += `  - Token: ${config.tokenMap[token].symbol}
  - Significance: ${bAppToken.significance}
  - Weight: ${weight}
  -> (Significance/Significance Sum) * Weight = ${BLUE}${weightContribution}${RESET}\n`
  }
  // Sum the significance * weight for the validator balance
  const validatorBalanceWeightContribution =
    (bApp.validatorBalanceSignificance / significanceSum) * validatorBalanceWeight
  arithmeticMean += validatorBalanceWeightContribution
  log += `  - Validator Balance
  - Significance: ${bApp.validatorBalanceSignificance}
  - Weight: ${validatorBalanceWeight}
  -> (Significance/Significance Sum) * Weight = ${BLUE}${validatorBalanceWeightContribution}${RESET}\n`

  log += `  --> Arithmetic mean = sum_t (significance_t/significance sum) * weight_t: ${GREEN}${arithmeticMean}${RESET}\n`

  logFinalWeightStrategy(strategyID, log)

  return arithmeticMean
}

function SignificanceSum(bApp: BApp): number {
  let sum = 0
  for (const token of bApp.tokens) {
    sum += token.significance
  }
  sum += bApp.validatorBalanceSignificance
  return sum
}

// ==================== Final Weight Calculator ====================

export function calculateParticipantsWeight(
  bApp: BApp,
  strategies: Strategy[],
  weightFormula: WeightFormula,
  combinationFunction: CombinationFunction,
): Map<StrategyID, number> {
  const tokenWeights = calculateTokenWeights(bApp, strategies, weightFormula)
  const validatorBalanceWeights = calculateValidatorBalanceWeights(strategies)

  return calculateFinalWeights(bApp, tokenWeights, validatorBalanceWeights, combinationFunction)
}

// Calculate the final weights given the weights for each token and validator balance
function calculateFinalWeights(
  bApp: BApp,
  tokenWeights: Map<StrategyID, Map<Address, number>>,
  validatorBalanceWeights: Map<StrategyID, number>,
  combinationFunction: CombinationFunction,
): Map<StrategyID, number> {
  const finalWeights = new Map<StrategyID, number>()
  const rawWeights = new Map<StrategyID, number>()

  let weightSum: number = 0
  for (const strategy of tokenWeights.keys()) {
    // Calculate final weight for strategy

    const strategyNonNormalizedWeight = combinationFunction(
      bApp,
      strategy,
      tokenWeights.get(strategy)!,
      validatorBalanceWeights.get(strategy)!,
    )

    finalWeights.set(strategy, strategyNonNormalizedWeight)
    rawWeights.set(strategy, strategyNonNormalizedWeight)
    weightSum += strategyNonNormalizedWeight
  }

  if (weightSum === 0) {
    weightSum = 1
  }

  for (const strategy of tokenWeights.keys()) {
    const weight = finalWeights.get(strategy)!
    const normalizedWeight = weight / weightSum
    finalWeights.set(strategy, normalizedWeight)
  }

  logNormalizedFinalWeights(finalWeights, rawWeights)

  return finalWeights
}

// ==================== Token Weight Calculators ====================

// Calculate the weights for tokens
function calculateTokenWeights(
  bApp: BApp,
  strategies: Strategy[],
  weightFormula: WeightFormula,
): Map<StrategyID, Map<Address, number>> {
  const tokenWeights = new Map<StrategyID, Map<Address, number>>()

  for (const bAppToken of bApp.tokens) {
    logToken(bAppToken.address, '🪙  Calculating token weights')

    // Total amount obligated to bApp
    let totalBAppAmount = calculateTotalBAppAmount(bAppToken.address, strategies)
    if (totalBAppAmount === 0) {
      totalBAppAmount = 1
    }
    logToken(bAppToken.address, `🗂️  Total amount obligated to bApp: ${totalBAppAmount}`)
    logToken(bAppToken.address, `🗂️  Beta: ${bAppToken.sharedRiskLevel}`)

    // Calculate weights for each strategy
    let weightSum: number = 0
    for (const strategy of strategies) {
      const strategyToken = getStrategyToken(strategy, bAppToken.address)
      const weight = weightFormula(strategy.id, strategyToken, bAppToken, totalBAppAmount)
      weightSum += weight

      // Store weight
      if (!tokenWeights.has(strategy.id)) {
        tokenWeights.set(strategy.id, new Map<Address, number>())
      }
      tokenWeights.get(strategy.id)!.set(bAppToken.address, weight)
    }

    if (weightSum === 0) {
      weightSum = 1
    }
    // Normalize weights
    for (const strategy of strategies) {
      const weight = tokenWeights.get(strategy.id)!.get(bAppToken.address)!
      const normalizedWeight = weight / weightSum
      tokenWeights.get(strategy.id)!.set(bAppToken.address, normalizedWeight)
    }
    logStrategyTokenWeights(bAppToken.address.toLowerCase(), tokenWeights)
  }

  return tokenWeights
}

// Calculate the total amount obligated to the bApp for a token
function calculateTotalBAppAmount(token: Address, strategies: Strategy[]): number {
  let total = 0
  for (const strategy of strategies) {
    // Sum strategy's obligated balance
    const strategyToken = getStrategyToken(strategy, token)
    const amount = strategyToken.amount
    const obligationPercentage = strategyToken.obligationPercentage
    total += amount * obligationPercentage
  }

  return total
}

// ==================== Validator Balance Weight Calculators ====================

// Calculate the weights for validator balance
function calculateValidatorBalanceWeights(strategies: Strategy[]): Map<StrategyID, number> {
  logVB('🪙  Calculating validator balance weights')

  const validatorBalanceWeights = new Map<StrategyID, number>()

  // Total validator balance for bApp
  let totalValidatorBalance = calculateTotalValidatorBalance(strategies)
  if (totalValidatorBalance === 0) {
    totalValidatorBalance = 1
  }

  logVB(`🗂️  Total VB amount in bApp: ${totalValidatorBalance}`)

  for (const strategy of strategies) {
    // Calculate weight for each strategy
    const weight = strategy.validatorBalance / totalValidatorBalance
    validatorBalanceWeights.set(strategy.id, weight)

    logVBStrategy(
      strategy.id,
      `🧮 Calculating normalized weight:
  - Validator Balance: ${strategy.validatorBalance}
  - Total VB amount in bApp: ${totalValidatorBalance}
  - Weight (validator balance / total amount): ${GREEN}${(100 * weight).toFixed(2)}%${RESET}`,
    )
  }

  logValidatorBalanceTable(strategies)

  return validatorBalanceWeights
}

// Calculate the total validator balance for the bApp
function calculateTotalValidatorBalance(strategies: Strategy[]): number {
  let total = 0
  for (const strategy of strategies) {
    total += strategy.validatorBalance
  }

  return total
}
