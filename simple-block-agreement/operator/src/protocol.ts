import { ed25519} from '@noble/curves/ed25519';
import { sha512 } from "@noble/hashes/sha512";

import { Participant, Vote, SignedVote } from './types';
import { ParticipantFetcher, CryptoService, Network } from './protocol_interfaces';

// Participant State
export class ParticipantState {
    // Identifier
    private participantID: number;
    private privateKey: Uint8Array;

    // Protocol state
    private lastDecidedSlot: number;
    private lastDecidedHash: string;
    private votesBySlot: Map<number, SignedVote[]>;

    // Interfaces
    private network: Network;
    private participantFetcher: ParticipantFetcher;
    private cryptoService: CryptoService;

    constructor(participantID: number,
        privateKey: Uint8Array,
        network: Network,
        participantFetcher: ParticipantFetcher,
        cryptoService: CryptoService) {

        this.participantID = participantID;
        this.privateKey = privateKey;

        this.lastDecidedSlot = 0;
        this.lastDecidedHash = "";
        this.votesBySlot = new Map<number, SignedVote[]>();

        this.network = network;
        this.participantFetcher = participantFetcher;
        this.cryptoService = cryptoService;
    }

    // Handles a new Ethereum block by creating a vote and broadcasting it
    public async handleNewBlock(slot: number, hash: string): Promise<void> {
        var vote: Vote = { slot, hash };
        var signature = await this.cryptoService.signAsync(vote, this.privateKey);

        var signedVote: SignedVote = {
            participantID: this.participantID,
            signature: signature,
            vote: vote
        };

        await this.network.broadcast(signedVote);
    }

    // Processes a vote by storing it and checking if majority is reached for slot
    public async processVote(signedVote: SignedVote): Promise<void> {

        // Store vote
        const slot = signedVote.vote.slot
        if (!this.votesBySlot.has(slot)) {
            this.votesBySlot.set(slot, []);
        }
        this.votesBySlot.get(slot)!.push(signedVote);

        // If slot is greater than last decided slot, search for majority
        if (this.lastDecidedSlot < slot) {
            this.searchForMajority(slot);
        }
    }

    // Searches for a hash with vote majority in a slot
    private async searchForMajority(slot: number): Promise<void> {

        // Organize votes by hash
        const signedVotes = this.votesBySlot.get(slot) || [];
        const hashVoteMap = new Map<string, SignedVote[]>();
        for (const signedVote of signedVotes) {
            if (!hashVoteMap.has(signedVote.vote.hash)) {
                hashVoteMap.set(signedVote.vote.hash, []);
            }
            hashVoteMap.get(signedVote.vote.hash)!.push(signedVote);
        }

        // For each hash, check if votes for it have majority
        for (const [hash, votesForHash] of hashVoteMap.entries()) {
            if (await this.hasMajority(votesForHash)) {
                if (slot > this.lastDecidedSlot) {
                    this.lastDecidedSlot = slot;
                    this.lastDecidedHash = hash;
                }
                return;
            }
        }
    }

    // Checks if a set of votes has majority
    private async hasMajority(signedVotes: SignedVote[]): Promise<boolean> {

        var blockHash = signedVotes[0]?.vote.hash;

        // Fetch participants
        var participants = await this.participantFetcher.fetchParticipants(blockHash);

        // If participants list is empty, return false
        if (participants.size === 0) return false;

        // If votes are invalid, return false
        if (!this.areValidVotes(signedVotes, participants)) return false;

        // Sum the weights of the participants who voted
        let collectionWeight = 0;
        for (const signedVote of signedVotes) {
            if (participants.has(signedVote.participantID)) {
                collectionWeight += participants.get(signedVote.participantID)!.weight;
            }
        }

        // Returns true if weight is above 66%
        return collectionWeight >= 66;
    }

    // Checks if a set of votes are valid (participants exist, no duplciate vote, valid signature)
    private async areValidVotes(signedVotes: SignedVote[], participants: Map<number, Participant>): Promise<boolean> {
        const seenParticipants = new Set<number>();

        for (const signedVote of signedVotes) {
            const participant = participants.get(signedVote.participantID);
            // If participant is not in the list, return false
            if (!participant) {
                return false;
            }

            // If participant appears twice, return false
            if (seenParticipants.has(signedVote.participantID)) {
                return false;
            }
            seenParticipants.add(signedVote.participantID);

            // If signature is invalid, return false
            if (!await this.cryptoService.verifyAsync(signedVote.vote, signedVote.signature, participant.publicKey)) {
                return false;
            }
        }

        return true;
    }
}