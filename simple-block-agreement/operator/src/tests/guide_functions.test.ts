import { BAppDataFetcher } from '../guide_functions'
import {
  TestingbAppsPlatformAPI,
  TestingEthereumNodeAPI,
  TestingSSVNodeAPI,
  TestingBApp,
  TestingToken1,
  TestingToken2,
  strategy1,
  strategy2,
} from './testingutils/guide_functions'

describe('BAppDataFetcher', () => {
  let bAppDataFetcher: BAppDataFetcher

  beforeEach(() => {
    bAppDataFetcher = new BAppDataFetcher(
      new TestingbAppsPlatformAPI(),
      new TestingEthereumNodeAPI(),
      new TestingSSVNodeAPI(),
    )
  })

  it('should fetch obligated balances', async () => {
    const obligatedBalances = await bAppDataFetcher.fetchObligatedBalances(TestingBApp)

    // Two tokens
    expect(obligatedBalances.size).toBe(2)

    // Two accounts for each token
    expect(obligatedBalances.get(TestingToken1)!.size).toBe(2)
    expect(obligatedBalances.get(TestingToken2)!.size).toBe(2)

    // Strategy1
    expect(obligatedBalances.get(TestingToken1)!.get(strategy1)).toBe(100)
    expect(obligatedBalances.get(TestingToken2)!.get(strategy1)).toBe(400)

    // Strategy2
    expect(obligatedBalances.get(TestingToken1)!.get(strategy2)).toBe(1200)
    expect(obligatedBalances.get(TestingToken2)!.get(strategy2)).toBe(2000)
  })

  it('should fetch validator balances', async () => {
    const validatorBalances = await bAppDataFetcher.fetchValidatorBalances(TestingBApp)

    // Two accounts
    expect(validatorBalances.size).toBe(2)

    expect(validatorBalances.get(strategy1)!).toBe(41.6)
    expect(validatorBalances.get(strategy2)!).toBe(19.2)
  })

  it('should fetch risks', async () => {
    const risks = await bAppDataFetcher.fetchRisks(TestingBApp)

    // Two tokens
    expect(risks.size).toBe(2)

    // Two accounts for each token
    expect(risks.get(TestingToken1)!.size).toBe(2)
    expect(risks.get(TestingToken2)!.size).toBe(2)

    expect(risks.get(TestingToken1)!.get(strategy1)).toBe(1.1)
    expect(risks.get(TestingToken2)!.get(strategy1)).toBe(0.7)
    expect(risks.get(TestingToken1)!.get(strategy2)).toBe(1.3)
    expect(risks.get(TestingToken2)!.get(strategy2)).toBe(0.9)
  })
})
