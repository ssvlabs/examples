import dotenv from 'dotenv'

import { request } from 'undici'

import { config } from './config'

import type { BApp, Strategy } from './app/app_interface'
import type { BAppToken, Owner, ResponseData } from './types/ssv-graphql'
import { logBAppSummary, logTokenWeightSummary } from './app/logging'

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
                        id
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

    const response = await request(config.THE_GRAPH_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query),
    })

    const bodyText = await response.body.text()
    const data: ResponseData = JSON.parse(bodyText)

    if (!data?.data?.bapp) throw new Error('No BApp data returned from The Graph')

    // console.log('📊 SSV bApps Subgraph Data:', JSON.stringify(data))

    const getValidatorBalance = (owner: Owner): number =>
      owner.delegators?.reduce(
        (acc, delegation) =>
          acc + (32 * Number(delegation.delegator.validatorCount) * Number(delegation.percentage)) / 100,
        0,
      ) ?? 0

    const strategies: Strategy[] = data.data.bapp.strategies.map((strategy) => ({
      id: Number(strategy.strategy.id),
      owner: strategy.strategy.owner.id,
      privateKey: config.privateKeysMap.get(strategy.strategy.owner.id.toLowerCase()) ?? new Uint8Array(),
      tokens: strategy.strategy.deposits.map((deposit) => {
        const obligation = strategy.obligations.find((obligation) => obligation.token === deposit.token)
        const balance = strategy.strategy.balances.find((balance) => balance.token === deposit.token)
        return {
          address: deposit.token,
          amount: Number(deposit.depositAmount),
          obligationPercentage: obligation ? Number(obligation.percentage) / 100 : 0,
          risk: balance ? Number(balance.riskValue) / 100 : 0,
        }
      }),
      validatorBalance: getValidatorBalance(strategy.strategy.owner),
    }))

    const bApp: BApp = {
      address: bAppAddress,
      tokens: data.data.bapp.bAppTokens.map((token: BAppToken) => ({
        address: token.token,
        sharedRiskLevel: Number(token.sharedRiskLevel),
        significance: config.tokenMap[token.token.toLowerCase()].significance,
      })),
      validatorBalanceSignificance: config.validatorBalanceSignificance,
    }

    logBAppSummary(bApp, strategies)

    bApp.tokens.forEach((token) => {
      logTokenWeightSummary(token.address, token.sharedRiskLevel, strategies)
    })

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

  return { bApp, strategies, slot }
}
