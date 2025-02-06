import { ParticipantState } from '../protocol'
import { Ed25519CryptoService } from '../protocol_interfaces'
import {
  mockNetwork,
  mockParticipantFetcher,
  testingKeyPair1,
  testingKeyPair,
  equalSignedVotes,
  testingSignedVote,
  testingHash1,
  testingSlot1,
  testingSlot2,
  testingHash2,
} from './testingutils/protocol' // Adjust the import path as necessary

describe('ParticipantState', () => {
  let participantState: ParticipantState
  const participantID = 1
  const privateKey = testingKeyPair1.privateKey
  let network: mockNetwork

  beforeEach(() => {
    network = new mockNetwork()
    participantState = new ParticipantState(
      participantID,
      privateKey,
      network,
      new mockParticipantFetcher(),
      new Ed25519CryptoService(),
    )
  })

  it('should handle a new block and broadcast a vote', async () => {
    await participantState.handleNewBlock(testingSlot1, testingHash1)

    // Check if the network has the expected vote
    const expectedVote = await testingSignedVote(participantID, testingSlot1, testingHash1, privateKey)
    expect(equalSignedVotes(network.messages, [expectedVote])).toBe(true)
  })

  it('should process a vote and store it', async () => {
    const otherParticipant = 2
    const signedVote = await testingSignedVote(
      otherParticipant,
      testingSlot1,
      testingHash1,
      testingKeyPair.get(otherParticipant)!.privateKey,
    )
    await participantState.processVote(signedVote)

    // Check if the network has the expected vote
    expect(participantState['votesBySlot'].get(testingSlot1)).toContain(signedVote)
  })

  it('process vote and majority not reached', async () => {
    await participantState.handleNewBlock(testingSlot1, testingHash1)

    // Check if the network received the expected vote
    const participantVote = await testingSignedVote(participantID, testingSlot1, testingHash1, privateKey)
    expect(equalSignedVotes(network.messages, [participantVote])).toBe(true)

    // Process vote from another participant
    const signedVote = await testingSignedVote(2, testingSlot1, testingHash1, testingKeyPair.get(2)!.privateKey)
    await participantState.processVote(signedVote)
    expect(participantState['votesBySlot'].get(testingSlot1)).toContain(signedVote)

    // Check that no majority is reached
    expect(participantState['lastDecidedSlot']).toBe(0)
    expect(participantState['lastDecidedHash']).toBe('')
  })

  it('process votes and majority is reached', async () => {
    await participantState.handleNewBlock(testingSlot1, testingHash1)

    // Check if the network received the expected vote
    const participantVote = await testingSignedVote(participantID, testingSlot1, testingHash1, privateKey)
    expect(equalSignedVotes(network.messages, [participantVote])).toBe(true)

    // Process its own vote
    await participantState.processVote(participantVote)
    expect(participantState['votesBySlot'].get(testingSlot1)).toContain(participantVote)

    // Process votes from other participants
    const signedVote3 = await testingSignedVote(3, testingSlot1, testingHash1, testingKeyPair.get(3)!.privateKey)
    const signedVote4 = await testingSignedVote(4, testingSlot1, testingHash1, testingKeyPair.get(4)!.privateKey)
    await participantState.processVote(signedVote3)
    await participantState.processVote(signedVote4)
    expect(participantState['votesBySlot'].get(testingSlot1)).toContain(signedVote3)
    expect(participantState['votesBySlot'].get(testingSlot1)).toContain(signedVote4)

    // Check that majority is reached
    expect(participantState.lastDecidedSlot === testingSlot1).toBe(true)
    expect(participantState.lastDecidedHash === testingHash1).toBe(true)
  })

  it('do not receive block but majority is reached', async () => {
    // Process votes from other participants
    const signedVote2 = await testingSignedVote(2, testingSlot1, testingHash1, testingKeyPair.get(2)!.privateKey)
    const signedVote4 = await testingSignedVote(4, testingSlot1, testingHash1, testingKeyPair.get(4)!.privateKey)
    await participantState.processVote(signedVote2)
    await participantState.processVote(signedVote4)
    expect(participantState['votesBySlot'].get(testingSlot1)).toContain(signedVote2)
    expect(participantState['votesBySlot'].get(testingSlot1)).toContain(signedVote4)

    // Check that majority is reached
    expect(participantState.lastDecidedSlot === testingSlot1).toBe(true)
    expect(participantState.lastDecidedHash === testingHash1).toBe(true)
  })

  it('reach majority for 2 hashes', async () => {
    // ================== Agreement on (slot1, hash1) ==================
    await participantState.handleNewBlock(testingSlot1, testingHash1)

    // Check if the network received the expected vote
    const participantVote = await testingSignedVote(participantID, testingSlot1, testingHash1, privateKey)
    expect(equalSignedVotes(network.messages, [participantVote])).toBe(true)

    // Process its own vote
    await participantState.processVote(participantVote)
    expect(participantState['votesBySlot'].get(testingSlot1)).toContain(participantVote)
    // Check that majority is not reached
    expect(participantState.lastDecidedSlot).toBe(0)

    // Process vote from participant 3
    const signedVote3 = await testingSignedVote(3, testingSlot1, testingHash1, testingKeyPair.get(3)!.privateKey)
    await participantState.processVote(signedVote3)
    expect(participantState.votesBySlot.get(testingSlot1)).toContain(signedVote3)
    // Check that majority is not reached
    expect(participantState.lastDecidedSlot).toBe(0)

    // Process vote from participant 4
    const signedVote4 = await testingSignedVote(4, testingSlot1, testingHash1, testingKeyPair.get(4)!.privateKey)
    await participantState.processVote(signedVote4)
    expect(participantState.votesBySlot.get(testingSlot1)).toContain(signedVote4)

    // Check that majority is reached
    expect(participantState.lastDecidedSlot).toBe(testingSlot1)
    expect(participantState.lastDecidedHash).toBe(testingHash1)

    // ================== Agreement on (slot2, hash2) ==================
    await participantState.handleNewBlock(testingSlot2, testingHash2)

    // Check if the network received the expected vote
    const participantVoteForHash2 = await testingSignedVote(participantID, testingSlot2, testingHash2, privateKey)
    expect(equalSignedVotes(network.messages, [participantVote, participantVoteForHash2])).toBe(true)

    // Process its own vote
    await participantState.processVote(participantVoteForHash2)
    expect(participantState['votesBySlot'].get(testingSlot2)).toContain(participantVoteForHash2)
    // Check that majority is not reached
    expect(participantState.lastDecidedSlot).toBe(testingSlot1)

    // Process vote from participant 4
    const signedVote4ForHash2 = await testingSignedVote(
      4,
      testingSlot2,
      testingHash2,
      testingKeyPair.get(4)!.privateKey,
    )
    await participantState.processVote(signedVote4ForHash2)
    expect(participantState.votesBySlot.get(testingSlot2)).toContain(signedVote4ForHash2)
    // Check that majority is not reached
    expect(participantState.lastDecidedSlot).toBe(testingSlot1)

    // Process vote from participant 5
    const signedVote5ForHash2 = await testingSignedVote(
      5,
      testingSlot2,
      testingHash2,
      testingKeyPair.get(5)!.privateKey,
    )
    await participantState.processVote(signedVote5ForHash2)
    expect(participantState.votesBySlot.get(testingSlot2)).toContain(signedVote5ForHash2)
    // Check that majority is reached
    expect(participantState.lastDecidedSlot).toBe(testingSlot2)
    expect(participantState.lastDecidedHash).toBe(testingHash2)
  })

  it('reach majority hash 1, do not receive block, but reach majority for hash 2', async () => {
    // ================== Agreement on (slot1, hash1) ==================
    await participantState.handleNewBlock(testingSlot1, testingHash1)

    // Check if the network received the expected vote
    const participantVote = await testingSignedVote(participantID, testingSlot1, testingHash1, privateKey)
    expect(equalSignedVotes(network.messages, [participantVote])).toBe(true)

    // Process its own vote
    await participantState.processVote(participantVote)
    expect(participantState['votesBySlot'].get(testingSlot1)).toContain(participantVote)
    // Check that majority is not reached
    expect(participantState.lastDecidedSlot).toBe(0)

    // Process vote from participant 3
    const signedVote3 = await testingSignedVote(3, testingSlot1, testingHash1, testingKeyPair.get(3)!.privateKey)
    await participantState.processVote(signedVote3)
    expect(participantState.votesBySlot.get(testingSlot1)).toContain(signedVote3)
    // Check that majority is not reached
    expect(participantState.lastDecidedSlot).toBe(0)

    // Process vote from participant 4
    const signedVote4 = await testingSignedVote(4, testingSlot1, testingHash1, testingKeyPair.get(4)!.privateKey)
    await participantState.processVote(signedVote4)
    expect(participantState.votesBySlot.get(testingSlot1)).toContain(signedVote4)

    // Check that majority is reached
    expect(participantState.lastDecidedSlot).toBe(testingSlot1)
    expect(participantState.lastDecidedHash).toBe(testingHash1)

    // ================== Agreement on (slot2, hash2) ==================

    // Process vote from participant 2
    const signedVote2ForHash2 = await testingSignedVote(
      2,
      testingSlot2,
      testingHash2,
      testingKeyPair.get(2)!.privateKey,
    )
    await participantState.processVote(signedVote2ForHash2)
    expect(participantState.votesBySlot.get(testingSlot2)).toContain(signedVote2ForHash2)
    // Check that majority is not reached
    expect(participantState.lastDecidedSlot).toBe(testingSlot1)

    // Process vote from participant 4
    const signedVote4ForHash2 = await testingSignedVote(
      4,
      testingSlot2,
      testingHash2,
      testingKeyPair.get(4)!.privateKey,
    )
    await participantState.processVote(signedVote4ForHash2)
    expect(participantState.votesBySlot.get(testingSlot2)).toContain(signedVote4ForHash2)
    // Check that majority is not reached
    expect(participantState.lastDecidedSlot).toBe(testingSlot1)

    // Process vote from participant 5
    const signedVote5ForHash2 = await testingSignedVote(
      5,
      testingSlot2,
      testingHash2,
      testingKeyPair.get(5)!.privateKey,
    )
    await participantState.processVote(signedVote5ForHash2)
    expect(participantState.votesBySlot.get(testingSlot2)).toContain(signedVote5ForHash2)
    // Check that majority is reached
    expect(participantState.lastDecidedSlot).toBe(testingSlot2)
    expect(participantState.lastDecidedHash).toBe(testingHash2)
  })
})
