import { AppInterface, BApp, Strategy, StrategyID } from './app_interface'
import { State } from './protocol'
import { Network, CryptoService, Ed25519CryptoService } from './protocol_interfaces'
import { ProtocolParticipant, SignedVote } from './protocol_types'
import { HarmonicWeightCalculator } from './weight_calculator'

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
  public Setup(bApp: BApp, strategies: Strategy[]): void {
    // Store bApp and participants
    this.bApp = bApp
    this.strategies = strategies

    // Compute weight for each participant
    const calculator = new HarmonicWeightCalculator()
    const weights = calculator.calculateParticipantsWeight(bApp, strategies)

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
    for (const state of this.states.values()) {
      state.handleNewBlock(slot)
    }
  }
}
