import { BApp, BAppToken, Strategy, StrategyID, StrategyToken, Token } from "./app_interface"
import { getBAppToken, getStrategyToken } from "./util";

// Abstract class for calculating weight
export interface WeightCalculator {
  calculateParticipantsWeight(
    bApp: BApp,
    strategies: Strategy[],
  ): Map<StrategyID, number>
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
    this.bApp = {} as BApp;
    this.strategies = [];
  }

  calculateParticipantsWeight(
    bApp: BApp,
    strategies: Strategy[],
  ): Map<StrategyID, number> {

    this.bApp = bApp;
    this.strategies = strategies;

    const tokenWeights = this.calculateTokenWeights();
    const validatorBalanceWeights = this.calculateValidatorBalanceWeights();

    return this.calculateFinalWeights(tokenWeights, validatorBalanceWeights);
  }

  private calculateTokenWeights(): Map<StrategyID, Map<Token, number>> {

    // StrategyID -> Token -> Weight
    const tokenWeights = new Map<StrategyID, Map<Token, number>>();

    for (const bAppToken of this.bApp.token) {

      // Normalization constant
      const normalizationConstant = this.calculateNormalizationFactor(bAppToken);

      // Total amount obligated to bApp
      const totalBAppAmount = this.calculateTotalBAppAmount(bAppToken.token);

      for (const strategy of this.strategies) {

        // Calculate normalized weight for each strategy
        const strategyToken = getStrategyToken(strategy, bAppToken.token);
        const weight = normalizationConstant * this.CalculateWeightFormula(strategyToken, bAppToken, totalBAppAmount);

        // Store weight
        if (!tokenWeights.has(strategy.id)) {
          tokenWeights.set(strategy.id, new Map<Token, number>());
        }
        tokenWeights.get(strategy.id)!.set(bAppToken.token, weight);
      }
    }

    return tokenWeights;
  }

  // Calculate the normalization factor for a token
  private calculateNormalizationFactor(
    bAppToken: BAppToken,
  ): number {

    // Total amount obligated to bApp
    const totalBAppAmount = this.calculateTotalBAppAmount(bAppToken.token);

    let total = 0;
    for (const strategy of this.strategies) {
      // Add strategy's weight
      const strategyToken = getStrategyToken(strategy, bAppToken.token);
      total += this.CalculateWeightFormula(strategyToken, bAppToken, totalBAppAmount);
    }

    return 1 / total;
  }

  // Calculate the total amount obligated to the bApp for a token
  private calculateTotalBAppAmount(
    token: Token,
  ): number {

    let total = 0;
    for (const strategy of this.strategies) {
      // Sum strategy's obligated balance
      const strategyToken = getStrategyToken(strategy, token);
      const amount = strategyToken.amount;
      const obligationPercentage = strategyToken.obligationPercentage;
      total += amount * obligationPercentage;
    }

    return total;
  }

  // Calculate the weight for a token for a strategy as in the formula
  private CalculateWeightFormula(
    strategyToken: StrategyToken,
    bAppToken: BAppToken,
    totalBAppAmount: number,
  ): number {

    const obligation = strategyToken.obligationPercentage * strategyToken.amount;
    const obligationParticipation = obligation / totalBAppAmount;
    const risk = strategyToken.risk;
    const beta = bAppToken.sharedRiskLevel;

    return obligationParticipation * Math.exp(- beta * Math.max(1, risk));
  }

  // Calculate the weights for validator balance
  private calculateValidatorBalanceWeights(
  ): Map<StrategyID, number> {

    const validatorBalanceWeights = new Map<StrategyID, number>();

    // Total validator balance for bApp
    const totalValidatorBalance = this.calculateTotalValidatorBalance();

    for (const strategy of this.strategies) {
      // Calculate weight for each strategy
      const weight = strategy.validatorBalance / totalValidatorBalance;
      validatorBalanceWeights.set(strategy.id, weight);
    }

    return validatorBalanceWeights;
  }

  // Calculate the total validator balance for the bApp
  private calculateTotalValidatorBalance(): number {

    let total = 0;
    for (const strategy of this.strategies) {
      total += strategy.validatorBalance;
    }

    return total;
  }

  // Calculate the final weights given the weights for each token and validator balance
  private calculateFinalWeights(
    tokenWeights: Map<StrategyID, Map<Token, number>>,
    validatorBalanceWeights: Map<StrategyID, number>,
  ): Map<StrategyID, number> {

    const finalWeights = new Map<StrategyID, number>();

    // Normalization factor for final weight
    const normalizationFactor = this.calculateFinalWeightNormalizationFactor(tokenWeights, validatorBalanceWeights);

    for (const strategy of tokenWeights.keys()) {
      // Calculate final weight for strategy
      const tokenWeight = tokenWeights.get(strategy)!;
      const validatorBalanceWeight = validatorBalanceWeights.get(strategy)!;

      finalWeights.set(strategy, normalizationFactor * this.calculateHarmonicWeight(tokenWeight, validatorBalanceWeight));
    }

    return finalWeights;
  }

  // Calculate the normalization factor for the final weight
  private calculateFinalWeightNormalizationFactor(
    tokenWeights: Map<StrategyID, Map<Token, number>>,
    validatorBalanceWeights: Map<StrategyID, number>,
  ): number {

    let total = 0;
    for (const strategy of tokenWeights.keys()) {
      // Sum harmonic weight for each strategy
      const tokenWeight = tokenWeights.get(strategy)!;
      const validatorBalanceWeight = validatorBalanceWeights.get(strategy)!;

      total += this.calculateHarmonicWeight(tokenWeight, validatorBalanceWeight);
    }

    return 1 / total;
  }

  // Calculate the harmonic weight considering each token's (and validator balance) significance
  private calculateHarmonicWeight(
    tokenWeights: Map<Token, number>,
    validatorBalanceWeight: number,
  ): number {

    let harmonicMean = 0;
    for (const token of tokenWeights.keys()) {
      const bAppToken = getBAppToken(this.bApp, token);
      harmonicMean += bAppToken.significance / tokenWeights.get(token)!;
    }
    harmonicMean += this.bApp.validatorBalanceSignificance / validatorBalanceWeight;

    return 1 / harmonicMean;
  }
}
