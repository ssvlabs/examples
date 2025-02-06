import { ethers } from 'ethers'
import dotenv from 'dotenv'

dotenv.config()

// Load environment variables
const ALCHEMY_RPC_URL = process.env.ALCHEMY_RPC_URL || ''
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS || ''
const EVENT_NAME = process.env.EVENT_NAME || ''

// ABI: Minimal ABI required to listen for events (Replace with your contract's ABI)
const CONTRACT_ABI = ['event StrategyCreated(uint256 indexed strategyId, address indexed owner, uint32 fee)']

// Setup Provider
const provider = new ethers.JsonRpcProvider(ALCHEMY_RPC_URL)

// Setup Contract
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider)

// Listen for events
const listenForEvents = async () => {
  console.log(provider)
  console.log(JSON.stringify(contract))
  console.log(`🔍 Listening for ${EVENT_NAME} events on ${CONTRACT_ADDRESS}...`)

  contract.on(EVENT_NAME, (from, to, value, event) => {
    console.log('reading event')
    console.log(`📢 Event received: ${EVENT_NAME}`)
    console.log(`From: ${from}`)
    console.log(`To: ${to}`)
    console.log(`Value: ${value.toString()}`)
    console.log(`Transaction Hash: ${event.transactionHash}`)
  })
}

// Start listening
listenForEvents().catch(console.error)
