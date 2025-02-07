import { request } from 'undici'

const BEACONCHAIN_API = 'https://beaconcha.in/api/v1/block/latest'
const THE_GRAPH_API = 'https://api.studio.thegraph.com/query/53804/ssv-bapps-subgraph/version/latest'
const SSV_API_BASE_URL = 'https://api.stage.ops.ssvlabsinternal.com/api/v4/holesky/validators/explorer'

const BAPP_ADDRESS = '0x89EF15BC1E7495e3dDdc0013C0d2B049d487b2fD'
const VALIDATOR_BALANCE_OWNERS = [
  '0x219437D13532d225D98bACe5638EB9146D4BDD4B',
  '0x8F3A66Bb003EBBD5fB115981DfaD8D8400FCeb76',
  '0xF90c557362C7f0AB7f32F725664a98fEccE9d384',
]

async function queryLatestSlotAndBlock() {
  try {
    const { body } = await request(BEACONCHAIN_API)

    const bodyText = await body.text()
    const response = JSON.parse(bodyText)

    if (response.status !== 'OK') {
      throw new Error(`Unexpected API response: ${JSON.stringify(response)}`)
    }

    const latestEpoch = response.data.epoch
    const latestSlot = response.data.slot
    const latestBlock = response.data.exec_block_number

    console.log(`🔹 Latest Epoch: ${latestEpoch}`)
    console.log(`🔹 Latest Slot: ${latestSlot}`)
    console.log(`🔹 Latest Block: ${latestBlock ?? 'No execution block found'}`)
  } catch (error) {
    console.error('❌ Error fetching latest slot and block:', error)
  }
}

async function querySSVBAppsSubgraph() {
  try {
    const query = {
      query: `
                query MyQuery {
                    bapp(id: "${BAPP_ADDRESS}") {
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
                            }
                            obligations {
                                obligatedBalance
                                percentage
                            }
                        }
                        bAppTokens {
                            token
                            totalObligatedBalance
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

    return data
  } catch (error) {
    console.error('❌ Error querying The Graph:', error)
    return null
  }
}

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

async function main() {
  await queryLatestSlotAndBlock()
  await querySSVBAppsSubgraph()
  const result = await queryValidatorBalances(VALIDATOR_BALANCE_OWNERS)
  console.log('🔹 Validator Balances:', JSON.stringify(result, null, 2))
}

main()
