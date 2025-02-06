import { token, strategyID, amount } from './types'

export interface WeightCalculator {
  calculateParticipantsWeight(
    obligatedBalances: Map<token, Map<strategyID, amount>>,
    validatorBalances: Map<strategyID, amount>,
    risks: Map<token, Map<strategyID, number>>,
  ): Map<strategyID, number>
}

export class HarmonicWeightCalculator implements WeightCalculator {
  public beta: Map<token, number>
  public tokenSignificance: Map<token, number>
  public validatorBalanceSignificance: number

  constructor(beta: Map<token, number>, tokenSignificance: Map<token, number>, validatorBalanceSignificance: number) {
    this.beta = beta
    this.tokenSignificance = tokenSignificance
    this.validatorBalanceSignificance = validatorBalanceSignificance
  }

  // Normalize significance attributed to each token and the validator balance
  private normalizeTokenSignificance() {
    let total = 0

    // Sum all
    for (const significance of this.tokenSignificance.values()) {
      total += significance
    }
    total += this.validatorBalanceSignificance

    // Normalize all
    for (const token of this.tokenSignificance.keys()) {
      this.tokenSignificance.set(token, this.tokenSignificance.get(token)! / total)
    }
    this.validatorBalanceSignificance /= total
  }

  // Compute the harmonic mean of weights for each type of capital
  // 1/ (sum(capital type significance / strategy weight for capital type))
  public computeHarmonicWeight(
    strategyTokenWeight: Map<token, number>,
    strategyValidatorBalanceWeight: number,
  ): number {
    let harmonicMean = 0
    for (const token of strategyTokenWeight.keys()) {
      harmonicMean += this.tokenSignificance.get(token)! / strategyTokenWeight.get(token)!
    }
    harmonicMean += this.validatorBalanceSignificance / strategyValidatorBalanceWeight
    return 1 / harmonicMean
  }

  // Compute the harmonic mean of weights for each type of capital with a normalization factor
  public computeNormalizedHarmonicWeight(
    strategyTokenWeight: Map<token, number>,
    strategyValidatorBalanceWeight: number,
    normalizationFactor: number,
  ): number {
    return normalizationFactor * this.computeHarmonicWeight(strategyTokenWeight, strategyValidatorBalanceWeight)
  }

  // Compute the normalization factor for the final weight
  public computeWeightNormalizationFactor(
    strategyTokenWeight: Map<strategyID, Map<token, number>>,
    strategyValidatorBalanceWeights: Map<strategyID, number>,
  ): number {
    let normalizationFactor = 0

    for (const strategy of strategyTokenWeight.keys()) {
      normalizationFactor += this.computeHarmonicWeight(
        strategyTokenWeight.get(strategy)!,
        strategyValidatorBalanceWeights.get(strategy)!,
      )
    }
    return 1 / normalizationFactor
  }

  calculateParticipantsWeight(
    obligatedBalances: Map<token, Map<strategyID, amount>>,
    validatorBalances: Map<strategyID, amount>,
    risks: Map<token, Map<strategyID, number>>,
  ): Map<strategyID, number> {
    // Normalize token significance
    this.normalizeTokenSignificance()

    // Compute the Map: Strategy -> Token -> Weight
    const strategyTokenWeights = new Map<strategyID, Map<token, number>>()
    for (const token of obligatedBalances.keys()) {
      // Get Strategy -> Weight for the token
      const strategyWeightsForToken = computeStrategyWeights(
        obligatedBalances.get(token)!,
        risks.get(token)!,
        this.beta.get(token)!,
      )

      // Assign weights in the map
      for (const strategy of strategyWeightsForToken.keys()) {
        if (!strategyTokenWeights.has(strategy)) {
          strategyTokenWeights.set(strategy, new Map())
        }
        strategyTokenWeights.get(strategy)!.set(token, strategyWeightsForToken.get(strategy)!)
      }
    }
    // Get strategies' weight for validator balance
    const validatorBalanceWeights = computeValidatorBalanceWeights(validatorBalances)

    const normalizationFactor = this.computeWeightNormalizationFactor(strategyTokenWeights, validatorBalanceWeights)

    const ret = new Map<strategyID, number>()
    for (const strategy of strategyTokenWeights.keys()) {
      ret.set(
        strategy,
        this.computeNormalizedHarmonicWeight(
          strategyTokenWeights.get(strategy)!,
          validatorBalanceWeights.get(strategy)!,
          normalizationFactor,
        ),
      )
    }

    return ret
  }
}

// Calculate the weight as in the formula (without the normalization factor)
function calculateWeight(amount: number, risk: number, beta: number, totalAmount: amount): number {
  return (amount / totalAmount) * Math.exp(-beta * Math.max(1, risk))
}

// Calculate the normalized weight as in the formula
function calculateNormalizedWeight(
  amount: number,
  risk: number,
  beta: number,
  totalAmount: amount,
  normalizationFactor: number,
): number {
  return normalizationFactor * calculateWeight(amount, risk, beta, totalAmount)
}

// Sum all amounts in the map
function sumAmounts(amounts: Map<strategyID, amount>): amount {
  let totalAmount = 0
  for (const amount of amounts.values()) {
    totalAmount += amount
  }
  return totalAmount
}

// Computes the normalization factor as in the formula.
// Inputs:
// - amounts: the capital allocated by each strategy
// - risks: the capital risk of each strategy
// - beta: the shared risk level for such capital
function computeNormalizationFactor(
  amounts: Map<strategyID, amount>,
  risks: Map<strategyID, number>,
  beta: number,
): number {
  const totalAmount = sumAmounts(amounts)

  // Sum the weights of all strategies
  let normalizationFactor = 0
  for (const strategy of amounts.keys()) {
    normalizationFactor += calculateWeight(amounts.get(strategy)!, risks.get(strategy)!, beta, totalAmount)
  }

  return 1 / normalizationFactor
}

// Computes the weight for all strategies for a certain
// Inputs:
// - amounts: the capital allocated by each strategy
// - risks: the capital risk of each strategy
// - beta: the shared risk level for such capital
function computeStrategyWeights(
  amounts: Map<strategyID, amount>,
  risks: Map<strategyID, number>,
  beta: number,
): Map<strategyID, number> {
  const totalAmount = sumAmounts(amounts)

  // Compute the normalization factor
  const normalizationFactor = computeNormalizationFactor(amounts, risks, beta)

  // Calculate the weight for each strategy
  const strategyWeights = new Map<strategyID, number>()
  for (const strategy of amounts.keys()) {
    strategyWeights.set(
      strategy,
      calculateNormalizedWeight(amounts.get(strategy)!, risks.get(strategy)!, beta, totalAmount, normalizationFactor),
    )
  }

  return strategyWeights
}

// Computes the weight for all strategies based on validator balances
function computeValidatorBalanceWeights(amounts: Map<strategyID, amount>): Map<strategyID, number> {
  // Validator balance has no risk, so we set beta to 0 to ignore the risk component
  const validatorBalanceBeta = 0

  // Create a map with zero risk for all strategies
  const zeroRisks = new Map<strategyID, number>()
  for (const strategy of amounts.keys()) {
    zeroRisks.set(strategy, 0)
  }

  return computeStrategyWeights(amounts, zeroRisks, validatorBalanceBeta)
}
