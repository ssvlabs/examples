import dotenv from 'dotenv'

import { App } from './app/app'
import { getData } from './data/get-data'

dotenv.config()

const main = async () => {
  const requiredEnvVars = [
    'BEACONCHAIN_API',
    'THE_GRAPH_API',
    'BAPP_ADDRESS',
    'USE_EXPONENTIAL_WEIGHT',
    'USE_HARMONIC_COMBINATION_FUNCTION',
    'PRIVATE_KEYS',
  ]

  requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
      console.error(`Missing required environment variable: ${envVar}`)
      process.exit(1)
    }
  })

  const app = new App()

  const bAppAddress = process.env.BAPP_ADDRESS || ''
  const useExponentialWeight = process.env.USE_EXPONENTIAL_WEIGHT === 'true'
  const useHarmonicCombination = process.env.USE_HARMONIC_COMBINATION_FUNCTION === 'true'

  const { bApp, strategies, slot } = await getData(bAppAddress)

  app.Setup(bApp, strategies, useExponentialWeight, useHarmonicCombination)
  app.StartAgreement(slot)
}

main().catch(console.error)
