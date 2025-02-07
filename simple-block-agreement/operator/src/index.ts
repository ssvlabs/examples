import dotenv from 'dotenv'
import { App } from './app'
import { getData } from './get-data'

dotenv.config()

// Listen for events
const main = async () => {
  const SSV_SIGNIFICANCE = 2
  const VALIDATOR_BALANCE_SIGNIFICANCE = 1
  const BAPP_ADDRESS = '0x89EF15BC1E7495e3dDdc0013C0d2B049d487b2fD'

  const app = new App()
  const { bApp, strategies, slot } = await getData(SSV_SIGNIFICANCE, VALIDATOR_BALANCE_SIGNIFICANCE, BAPP_ADDRESS)
  app.Setup(bApp, strategies)
  app.StartAgreement(slot)
}

// Start listening
main().catch(console.error)
