import dotenv from 'dotenv'

import { App } from './app'
import { getData } from './get-data'

dotenv.config()

const main = async () => {
  const app = new App()

  const bAppAddress = process.env.BAPP_ADDRESS || ''
  const useExponentialWeight = process.env.USE_EXPONENTIAL_WEIGHT === 'true'
  const useHarmonicCombination = process.env.USE_HARMONIC_COMBINATION_FUNCTION === 'true'

  const { bApp, strategies, slot } = await getData(bAppAddress)

  app.Setup(bApp, strategies, useExponentialWeight, useHarmonicCombination)
  app.StartAgreement(slot)
}

main().catch(console.error)
