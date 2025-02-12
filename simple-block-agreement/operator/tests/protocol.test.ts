import { State } from '../src/app/protocol'
import { Ed25519CryptoService } from '../src/app/protocol_interfaces'
import { SignedVote } from '../src/app/protocol_types'
import {
  mockNetwork,
  testingKeyPair1,
  equalSignedVotes,
  testingSignedVote,
  testingSlot1,
  testing4Participants,
  equalSignedVote,
  testingKeyPair2,
  testingKeyPair3,
  testingKeyPair4,
} from './testingutils/protocol' // Adjust the import path as necessary

describe('ParticipantState', () => {
  let participantState: State
  const participantID = 1
  const privateKey = testingKeyPair1.privateKey
  let network: mockNetwork

  beforeEach(() => {
    network = new mockNetwork()
    participantState = new State(participantID, privateKey, testing4Participants, network, new Ed25519CryptoService())
  })

  it('handle block, broadcast a vote', () => {
    participantState.handleNewBlock(testingSlot1)

    // Check if the network has the expected vote
    const expectedVote = testingSignedVote(participantID, testingSlot1, privateKey)
    expect(equalSignedVotes(network.messages, [expectedVote])).toBe(true)
  })

  it('process vote', () => {
    const signedVote = testingSignedVote(2, testingSlot1, testingKeyPair2.privateKey)
    participantState.processVote(signedVote)

    // Check if the network has the expected vote
    expect(equalSignedVote(participantState.votesBySlot.get(testingSlot1)!.get(2)!, signedVote)).toBe(true)
  })

  it('handle block, process vote, majority not reached', () => {
    participantState.handleNewBlock(testingSlot1)

    // Check if the network received the expected vote
    const participantVote = testingSignedVote(participantID, testingSlot1, privateKey)
    expect(equalSignedVotes(network.messages, [participantVote])).toBe(true)

    // Process vote from another participant
    const signedVote = testingSignedVote(2, testingSlot1, testingKeyPair2.privateKey)
    participantState.processVote(signedVote)
    expect(equalSignedVote(participantState.votesBySlot.get(testingSlot1)!.get(2)!, signedVote)).toBe(true)

    // Check that no majority is reached
    expect(participantState['lastDecidedSlot']).toBe(0)
  })

  it('handle block, process vote, majority reached', () => {
    participantState.handleNewBlock(testingSlot1)

    // Check that majority is not yet reached
    expect(participantState.lastDecidedSlot).toBe(0)

    // Process votes
    const votes: SignedVote[] = [
      testingSignedVote(participantID, testingSlot1, privateKey),
      testingSignedVote(3, testingSlot1, testingKeyPair3.privateKey),
      testingSignedVote(4, testingSlot1, testingKeyPair4.privateKey),
    ]
    for (const vote of votes) {
      participantState.processVote(vote)
    }

    // Check that majority is reached
    expect(participantState.lastDecidedSlot).toBe(testingSlot1)
  })

  it('do not receive block but majority is reached', () => {
    // Check that majority is not yet reached
    expect(participantState.lastDecidedSlot).toBe(0)

    // Process votes
    const votes: SignedVote[] = [
      testingSignedVote(2, testingSlot1, testingKeyPair2.privateKey),
      testingSignedVote(4, testingSlot1, testingKeyPair4.privateKey),
    ]
    for (const vote of votes) {
      participantState.processVote(vote)
    }

    // Check that majority is reached
    expect(participantState.lastDecidedSlot).toBe(testingSlot1)
  })
})
