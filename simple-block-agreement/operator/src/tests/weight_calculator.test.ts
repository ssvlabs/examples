import { HarmonicWeightCalculator } from '../weight_calculator';
import { token, strategyID, amount } from '../types';

describe('HarmonicWeightCalculator', () => {
    let calculator: HarmonicWeightCalculator;
    let beta: Map<token, number>;
    let tokenSignificance: Map<token, number>;
    let validatorBalanceSignificance: number;

    beforeEach(() => {
        beta = new Map<token, number>([
            ['SSV', 2],
        ]);
        tokenSignificance = new Map<token, number>([
            ['SSV', 2/3],
        ]);
        validatorBalanceSignificance = 1/3;
        calculator = new HarmonicWeightCalculator(beta, tokenSignificance, validatorBalanceSignificance);
    });

    it('SSV token and validator balance with 2 strategies', () => {
        const strategyTokenWeight = new Map<strategyID, Map<token, number>>([
            [1, new Map<token, number>([['SSV', 0.2]])],
            [2, new Map<token, number>([['SSV', 0.4]])]
        ]);
        const strategyValidatorBalanceWeights = new Map<strategyID, number>([
            [1, 0.5],
            [2, 0.7],
            [3, 0.6]
        ]);

        const obligatedBalances = new Map<token, Map<strategyID, amount>>([
            ['SSV', new Map<strategyID, amount>([
                [1, 50],
                [2, 20],
            ])]
        ]);
        const validatorBalances = new Map<strategyID, amount>([
            [1, 32],
            [2, 96]
        ]);
        const risks = new Map<token, Map<strategyID, number>>([
            ['SSV', new Map<strategyID, number>([
                [1, 1.5],
                [2, 1.0],
            ])]
        ]);

        const participantsWeights = calculator.calculateParticipantsWeight(obligatedBalances, validatorBalances, risks);
        expect(participantsWeights.get(1)).toBeCloseTo(0.387, 2);
        expect(participantsWeights.get(2)).toBeCloseTo(0.613, 2);
    });
});