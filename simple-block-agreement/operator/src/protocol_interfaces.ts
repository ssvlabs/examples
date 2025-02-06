import { ed25519 } from '@noble/curves/ed25519'
import { sha512 } from '@noble/hashes/sha512'
import { Hex } from '@noble/curves/abstract/utils'
import { Participant, Vote, SignedVote } from './types'

// Fetches participants considering a given block hash as the blockchain head
export interface ParticipantFetcher {
  fetchParticipants(hash: string): Promise<Map<number, Participant>>
}

// Cryptography Service with sign and verify functions
export interface CryptoService {
  signAsync(vote: Vote, privateKey: Uint8Array): Promise<Uint8Array>
  verifyAsync(vote: Vote, signature: Uint8Array, publicKey: Uint8Array): Promise<boolean>
}

// Network abstraction for broadcasting votes
export interface Network {
  broadcast(signedVote: SignedVote): Promise<void>
}

// Ed25519 Cryptography Service Implementation
export class Ed25519CryptoService implements CryptoService {
  async signAsync(vote: Vote, privateKey: Uint8Array): Promise<Uint8Array> {
    return ed25519.sign(this.computeVoteHash(vote), privateKey)
  }

  async verifyAsync(vote: Vote, signature: Uint8Array, publicKey: Uint8Array): Promise<boolean> {
    return ed25519.verify(signature, this.computeVoteHash(vote), publicKey)
  }

  private computeVoteHash(vote: Vote): Hex {
    return sha512(new TextEncoder().encode(JSON.stringify(vote)))
  }
}
