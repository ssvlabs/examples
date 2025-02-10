import { BApp, Strategy } from '../../app_interface'
import { testingKeyPair1, testingKeyPair2, testingKeyPair3, testingKeyPair4 } from './protocol'

// BApp
export const TestingBApp: BApp = {
  address: 'SimpleBlockAgreement',
  token: [{ token: 'SSV', sharedRiskLevel: 2, significance: 2 }],
  validatorBalanceSignificance: 1,
}

// Strategies
export const Testing4Strategies: Strategy[] = [
  {
    id: 1,
    owner: 'owner1',
    privateKey: testingKeyPair1.privateKey,
    token: [{ token: 'SSV', amount: 100, obligationPercentage: 0.5, risk: 1.5 }],
    validatorBalance: 32,
  },
  {
    id: 2,
    owner: 'owner2',
    privateKey: testingKeyPair2.privateKey,
    token: [{ token: 'SSV', amount: 200, obligationPercentage: 0.1, risk: 1.0 }],
    validatorBalance: 96,
  },
  {
    id: 3,
    owner: 'owner3',
    privateKey: testingKeyPair3.privateKey,
    token: [{ token: 'SSV', amount: 150, obligationPercentage: 0.2, risk: 1.2 }],
    validatorBalance: 64,
  },
  {
    id: 4,
    owner: 'owner4',
    privateKey: testingKeyPair4.privateKey,
    token: [{ token: 'SSV', amount: 300, obligationPercentage: 0.2, risk: 1.2 }],
    validatorBalance: 128,
  },
]
