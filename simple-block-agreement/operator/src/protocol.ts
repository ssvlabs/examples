import { Participant, Vote, SignedVote } from './types';
import { ParticipantFetcher, CryptoService, Network } from './protocol_interfaces';

// Participant State
export class ParticipantState {
    // Identifier
    participantID: number;
    privateKey: Uint8Array;

    // Protocol state
    lastDecidedSlot: number;
    lastDecidedHash: string;
    votesBySlot: Map<number, SignedVote[]>;

    // Interfaces
    network: Network;
    participantFetcher: ParticipantFetcher;
    cryptoService: CryptoService;

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

    // Logger function with colored Participant ID
    private log(message: string): void {
        const color = this.getColorForID(this.participantID);
        console.log(`${color}[Participant ${this.participantID}] ${this.colorReset()} ${message}`);
    }

    // Function to get color based on participant ID
    private getColorForID(id: number): string {
        const colors = ['\x1b[31m', '\x1b[32m', '\x1b[33m', '\x1b[34m', '\x1b[35m', '\x1b[36m', ];
        return colors[id % colors.length];
    }

    private colorReset(): string {
        return '\x1b[0m'
      }

    // Handles a new Ethereum block by creating a vote and broadcasting it
    public async handleNewBlock(slot: number, hash: string): Promise<void> {
        this.log(`📦 Handling new block with slot ${slot} and hash ${hash}.`);

        var vote: Vote = { slot, hash };
        var signature = await this.cryptoService.signAsync(vote, this.privateKey);

        var signedVote: SignedVote = {
            participantID: this.participantID,
            signature: signature,
            vote: vote
        };

        this.log(`📤 Broadcasting vote`);
        await this.network.broadcast(signedVote);
    }

    // Processes a vote by storing it and checking if majority is reached for slot
    public async processVote(signedVote: SignedVote): Promise<void> {
        const color = this.getColorForID(signedVote.participantID);
        this.log(`🗳️ Received vote from ${color}participant ${signedVote.participantID}${this.colorReset()} with slot ${signedVote.vote.slot} and hash ${signedVote.vote.hash}`);

        // Store vote
        const slot = signedVote.vote.slot;
        if (!this.votesBySlot.has(slot)) {
            this.votesBySlot.set(slot, []);
        }
        this.votesBySlot.get(slot)!.push(signedVote);

        // If slot is greater than last decided slot, search for majority
        if (this.lastDecidedSlot < slot) {
            await this.searchForMajority(slot);
        }
    }

    // Searches for a hash with vote majority in a slot
    private async searchForMajority(slot: number): Promise<void> {
        this.log(`🔍📊 Searching for majority in slot: ${slot}`);

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
                this.log(`✅ Majority found for slot: ${slot}, hash: ${hash}`);
                if (slot > this.lastDecidedSlot) {
                    this.log(`🔒 Updating last decided slot with ${slot} and hash ${hash}`);
                    this.lastDecidedSlot = slot;
                    this.lastDecidedHash = hash;
                } else {
                    this.log(`⛓️ Majority found for already decided slot ${slot}. Current highest decided slot: ${this.lastDecidedSlot}`);
                }
                return;
            } else {
                this.log(`❌ Majority not found for slot: ${slot}, hash: ${hash}`);
            }
        }
    }

    // Checks if a set of votes has majority
    private async hasMajority(signedVotes: SignedVote[]): Promise<boolean> {

        var blockHash = signedVotes[0]?.vote.hash;

        this.log(`📄 Checking slot ${signedVotes[0]?.vote.slot} with votes on hash ${blockHash}`);

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
                const participantWeight = participants.get(signedVote.participantID)!.weight;
                this.log(`... adding participant ${signedVote.participantID} with weight ${participantWeight}`);
                collectionWeight += participantWeight
            }
        }

        this.log(`🔢 Total weight: ${collectionWeight}`);

        // Returns true if weight is above 66%
        return collectionWeight >= 0.66;
    }

    // Checks if a set of votes are valid (participants exist, no duplicate vote, valid signature)
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