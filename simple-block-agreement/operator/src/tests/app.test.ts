import { App } from '../app'
import {
  testingKeyPair1,
  testingKeyPair2,
  testingKeyPair3,
  testingKeyPair4,
  testingSlot1,
  testingSignedVote,
  equalSignedVote,
} from './testingutils/protocol'
import { Testing4Strategies, TestingBApp } from './testingutils/app'
import { SignedVote } from '../protocol_types'
import { StrategyID } from '../app_interface'

describe('App', () => {
  let app: App

  beforeEach(() => {
    app = new App()
  })

  it('should handle a new block and broadcast votes', async () => {
    app.Setup(TestingBApp, Testing4Strategies)

    // Check that majority is not reached yet
    for (const participantID of app['states'].keys()) {
      expect(app['states'].get(participantID)!.lastDecidedSlot).toBe(0)
    }

    // StartAgreement
    app.StartAgreement(testingSlot1)

    // Expected votes
    const expectedVotes: Map<StrategyID, SignedVote> = new Map([
      [1, testingSignedVote(1, testingSlot1, testingKeyPair1.privateKey)],
      [2, testingSignedVote(2, testingSlot1, testingKeyPair2.privateKey)],
      [3, testingSignedVote(3, testingSlot1, testingKeyPair3.privateKey)],
      [4, testingSignedVote(4, testingSlot1, testingKeyPair4.privateKey)],
    ])

    for (const participantID of app['states'].keys()) {
      // Check that participant received all votes
      const storedVotes = app['states'].get(participantID)!['votesBySlot'].get(testingSlot1)
      for (const [sender, signedVote] of expectedVotes) {
        expect(equalSignedVote(storedVotes!.get(sender)!, signedVote)).toBe(true)
      }

      // Check participant decided on the slot
      expect(app['states'].get(participantID)!.lastDecidedSlot).toBe(testingSlot1)
    }
  })
})
