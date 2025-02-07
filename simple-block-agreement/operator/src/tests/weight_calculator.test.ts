import { BApp, Strategy } from "../app_interface"
import { HarmonicWeightCalculator } from "../weight_calculator"
import { TestingBApp } from "./testingutils/app"

describe('HarmonicWeightCalculator', () => {

  beforeEach(() => {})

  it('SSV token and validator balance with 2 strategies', () => {

    const bApp: BApp = TestingBApp

    const strategies: Strategy[] = [
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

    var calculator = new HarmonicWeightCalculator()

    const weights = calculator.calculateParticipantsWeight(bApp, strategies)

    expect(weights.get(1)).toBeCloseTo(0.387, 2)
    expect(weights.get(2)).toBeCloseTo(0.613, 2)
  })
})
