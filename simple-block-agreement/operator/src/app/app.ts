import { AppInterface, BApp, Strategy, StrategyID } from '../types/app-interface'
import { RESET, YELLOW } from '../logging'
import { CryptoService, Ed25519CryptoService, Network, State } from './protocol'
import { ProtocolParticipant, SignedVote } from '../types/protocol-types'
import {
  arithmeticCombinationFunction,
  calculateParticipantsWeight,
  exponentialWeightFormula,
  harmonicCombinationFunction,
  polynomialWeightFormula,
} from './weight-calculator'

// App is a protocol implementation as a single process.
export class App implements AppInterface {
  // Setup configuration
  bApp: BApp
  strategies: Strategy[]

  // State per participant
  states: Map<StrategyID, State>

  // Interfaces
  private cryptoService: CryptoService
  private network: Network

  constructor() {
    this.bApp = {} as BApp
    this.strategies = []
    this.states = new Map<StrategyID, State>()

    // Set interfaces
    this.cryptoService = new Ed25519CryptoService()
    this.network = {
      broadcast: this.broadcast.bind(this), // Since it's a single process, messages are immediately delivered
    }
  }

  // Setup the app with a bApp configuration and a set of strategies that opted-in to the bApp
  public Setup(
    bApp: BApp,
    strategies: Strategy[],
    useExponentialWeight: boolean,
    useHarmonicCombinationFunction: boolean,
  ): void {
    // Store bApp and participants
    this.bApp = bApp
    this.strategies = strategies

    console.log(`🚀  ${YELLOW}Starting weight calculations for ${this.strategies.length} strategies${RESET}`)

    // Compute weight for each participant
    const weights = calculateParticipantsWeight(bApp, strategies, useExponentialWeight, useHarmonicCombinationFunction)

    // Create protocol participants
    const participants = new Map<StrategyID, ProtocolParticipant>()
    for (const strategy of strategies) {
      participants.set(strategy.id, {
        id: strategy.id,
        weight: weights.get(strategy.id)!,
        publicKey: this.cryptoService.getPublicKey(strategy.privateKey),
      })
    }

    // Create participants' state
    this.states = new Map<StrategyID, State>()
    for (const strategy of strategies) {
      this.states.set(
        strategy.id,
        new State(strategy.id, strategy.privateKey, participants, this.network, this.cryptoService),
      )
    }
  }

  // Broadcasts a vote to all participants
  public broadcast(message: SignedVote): void {
    for (const state of this.states.values()) {
      state.processVote(message)
    }
  }

  // Starts an agreement round on a slot number
  StartAgreement(slot: number): void {
    console.log(`🚀 ${YELLOW}Simulate Blockchain Agreement Process for Slot ${slot}${RESET}`)

    for (const state of this.states.values()) {
      state.handleNewBlock(slot)
    }
  }
}
