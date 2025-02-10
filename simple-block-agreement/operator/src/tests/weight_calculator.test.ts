import { BApp, Strategy } from '../app_interface'
import {
  arithmeticCombinationFunction,
  calculateParticipantsWeight,
  exponentialWeightFormula,
  harmonicCombinationFunction,
  polynomialWeightFormula,
} from '../weight_calculator'
import { TestingBApp } from './testingutils/app'
describe('HarmonicWeightCalculator', () => {
  let bApp: BApp
  let strategies: Strategy[]

  beforeEach(() => {
    bApp = TestingBApp

    strategies = [
      {
        id: 1,
        owner: 'owner1',
        privateKey: new Uint8Array([1, 2, 3, 4]),
        token: [{ token: 'SSV', amount: 100, obligationPercentage: 0.5, risk: 1.5 }],
        validatorBalance: 32,
      },
      {
        id: 2,
        owner: 'owner2',
        privateKey: new Uint8Array([5, 6, 7, 8]),
        token: [{ token: 'SSV', amount: 200, obligationPercentage: 0.1, risk: 1.0 }],
        validatorBalance: 96,
      },
    ]
  })

  it('SSV token and validator balance with 2 strategies - exponential weight and harmonic combination', () => {
    const weights = calculateParticipantsWeight(bApp, strategies, exponentialWeightFormula, harmonicCombinationFunction)

    expect(weights.get(1)).toBeCloseTo(0.387, 2)
    expect(weights.get(2)).toBeCloseTo(0.613, 2)
  })

  it('SSV token and validator balance with 2 strategies - polynomial weight and arithmetic combination', () => {
    const weights = calculateParticipantsWeight(
      bApp,
      strategies,
      polynomialWeightFormula,
      arithmeticCombinationFunction,
    )

    expect(weights.get(1)).toBeCloseTo(0.4342, 2)
    expect(weights.get(2)).toBeCloseTo(0.5658, 2)
  })
})
