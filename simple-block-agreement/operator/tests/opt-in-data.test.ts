import { generateEd25519KeyPair, generateOptInData, verifyOptInData } from '../src/data/opt-in-data'

describe('Opt-In Data Functions', () => {
  const bAppAddress = 'test_bApp_address'

  test('generateEd25519KeyPair should generate a valid key pair', () => {
    const { publicKey, privateKey } = generateEd25519KeyPair()
    expect(publicKey).toBeInstanceOf(Uint8Array)
    expect(privateKey).toBeInstanceOf(Uint8Array)
    expect(publicKey.length).toBe(32)
    expect(privateKey.length).toBe(32)
  })

  test('generateOptInData should generate valid opt-in data', () => {
    const { publicKey, privateKey } = generateEd25519KeyPair()
    const optInData = generateOptInData(publicKey, privateKey, bAppAddress)
    const optInDataString = new TextDecoder().decode(optInData)
    const parsedData = JSON.parse(optInDataString)

    expect(parsedData).toHaveProperty('pubkey')
    expect(parsedData).toHaveProperty('signature')
    expect(parsedData.pubkey).toBe(Buffer.from(publicKey).toString('hex'))
  })

  test('verifyOptInData should return the public key if the signature is valid', () => {
    const { publicKey, privateKey } = generateEd25519KeyPair()
    const optInData = generateOptInData(publicKey, privateKey, bAppAddress)
    const verifiedPublicKey = verifyOptInData(optInData, bAppAddress)

    expect(verifiedPublicKey).toEqual(publicKey)
  })

  test('verifyOptInData should return null if the signature is invalid', () => {
    const { publicKey, privateKey } = generateEd25519KeyPair()
    const optInData = generateOptInData(publicKey, privateKey, bAppAddress)

    // Reverse the signature to make it invalid
    const optInDataString = new TextDecoder().decode(optInData)
    const data = JSON.parse(optInDataString)
    const invalidSignature = data.signature.split('').reverse().join('')
    const invalidOptInData = {
      pubkey: data.pubkey,
      signature: invalidSignature,
    }

    // Verify the invalid opt-in data
    const verifiedPublicKey = verifyOptInData(new TextEncoder().encode(JSON.stringify(invalidOptInData)), bAppAddress)

    expect(verifiedPublicKey).toBeNull()
  })
})
