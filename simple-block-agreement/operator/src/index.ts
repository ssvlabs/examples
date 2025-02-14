import dotenv from 'dotenv'

import { App } from './app/app'
import { getData } from './data/get-data'
import { logBAppSummary } from './logging'

dotenv.config()

const main = async () => {
  const app = new App()

  const bAppAddress = process.env.BAPP_ADDRESS || ''
  const useExponentialWeight = process.env.USE_EXPONENTIAL_WEIGHT === 'true'
  const useHarmonicCombination = process.env.USE_HARMONIC_COMBINATION_FUNCTION === 'true'

  const { bApp, strategies, slot } = await getData(bAppAddress)

  // Logging
  logBAppSummary(bApp, strategies)

  app.Setup(bApp, strategies, useExponentialWeight, useHarmonicCombination)
  app.StartAgreement(slot)
}

main().catch(console.error)
