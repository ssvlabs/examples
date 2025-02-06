import { SingleProcessImplementation } from '../single_process_implementation';
import { mockParticipantFetcher, testingKeyPair1, testingKeyPair2, testingKeyPair3, testingKeyPair4, testingKeyPair5, testingHash1, testingHash2, testingSlot1, testingSlot2, testingSignedVote, equalSignedVotes } from './testingutils/protocol';
import { Ed25519CryptoService } from '../protocol_interfaces';

describe('Single Process Implementation', () => {
    var singleProcess: SingleProcessImplementation;

    beforeEach(() => {
        singleProcess = new SingleProcessImplementation(new mockParticipantFetcher(), new Ed25519CryptoService());
        singleProcess.registerParticipant(1, testingKeyPair1.privateKey);
        singleProcess.registerParticipant(2, testingKeyPair2.privateKey);
        singleProcess.registerParticipant(3, testingKeyPair3.privateKey);
        singleProcess.registerParticipant(4, testingKeyPair4.privateKey);
    });

    it('should handle a new block and broadcast votes', async () => {
        // Handle new block
        await singleProcess.handleNewBlock(testingSlot1, testingHash1);

        // Expected votes
        const expectedVotes = await Promise.all([
            testingSignedVote(1, testingSlot1, testingHash1, testingKeyPair1.privateKey),
            testingSignedVote(2, testingSlot1, testingHash1, testingKeyPair2.privateKey),
            testingSignedVote(3, testingSlot1, testingHash1, testingKeyPair3.privateKey),
            testingSignedVote(4, testingSlot1, testingHash1, testingKeyPair4.privateKey),
        ]);

        // Check if participants received votes
        for (const participantID of singleProcess['states'].keys()) {
            expect(singleProcess['states'].get(participantID)!['votesBySlot'].get(testingSlot1)).toEqual(expect.arrayContaining(expectedVotes));
        }
    });

    it('should reach majority for a block', async () => {

        // Check no agreement has been reached yet
        for (const participantID of singleProcess['states'].keys()) {
            expect(singleProcess['states'].get(participantID)!.lastDecidedSlot).toBe(0);
            expect(singleProcess['states'].get(participantID)!.lastDecidedHash).toBe("");
        }

        // Handle new block
        await singleProcess.handleNewBlock(testingSlot1, testingHash1);

        // Expected votes
        const expectedVotes = await Promise.all([
            testingSignedVote(1, testingSlot1, testingHash1, testingKeyPair1.privateKey),
            testingSignedVote(2, testingSlot1, testingHash1, testingKeyPair2.privateKey),
            testingSignedVote(3, testingSlot1, testingHash1, testingKeyPair3.privateKey),
            testingSignedVote(4, testingSlot1, testingHash1, testingKeyPair4.privateKey),
        ]);

        // Check if participants received votes and reached majority
        for (const participantID of singleProcess['states'].keys()) {
            expect(singleProcess['states'].get(participantID)!['votesBySlot'].get(testingSlot1)).toEqual(expect.arrayContaining(expectedVotes));
            expect(singleProcess['states'].get(participantID)!.lastDecidedSlot).toBe(testingSlot1);
            expect(singleProcess['states'].get(participantID)!.lastDecidedHash).toBe(testingHash1);
        }
    });

    it('should reach majority on slot 1, add new participant, and reach for slot 2', async () => {

        // ================== Agree on slot 1 ==================
        await singleProcess.handleNewBlock(testingSlot1, testingHash1);

        const expectedVotesSlot1 = await Promise.all([
            testingSignedVote(1, testingSlot1, testingHash1, testingKeyPair1.privateKey),
            testingSignedVote(2, testingSlot1, testingHash1, testingKeyPair2.privateKey),
            testingSignedVote(3, testingSlot1, testingHash1, testingKeyPair3.privateKey),
            testingSignedVote(4, testingSlot1, testingHash1, testingKeyPair4.privateKey),
        ]);

        for (const participantID of singleProcess['states'].keys()) {
            expect(singleProcess['states'].get(participantID)!['votesBySlot'].get(testingSlot1)).toEqual(expect.arrayContaining(expectedVotesSlot1));
            expect(singleProcess['states'].get(participantID)!.lastDecidedSlot).toBe(testingSlot1);
            expect(singleProcess['states'].get(participantID)!.lastDecidedHash).toBe(testingHash1);
        }


        // ================== Register new participant and agree on slot 2 ==================
        singleProcess.registerParticipant(5, testingKeyPair5.privateKey);

        await singleProcess.handleNewBlock(testingSlot2, testingHash2);

        const expectedVotesSlot2 = await Promise.all([
            testingSignedVote(1, testingSlot2, testingHash2, testingKeyPair1.privateKey),
            testingSignedVote(2, testingSlot2, testingHash2, testingKeyPair2.privateKey),
            testingSignedVote(3, testingSlot2, testingHash2, testingKeyPair3.privateKey),
            testingSignedVote(4, testingSlot2, testingHash2, testingKeyPair4.privateKey),
            testingSignedVote(5, testingSlot2, testingHash2, testingKeyPair5.privateKey)
        ]);

        for (const participantID of singleProcess['states'].keys()) {
            expect(singleProcess['states'].get(participantID)!['votesBySlot'].get(testingSlot2)).toEqual(expect.arrayContaining(expectedVotesSlot2));
            expect(singleProcess['states'].get(participantID)!.lastDecidedSlot).toBe(testingSlot2);
            expect(singleProcess['states'].get(participantID)!.lastDecidedHash).toBe(testingHash2);
        }
    });
});
