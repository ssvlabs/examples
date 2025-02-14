import { BApp, BAppToken, Strategy, StrategyID, StrategyToken, Address } from '../types/app-interface'
import {
  logCombinationFunction,
  logFinalWeightStrategy,
  logNormalizedFinalWeights,
  logTokenWeightTable,
  logValidatorBalanceTable,
  logWeightFormula,
} from '../logging'
import { getBAppToken, getStrategyToken } from './util'

// ==================== Weight Formula ====================

export type WeightFormula = (
  strategyToken: StrategyToken,
  bAppToken: BAppToken,
  totalBAppAmount: number,
) => number

// Calculate the weight for a token for a strategy that decreases exponentially with the strategy's risk
export function exponentialWeightFormula(
  strategyToken: StrategyToken,
  bAppToken: BAppToken,
  totalBAppAmount: number,
): number {
  const obligation = strategyToken.obligationPercentage * strategyToken.amount
  const obligationParticipation = obligation / totalBAppAmount
  const risk = strategyToken.risk
  const beta = bAppToken.sharedRiskLevel

  const weight = obligationParticipation * Math.exp(-beta * Math.max(1, risk))

  return weight
}

// Calculate the weight for a token for a strategy that decreases polynomially with the strategy's risk
export function polynomialWeightFormula(
  strategyToken: StrategyToken,
  bAppToken: BAppToken,
  totalBAppAmount: number,
): number {
  const obligation = strategyToken.obligationPercentage * strategyToken.amount
  const obligationParticipation = obligation / totalBAppAmount
  const risk = strategyToken.risk
  const beta = bAppToken.sharedRiskLevel

  const weight = obligationParticipation / Math.pow(Math.max(1, risk), beta)

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
        `⚠️  Token ${token} has significance > 0 but strategy's weight is 0. Final weight will be 0.`,
      )
      return 0
    }
  }
  if (bApp.validatorBalanceSignificance != 0 && validatorBalanceWeight == 0) {
    logFinalWeightStrategy(
      strategyID,
      `⚠️  Validator balance has significance > 0 but strategy's weight is 0. Final weight will be 0.`,
    )
    return 0
  }

  // Calculate the harmonic mean
  const significanceSum = SignificanceSum(bApp)

  let harmonicMean = 0
  // Sum the significance / weight for each token
  for (const token of tokenWeights.keys()) {
    const bAppToken = getBAppToken(bApp, token)
    const weight = tokenWeights.get(token)!
    const weightContribution = bAppToken.significance / significanceSum / weight
    harmonicMean += weightContribution
  }
  // Sum the significance / weight for the validator balance
  const validatorBalanceWeightContribution =
    bApp.validatorBalanceSignificance / significanceSum / validatorBalanceWeight
  harmonicMean += validatorBalanceWeightContribution

  // Invert the sum to get the harmonic mean
  harmonicMean = 1 / harmonicMean

  return harmonicMean
}

// Calculate the arithmetic weight considering each token's (and validator balance) significance
export function arithmeticCombinationFunction(
  bApp: BApp,
  strategyID: StrategyID,
  tokenWeights: Map<Address, number>,
  validatorBalanceWeight: number,
): number {

  const significanceSum = SignificanceSum(bApp)

  let arithmeticMean = 0
  // Sum the significance * weight for each token
  for (const token of tokenWeights.keys()) {
    const bAppToken = getBAppToken(bApp, token)
    const weight = tokenWeights.get(token)!
    const weightContribution = (bAppToken.significance / significanceSum) * weight
    arithmeticMean += weightContribution
  }
  // Sum the significance * weight for the validator balance
  const validatorBalanceWeightContribution =
    (bApp.validatorBalanceSignificance / significanceSum) * validatorBalanceWeight
  arithmeticMean += validatorBalanceWeightContribution

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
  useExponentialWeight: boolean, useHarmonicCombinationFunction: boolean,
): Map<StrategyID, number> {

  // Set weight and combination functions
  const weightFunction = useExponentialWeight ? exponentialWeightFormula : polynomialWeightFormula
  const combinationFunction = useHarmonicCombinationFunction
    ? harmonicCombinationFunction
    : arithmeticCombinationFunction

  logWeightFormula(useExponentialWeight)
  const tokenWeights = calculateTokenWeights(bApp, strategies, weightFunction)
  const validatorBalanceWeights = calculateValidatorBalanceWeights(strategies)

  logCombinationFunction(useHarmonicCombinationFunction)
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

  // Init return variable
  const tokenWeights = new Map<StrategyID, Map<Address, number>>()

  // Compute weights for each token
  for (const bAppToken of bApp.tokens) {

    // Total amount obligated to bApp
    let totalBAppAmount = calculateTotalBAppAmount(bAppToken.address, strategies)
    if (totalBAppAmount === 0) {
      totalBAppAmount = 1
    }

    // Calculate weights for each strategy
    let weightSum: number = 0
    for (const strategy of strategies) {
      const strategyToken = getStrategyToken(strategy, bAppToken.address)
      const weight = weightFormula(strategyToken, bAppToken, totalBAppAmount)
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

    // Log
    const tokenWeightMap = new Map<StrategyID, number>()
    for (const [strategyID, weights] of tokenWeights) {
      tokenWeightMap.set(strategyID, weights.get(bAppToken.address)!)
    }
    logTokenWeightTable(bAppToken, strategies, totalBAppAmount, tokenWeightMap)

    // Normalize weights
    for (const strategy of strategies) {
      const weight = tokenWeights.get(strategy.id)!.get(bAppToken.address)!
      const normalizedWeight = weight / weightSum
      tokenWeights.get(strategy.id)!.set(bAppToken.address, normalizedWeight)
    }
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

  const validatorBalanceWeights = new Map<StrategyID, number>()

  // Total validator balance for bApp
  let totalValidatorBalance = calculateTotalValidatorBalance(strategies)
  if (totalValidatorBalance === 0) {
    totalValidatorBalance = 1
  }


  for (const strategy of strategies) {
    // Calculate weight for each strategy
    const weight = strategy.validatorBalance / totalValidatorBalance
    validatorBalanceWeights.set(strategy.id, weight)
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
