import { ed25519 } from '@noble/curves/ed25519'
import { sha512 } from '@noble/hashes/sha512'

// Generate a new Ed25519 key pair
export function generateEd25519KeyPair(): { publicKey: Uint8Array; privateKey: Uint8Array } {
  const privateKey = ed25519.utils.randomPrivateKey()
  const publicKey = ed25519.getPublicKey(privateKey)
  return { publicKey, privateKey }
}

// Generate opt-in data for a strategy
export function generateOptInData(publicKey: Uint8Array, privateKey: Uint8Array, bAppAddress: string): Uint8Array {
  const messageHash = sha512(new TextEncoder().encode(bAppAddress))
  const signature = ed25519.sign(messageHash, privateKey)

  const optInData = {
    pubkey: Buffer.from(publicKey).toString('hex'),
    signature: Buffer.from(signature).toString('hex')
  }

  return new TextEncoder().encode(JSON.stringify(optInData))
}

// Decode and verify opt-in data, returning the public key if valid
export function verifyOptInData(optInData: Uint8Array, bAppAddress: string): Uint8Array | null {
    const optInDataString = new TextDecoder().decode(optInData)
    const data = JSON.parse(optInDataString)
    const publicKey = Uint8Array.from(Buffer.from(data.pubkey, 'hex'))
    const signature = Uint8Array.from(Buffer.from(data.signature, 'hex'))
    const messageHash = sha512(new TextEncoder().encode(bAppAddress))

    const isValid = ed25519.verify(signature, messageHash, publicKey)

    if (!isValid) {
      return null
    }

    return publicKey
}