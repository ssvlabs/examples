import { StrategyID } from '../../src/types/app-interface'
import { generateEd25519KeyPair } from '../../src/data/opt-in-data'
import { Vote, SignedVote, ProtocolParticipant, Slot } from '../../src/types/protocol-types'
import { Ed25519CryptoService, Network } from '../../src/app/protocol'

// Slot
export const testingSlot1 = 1
export const testingSlot2 = 2

// Key Pairs
export const testingKeyPair1 = generateEd25519KeyPair()
export const testingKeyPair2 = generateEd25519KeyPair()
export const testingKeyPair3 = generateEd25519KeyPair()
export const testingKeyPair4 = generateEd25519KeyPair()
export const testingKeyPair5 = generateEd25519KeyPair()

// Participants
export const testing4Participants: Map<StrategyID, ProtocolParticipant> = new Map<StrategyID, ProtocolParticipant>([
  [1, { id: 1, weight: 0.2, publicKey: testingKeyPair1.publicKey }],
  [2, { id: 2, weight: 0.3, publicKey: testingKeyPair2.publicKey }],
  [3, { id: 3, weight: 0.1, publicKey: testingKeyPair3.publicKey }],
  [4, { id: 4, weight: 0.4, publicKey: testingKeyPair4.publicKey }],
])

export const testing5Participants: Map<StrategyID, ProtocolParticipant> = new Map<StrategyID, ProtocolParticipant>([
  [1, { id: 1, weight: 0.1, publicKey: testingKeyPair1.publicKey }],
  [2, { id: 2, weight: 0.2, publicKey: testingKeyPair2.publicKey }],
  [3, { id: 3, weight: 0.1, publicKey: testingKeyPair3.publicKey }],
  [4, { id: 4, weight: 0.3, publicKey: testingKeyPair4.publicKey }],
  [5, { id: 5, weight: 0.3, publicKey: testingKeyPair5.publicKey }],
])

// SignedVote
export function testingSignedVote(participantID: StrategyID, slot: Slot, privKey: Uint8Array): SignedVote {
  const vote: Vote = { slot }
  const cryptoService = new Ed25519CryptoService()
  const signature = cryptoService.sign(vote, privKey)
  return { participantID, signature, vote }
}

// ================== Mock Network ==================

export class mockNetwork implements Network {
  public messages = new Array<SignedVote>()
  broadcast(message: SignedVote): void {
    this.messages.push(message)
  }
}

export function equalSignedVote(a: SignedVote, b: SignedVote): boolean {
  return (
    a.participantID === b.participantID && isEqualUint8Array(a.signature, b.signature) && a.vote.slot === b.vote.slot
  )
}

function isEqualUint8Array(arr1: Uint8Array, arr2: Uint8Array): boolean {
  if (arr1.length !== arr2.length) {
    return false
  }
  return arr1.every((value, index) => value === arr2[index])
}

export function equalSignedVotes(a: SignedVote[], b: SignedVote[]): boolean {
  if (a.length !== b.length) {
    return false
  }
  for (let i = 0; i < a.length; i++) {
    if (!equalSignedVote(a[i], b[i])) {
      return false
    }
  }
  return true
}
