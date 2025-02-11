import { ed25519 } from '@noble/curves/ed25519'
import { sha512 } from '@noble/hashes/sha512'
import { Hex } from '@noble/curves/abstract/utils'
import { Vote, SignedVote } from './protocol_types'

// Network abstraction for broadcasting votes
export interface Network {
  broadcast(signedVote: SignedVote): void
}

// Cryptography Service with sign and verify functions
export interface CryptoService {
  sign(vote: Vote, privateKey: Uint8Array): Uint8Array
  verify(vote: Vote, signature: Uint8Array, publicKey: Uint8Array): boolean
  getPublicKey(privateKey: Uint8Array): Uint8Array
}

// Ed25519 Cryptography Service Implementation
export class Ed25519CryptoService implements CryptoService {
  sign(vote: Vote, privateKey: Uint8Array): Uint8Array {
    return ed25519.sign(this.computeVoteHash(vote), privateKey)
  }

  verify(vote: Vote, signature: Uint8Array, publicKey: Uint8Array): boolean {
    return ed25519.verify(signature, this.computeVoteHash(vote), publicKey)
  }

  private computeVoteHash(vote: Vote): Hex {
    return sha512(new TextEncoder().encode(JSON.stringify(vote)))
  }

  getPublicKey(privateKey: Uint8Array): Uint8Array {
    return ed25519.getPublicKey(privateKey)
  }
}
