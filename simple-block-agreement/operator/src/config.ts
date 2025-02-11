import * as fs from 'fs'
import * as path from 'path'
import * as dotenv from 'dotenv'
import { hexToUint8Array } from './app/util'

dotenv.config()

const bAppConfigPath = path.resolve(__dirname, 'bapp.json')
const bAppConfig = JSON.parse(fs.readFileSync(bAppConfigPath, 'utf-8'))

const privateKeysMap = new Map<string, Uint8Array>()
const privateKeysString = process.env.PRIVATE_KEYS || ''
privateKeysString.split(',').forEach((entry) => {
  const [address, privateKey] = entry.trim().split(':')
  if (address && privateKey) {
    privateKeysMap.set(address.toLowerCase(), hexToUint8Array(privateKey))
  }
})

// Create a token map (address -> symbol)
export const tokenMap: Record<string, string> = Object.fromEntries(
  bAppConfig.tokens.map((token: { address: string; symbol: string }) => [token.address.toLowerCase(), token.symbol]),
)

const env = {
  BAPP_ADDRESS: process.env.BAPP_ADDRESS || '',
  BEACONCHAIN_API: process.env.BEACONCHAIN_API || '',
  THE_GRAPH_API: process.env.THE_GRAPH_API || '',
  USE_EXPONENTIAL_WEIGHT: process.env.USE_EXPONENTIAL_WEIGHT === 'true',
  USE_HARMONIC_COMBINATION_FUNCTION: process.env.USE_HARMONIC_COMBINATION_FUNCTION === 'true',
  VALIDATOR_BALANCE_SIGNIFICANCE: Number(process.env.VALIDATOR_BALANCE_SIGNIFICANCE) || 0,
}

export const config = {
  ...env,
  tokenMap,
  tokens: bAppConfig.tokens,
  validatorBalanceSignificance: bAppConfig.validatorBalanceSignificance,
  privateKeysMap,
}
