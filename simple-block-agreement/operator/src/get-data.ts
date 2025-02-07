import { request } from 'undici'
import { BApp, Strategy } from './app_interface'

const BEACONCHAIN_API = 'https://beaconcha.in/api/v1/block/latest'
const THE_GRAPH_API = 'https://api.studio.thegraph.com/query/53804/ssv-bapps-subgraph/version/latest'
const SSV_API_BASE_URL = 'https://api.stage.ops.ssvlabsinternal.com/api/v4/holesky/validators/explorer'

const VALIDATOR_BALANCE_OWNERS = [
  '0x219437D13532d225D98bACe5638EB9146D4BDD4B',
  '0x8F3A66Bb003EBBD5fB115981DfaD8D8400FCeb76',
  // '0xF90c557362C7f0AB7f32F725664a98fEccE9d384', // account with validator balance
]

// Convert hex string directly to Uint8Array
const hexToUint8Array = (hex: string): Uint8Array => {
  if (hex.startsWith('0x')) hex = hex.slice(2) // Remove "0x" prefix if present
  return new Uint8Array(hex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)))
}

const privateKeysMap = new Map<string, Uint8Array>()

privateKeysMap.set(
  '0x219437d13532d225d98bace5638eb9146d4bdd4b',
  hexToUint8Array('63920609bb76b09d816b9427e906d1ad7d3008b4f8a164adf3b4900969ac97fa'),
)

privateKeysMap.set(
  '0x8f3a66bb003ebbd5fb115981dfad8d8400fceb76',
  hexToUint8Array('228ffcb12deb17c72d7348415909290db647153c6b255c0b76628496d136b875'),
)

privateKeysMap.set(
  '0xaa184b86b4cdb747f4a3bf6e6fcd5e27c1d92c5c',
  hexToUint8Array('b21fb4ab30ecb815f0b836f75e8e27816494a80da81ce95be67028e916f48a90'),
)

type ValidatorBalance = {
  owner: string
  amount: number
}

export interface ValidatorInfo {
  index: number
  effective_balance: number
  status: string
  activation_epoch: number
}

export interface SSVValidator {
  id: string
  ownerAddress: string
  network: string
  version: string
  cluster: string
  publicKey: string
  isValid: boolean
  isLiquidated: boolean
  isDeleted: boolean
  isOperatorsValid: boolean
  isPublicKeyValid: boolean
  isSharesValid: boolean
  operators: string[]
  createdAt: string
  updatedAt: string
  status: string
  validatorInfo: ValidatorInfo
}

type DelegationOwner = {
  id: string
  delegators: {
    id: string
    percentage: number
  }[]
}

type DelegationStrategy = {
  strategy: {
    owner: DelegationOwner
  }
}

async function queryLatestSlotAndBlock(): Promise<number | undefined> {
  try {
    const { body } = await request(BEACONCHAIN_API)

    const bodyText = await body.text()
    const response = JSON.parse(bodyText)

    const latestEpoch = response.data.epoch
    const latestSlot = response.data.slot
    const latestBlock = response.data.exec_block_number

    console.log(`🔹 Latest Epoch: ${latestEpoch}`)
    console.log(`🔹 Latest Slot: ${latestSlot}`)
    console.log(`🔹 Latest Block: ${latestBlock ?? 'No execution block found'}`)

    return latestSlot
  } catch (error) {
    console.error('❌ Error fetching latest slot and block:', error)
    throw new Error('❌ Error fetching latest slot and block')
  }
}

type Delegator = {
  delegator: string
  percentage: number
}

type Delegation = {
  owner: string
  delegator: Delegator[]
}

type SubgraphResponse = {
  bApp: BApp
  strategies: Strategy[]
}

// todo move from percentage to ETH
async function querySSVBAppsSubgraph(
  bAppAddress: string,
  ssvSignificance: number,
  validatorBalanceSignificance: number,
): Promise<SubgraphResponse> {
  try {
    const query = {
      query: `
        query MyQuery {
            bapp(id: "${bAppAddress}") {
                strategies {
                    id
                    strategy {
                        deposits {
                            depositAmount
                            token
                        }
                        balances {
                            id
                        }
                        owner {
                            id
                        }
                    }
                    obligations {
                        obligatedBalance
                        percentage
                        token
                    }
                }
                bAppTokens {
                    token
                    totalObligatedBalance
                    sharedRiskLevel
                }
                owner {
                    id
                }
            }
        }
    `,
    }

    const response = await request(THE_GRAPH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query),
    })

    const bodyText = await response.body.text()
    const data = JSON.parse(bodyText)

    console.log('📊 SSV bApps Subgraph Data:', JSON.stringify(data))

    const strategies: Strategy[] = []

    data.data.bapp.strategies.forEach((strategy: any) => {
      console.log('AAA:', strategy.strategy.owner.id)
      console.log(privateKeysMap.get(strategy.strategy.owner.id))
      strategies.push({
        id: strategy.id,
        owner: strategy.strategy.owner.id,
        privateKey: privateKeysMap.get((strategy.strategy.owner.id as string).toLowerCase()) ?? new Uint8Array(),
        token: strategy.strategy.deposits.map((deposit: any) => ({
          token: deposit.token,
          amount: deposit.depositAmount,
          obligationPercentage:
            strategy.obligations.find((obligation: any) => obligation.token === deposit.token)?.percentage ?? 0,
          risk: 0,
        })),
        validatorBalance: 0, // ETH
      })
    })

    console.log('AAA:')

    const result = {
      bApp: {
        address: bAppAddress,
        token: data.data.bapp.bAppTokens.map((token: any) => ({
          token: token.token,
          sharedRiskLevel: token.sharedRiskLevel,
          significance: ssvSignificance,
        })),
        validatorBalanceSignificance: validatorBalanceSignificance,
      },
      strategies,
    }

    console.log('🔹 BApp and Strategies:', JSON.stringify(result, null, 2))

    return result
  } catch (error) {
    console.error('❌ Error querying The Graph:', error)
    return {
      bApp: {} as BApp,
      strategies: [],
    }
  }
}

async function queryDelegations(bAppAddress: string): Promise<Delegation[]> {
  try {
    const query = {
      query: `
        query MyQuery {
            bapp(id: "${bAppAddress}") {
                strategies {
                strategy {
                    owner {
                    id
                    delegators {
                        delegator {
                        id
                        }
                        percentage
                    }
                    }
                }
                }
            }
        }`,
    }

    const response = await request(THE_GRAPH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query),
    })

    const bodyText = await response.body.text()
    const data = JSON.parse(bodyText)

    console.log('📊 SSV bApps Subgraph Data:', JSON.stringify(data))

    const delegations: Delegation[] = []

    data.data.bapp.strategies.forEach((strategy: DelegationStrategy) => {
      delegations.push({
        owner: strategy.strategy.owner.id,
        delegator: strategy.strategy.owner.delegators.map((delegator: any) => ({
          delegator: delegator.delegator.id,
          percentage: delegator.percentage,
        })),
      })
    })

    console.log('🔹 Delegations:', JSON.stringify(delegations, null, 2))

    return delegations
  } catch (error) {
    console.error('❌ Error querying The Graph:', error)
    return []
  }
}

async function queryValidatorBalances(owners: string[]): Promise<ValidatorBalance[]> {
  try {
    const { body } = await request(SSV_API_BASE_URL)
    const bodyText = await body.text()
    const data = JSON.parse(bodyText)

    const result: ValidatorBalance[] = []

    owners.forEach((owner) => {
      let totalBalance = 0
      data.data.forEach((validator: SSVValidator) => {
        if (validator.ownerAddress === owner && validator.validatorInfo.status === 'active_ongoing') {
          totalBalance += validator.validatorInfo.effective_balance
        }
      })
      result.push({
        owner,
        amount: totalBalance,
      })
    })

    return result
  } catch (error) {
    console.error('❌ Error querying SSV API:', error)
    return []
  }
}

interface ReturnData {
  bApp: BApp
  strategies: Strategy[]
  slot: number
}

export async function getData(
  ssvSignificance: number,
  validatorBalanceSignificance: number,
  bAppAddress: string,
): Promise<ReturnData> {
  const slot = await queryLatestSlotAndBlock()
  const { bApp, strategies } = await querySSVBAppsSubgraph(bAppAddress, ssvSignificance, validatorBalanceSignificance)
  const delegations = await queryDelegations(bAppAddress)
  const result = await queryValidatorBalances(VALIDATOR_BALANCE_OWNERS)
  console.log('🔹 Validator Balances:', JSON.stringify(result, null, 2))
  delegations.forEach((delegation) => {
    const strategy = strategies.find((strategy) => strategy.owner === delegation.owner)
    if (strategy) {
      strategy.validatorBalance = result.find((balance) => balance.owner === strategy.owner)?.amount ?? 0
    }
  })
  return {
    bApp,
    strategies,
    slot: slot ?? 0,
  }
}

getData(2, 3, '0x89EF15BC1E7495e3dDdc0013C0d2B049d487b2fD').catch(console.error)
