import dotenv from 'dotenv'

import { request } from 'undici'

import { config } from './config'

import type { BApp, Strategy } from './app_interface'
import type { Owner, ResponseData } from './types/ssv-graphql'

dotenv.config()

type SubgraphResponse = {
  bApp: BApp
  strategies: Strategy[]
}

type ReturnData = SubgraphResponse & {
  slot: number
}

async function queryLatestSlot(): Promise<number> {
  try {
    const beaconchainApi = process.env.BEACONCHAIN_API
    if (!beaconchainApi) throw new Error('BEACONCHAIN_API is not defined in the environment variables')
    const { body } = await request(beaconchainApi)

    const bodyText = await body.text()
    const response = JSON.parse(bodyText)

    if (!response?.data) throw new Error('Invalid response structure from Beaconchain API')

    return response.data.slot
  } catch (error) {
    console.error('❌ Error fetching latest slot and block:', error)
    return 0
  }
}

async function querySubgraph(bAppAddress: string): Promise<SubgraphResponse> {
  try {
    const query = {
      query: `
        query MyQuery {
            bapp(id: "${bAppAddress}") {
                strategies {
                    id
                    strategy {
                        bApps {
                          obligations {
                            percentage
                          }
                          id
                        }
                        deposits {
                            depositAmount
                            token
                        }
                        balances {
                            id
                            token
                            riskValue
                        }
                        owner {
                            id
                            delegators {
                              delegator {
                                id 
                                validatorCount
                              }
                              percentage
                            }
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

    const THE_GRAPH_API = process.env.THE_GRAPH_API
    if (!THE_GRAPH_API) throw new Error('THE_GRAPH_API is not defined in the environment variables')

    const response = await request(THE_GRAPH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query),
    })

    const bodyText = await response.body.text()
    const data: ResponseData = JSON.parse(bodyText)

    if (!data?.data?.bapp) throw new Error('No BApp data returned from The Graph')

    console.log('📊 SSV bApps Subgraph Data:', JSON.stringify(data))

    const getValidatorBalance = (owner: Owner): number =>
      owner.delegators?.reduce(
        (acc, delegation) =>
          acc + (32 * Number(delegation.delegator.validatorCount) * Number(delegation.percentage)) / 100,
        0,
      ) ?? 0

    const strategies: Strategy[] = data.data.bapp.strategies.map((strategy) => ({
      id: Number(strategy.id),
      owner: strategy.strategy.owner.id,
      privateKey: config.privateKeysMap.get(strategy.strategy.owner.id.toLowerCase()) ?? new Uint8Array(),
      token: strategy.strategy.deposits.map((deposit) => {
        const obligation = strategy.obligations.find((obligation) => obligation.token === deposit.token)
        const balance = strategy.strategy.balances.find((balance) => balance.token === deposit.token)

        return {
          token: deposit.token,
          amount: Number(deposit.depositAmount),
          obligationPercentage: obligation ? Number(obligation.percentage) : 0,
          risk: balance ? Number(balance.riskValue) : 0,
        }
      }),
      validatorBalance: getValidatorBalance(strategy.strategy.owner),
    }))

    const bApp = {
      address: bAppAddress,
      token: data.data.bapp.bAppTokens.map((token: any) => ({
        token: token.token,
        sharedRiskLevel: token.sharedRiskLevel,
        significance: 0,
      })),
      validatorBalanceSignificance: 0,
    }

    console.log('🔹 BApp:', JSON.stringify(bApp, null, 2))
    console.log('🔹 Strategies:', JSON.stringify(strategies, null, 2))

    return {
      bApp,
      strategies,
    }
  } catch (error) {
    console.error('❌ Error querying The Graph:', error)
    return {
      bApp: {} as BApp,
      strategies: [],
    }
  }
}

export async function getData(bAppAddress: string): Promise<ReturnData> {
  const slot = await queryLatestSlot()
  const { bApp, strategies } = await querySubgraph(bAppAddress)

  const validatorBalanceSignificance = Number(process.env.VALIDATOR_BALANCE_SIGNIFICANCE) || 0
  const ssvTokenSignificance = Number(process.env.SSV_TOKEN_SIGNIFICANCE) || 0

  bApp.validatorBalanceSignificance = validatorBalanceSignificance
  if (bApp.token.length > 0) {
    bApp.token[0].significance = ssvTokenSignificance
  }

  return { bApp, strategies, slot }
}

getData('0x89EF15BC1E7495e3dDdc0013C0d2B049d487b2fD').catch(console.error)
