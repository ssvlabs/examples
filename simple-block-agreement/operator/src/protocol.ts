import { ProtocolParticipant, Vote, SignedVote, Slot } from './protocol_types'
import { CryptoService, Network } from './protocol_interfaces'
import { StrategyID } from './app_interface'
import { colorReset, getColorForStrategy, logStrategy } from './logging'

// Participant State
export class State {
  // Participant Identifier
  id: StrategyID
  privateKey: Uint8Array

  // System
  participants: Map<StrategyID, ProtocolParticipant>

  // Protocol state
  lastDecidedSlot: Slot
  votesBySlot: Map<Slot, Map<StrategyID, SignedVote>>

  // Interfaces
  network: Network
  cryptoService: CryptoService

  constructor(
    id: StrategyID,
    privateKey: Uint8Array,
    participants: Map<StrategyID, ProtocolParticipant>,
    network: Network,
    cryptoService: CryptoService,
  ) {
    this.id = id
    this.privateKey = privateKey
    this.participants = participants

    this.lastDecidedSlot = 0
    this.votesBySlot = new Map<Slot, Map<StrategyID, SignedVote>>()

    this.network = network
    this.cryptoService = cryptoService
  }

  // Handles a new Ethereum block by creating a vote and broadcasting it
  public handleNewBlock(slot: Slot): void {
    logStrategy(this.id, `📦 Handling new block with slot ${slot}.`)

    const vote: Vote = { slot }
    const signature = this.cryptoService.sign(vote, this.privateKey)

    const signedVote: SignedVote = {
      participantID: this.id,
      signature: signature,
      vote: vote,
    }

    logStrategy(this.id, `📤 Broadcasting vote`)
    this.network.broadcast(signedVote)
  }

  // Processes a vote by storing it and checking if majority is reached for slot
  public processVote(signedVote: SignedVote): void {
    // Log vote
    const color = getColorForStrategy(signedVote.participantID)
    logStrategy(
      this.id,
      `🗳️ Received vote from ${color}participant ${signedVote.participantID}${colorReset()} with slot ${
        signedVote.vote.slot
      }`,
    )

    // Store vote
    const slot = signedVote.vote.slot
    if (!this.votesBySlot.has(slot)) {
      this.votesBySlot.set(slot, new Map<StrategyID, SignedVote>())
    }
    this.votesBySlot.get(slot)!.set(signedVote.participantID, signedVote)

    // If slot is greater than last decided slot, search for majority
    if (slot > this.lastDecidedSlot) {
      if (this.hasMajority(this.votesBySlot.get(slot)!)) {
        logStrategy(this.id, `✅ Majority found for slot: ${slot}. Updating last decided slot.`)
        this.lastDecidedSlot = slot
      } else {
        logStrategy(this.id, `❌ Majority not yet reached for slot: ${slot}`)
      }
    } else {
      console.log(`⛓️ Vote is for old slot ${slot}. Current highest decided slot is ${this.lastDecidedSlot}`)
    }
  }

  // Checks if a set of votes has majority
  private hasMajority(signedVotes: Map<StrategyID, SignedVote>): boolean {
    // If no votes, return false
    if (signedVotes.size === 0) {
      return false
    }

    // Log searching for majority
    const slot = signedVotes.values().next()!.value!.vote.slot
    logStrategy(this.id, `📄 Checking majority for slot ${slot}`)

    // If votes are invalid, return false
    if (!this.areValidVotes(signedVotes)) {
      logStrategy(this.id, `❌ Invalid votes`)
      return false
    }

    // Sum the weights of the participants who voted
    let collectionWeight = 0
    let decompositionLog = ''
    for (const [participantID] of signedVotes) {
      // Add weight
      const participantWeight = this.participants.get(participantID)!.weight
      collectionWeight += participantWeight

      // Add to log
      if (decompositionLog.length > 0) {
        decompositionLog += ` + `
      }
      decompositionLog += `${(100 * participantWeight).toFixed(2)}% (from ${getColorForStrategy(
        participantID,
      )}P${participantID}${colorReset()})`
    }

    // Log the total weight and decomposition
    logStrategy(this.id, `🔢 Total weight: ${(100 * collectionWeight).toFixed(2)}%. Decomposition: ${decompositionLog}`)

    // Returns true if weight is above 66%
    return collectionWeight >= 0.66
  }

  // Checks if a set of votes are valid (participants exist, no duplicate vote, valid signature)
  private areValidVotes(signedVotes: Map<StrategyID, SignedVote>): boolean {
    for (const [participantID, signedVote] of signedVotes) {
      // If participant is not in the list, return false
      const participant = this.participants.get(participantID)
      if (!participant) {
        return false
      }

      // If signature is invalid, return false
      if (!this.cryptoService.verify(signedVote.vote, signedVote.signature, participant.publicKey)) {
        return false
      }
    }

    return true
  }
}
