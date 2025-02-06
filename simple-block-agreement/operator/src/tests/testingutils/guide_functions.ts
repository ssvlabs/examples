import { bAppsPlatformAPI, EthereumNodeAPI, SSVNodeAPI } from '../../guide_functions'

// BApps
export const TestingBApp = 'bApp1'
export const TestingBApp2 = 'bApp2'

// Tokens
export const TestingToken1 = 'token1'
export const TestingToken2 = 'token2'
export const BetaToken1 = 1
export const BetaToken2 = 2

// Strategies
export const strategy1 = 1
export const strategy2 = 2
export const strategy3 = 2

// Owners
export const owner1 = 'owner1' // owner of strategy1
export const owner2 = 'owner2' // owner of strategy2 and strategy3

// Balances
export const strategy1Balance = new Map([
  [TestingToken1, 1000],
  [TestingToken2, 2000],
])
export const strategy2Balance = new Map([
  [TestingToken1, 4000],
  [TestingToken2, 5000],
])
export const strategy3Balance = new Map([
  [TestingToken1, 100],
  [TestingToken2, 100],
])

// Obligations
export const strategy1Obligation = new Map([
  [
    TestingToken1,
    new Map([
      [TestingBApp, 0.1],
      [TestingBApp2, 1.0],
    ]),
  ],
  [
    TestingToken2,
    new Map([
      [TestingBApp, 0.2],
      [TestingBApp2, 0.5],
    ]),
  ],
])
export const strategy2Obligation = new Map([
  [
    TestingToken1,
    new Map([
      [TestingBApp, 0.3],
      [TestingBApp2, 1.0],
    ]),
  ],
  [
    TestingToken2,
    new Map([
      [TestingBApp, 0.4],
      [TestingBApp2, 0.5],
    ]),
  ],
])

// Delegators
export const delegator1 = 'delegator1' // delegates to owner1
export const delegator1ToOwner1 = 0.5
export const delegator2 = 'delegator2' // delegates to owner1 and owner2
export const delegator2ToOwner1 = 0.4
export const delegator2ToOwner2 = 0.3

export class TestingbAppsPlatformAPI implements bAppsPlatformAPI {
  GetbAppTokens(bApp: string): Promise<Map<string, number>> {
    if (bApp === TestingBApp) {
      return Promise.resolve(
        new Map([
          [TestingToken1, BetaToken1],
          [TestingToken2, BetaToken2],
        ]),
      )
    }
    return Promise.resolve(new Map())
  }
  GetStrategies(): Promise<number[]> {
    return Promise.resolve([strategy1, strategy2, strategy3])
  }
  GetStrategyOwnerAccount(strategy: number): Promise<string> {
    if (strategy === strategy1) {
      return Promise.resolve(owner1)
    }
    if (strategy === strategy2 || strategy === strategy3) {
      return Promise.resolve(owner2)
    }
    return Promise.resolve('')
  }
  GetStrategyOptedInToBApp(ownerAccount: string, bApp: string): Promise<number> {
    if (ownerAccount === owner1 && bApp === TestingBApp) {
      return Promise.resolve(strategy1)
    }
    if (ownerAccount === owner2 && bApp === TestingBApp) {
      return Promise.resolve(strategy2)
    }
    return Promise.resolve(0)
  }
  GetStrategyBalance(strategy: number): Promise<Map<string, number>> {
    switch (strategy) {
      case strategy1:
        return Promise.resolve(strategy1Balance)
      case strategy2:
        return Promise.resolve(strategy2Balance)
      case strategy3:
        return Promise.resolve(strategy3Balance)
      default:
        return Promise.resolve(new Map())
    }
  }
  GetObligation(strategy: number, bApp: string, token: string): Promise<number> {
    if (bApp !== TestingBApp) {
      return Promise.resolve(0)
    }
    if (strategy === strategy1) {
      return Promise.resolve(strategy1Obligation.get(token)!.get(bApp)!)
    }
    if (strategy === strategy2) {
      return Promise.resolve(strategy2Obligation.get(token)!.get(bApp)!)
    }

    return Promise.resolve(0)
  }
  GetDelegatorsToAccount(account: string): Promise<Map<string, number>> {
    if (account === owner1) {
      return Promise.resolve(
        new Map([
          [delegator1, delegator1ToOwner1],
          [delegator2, delegator2ToOwner1],
        ]),
      )
    }
    if (account === owner2) {
      return Promise.resolve(new Map([[delegator2, delegator2ToOwner2]]))
    }
    return Promise.resolve(new Map())
  }
  AllObligationsForToken(strategy: number, token: string): Promise<Map<string, number>> {
    if (strategy === strategy1) {
      return Promise.resolve(strategy1Obligation.get(token)!)
    }
    if (strategy === strategy2) {
      return Promise.resolve(strategy2Obligation.get(token)!)
    }
    return Promise.resolve(new Map())
  }
}

// Validator pubkeys and balances
export const testingPubKey1 = 'pubKey1' // owned by delegator1
export const testingPubKey2 = 'pubKey2' // owned by delegator1 but inactive
export const testingPubKey3 = 'pubKey3' // owned by delegator2

export const testingValidatorBalance1 = 32
export const testingValidatorBalance2 = 1000
export const testingValidatorBalance3 = 64

export class TestingEthereumNodeAPI implements EthereumNodeAPI {
  GetValidatorBalance(pubKey: string): Promise<{ balance: number; isActive: boolean }> {
    if (pubKey === testingPubKey1) {
      return Promise.resolve({ balance: testingValidatorBalance1, isActive: true })
    }
    if (pubKey === testingPubKey2) {
      return Promise.resolve({ balance: testingValidatorBalance2, isActive: false })
    }
    if (pubKey === testingPubKey3) {
      return Promise.resolve({ balance: testingValidatorBalance3, isActive: true })
    }
    return Promise.resolve({ balance: 0, isActive: false })
  }
}

export class TestingSSVNodeAPI implements SSVNodeAPI {
  GetValidatorsPubKeys(account: string): Promise<string[]> {
    if (account === delegator1) {
      return Promise.resolve([testingPubKey1, testingPubKey2])
    }
    if (account === delegator2) {
      return Promise.resolve([testingPubKey3])
    }
    return Promise.resolve([])
  }
}
