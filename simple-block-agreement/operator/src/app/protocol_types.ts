import { StrategyID } from './app_interface'

// ProtocolParticipant is a strategy that opted-in to the bApp.
// Includes the participant's weight and public key.
export type ProtocolParticipant = {
  id: StrategyID
  weight: number
  publicKey: Uint8Array
}

export type Slot = number

// The vote is solely on a slot number.
export type Vote = {
  slot: Slot
}

// SignedVote represents a vote signed by a participant.
export type SignedVote = {
  participantID: StrategyID
  signature: Uint8Array
  vote: Vote
}
