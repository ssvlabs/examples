import { ParticipantState } from "./protocol";
import { ParticipantFetcher, Network, CryptoService } from './protocol_interfaces';
import { Participant, SignedVote } from './types';

export class SingleProcessImplementation {
    // Participants
    private privateKeys: Map<number, Uint8Array>;
    private states: Map<number, ParticipantState>;

    // Interfaces
    private participantFetcher: ParticipantFetcher;
    private cryptoService: CryptoService;
    private network: Network;

    constructor(participantFetcher: ParticipantFetcher, cryptoService: CryptoService) {
        // Initialize participants
        this.privateKeys = new Map<number, Uint8Array>();
        this.states = new Map<number, ParticipantState>();

        // Set interfaces
        this.participantFetcher = participantFetcher;
        this.cryptoService = cryptoService;
        this.network = {
            broadcast: this.broadcast.bind(this)
        };
    }

    // Registers a participant given its ID and private key
    public registerParticipant(participantID: number, privateKey: Uint8Array): void {
        this.privateKeys.set(participantID, privateKey);
        this.states.set(participantID, new ParticipantState(participantID, privateKey, this.network, this.participantFetcher, this.cryptoService));
    }

    // Broadcasts a vote to all participants
    public async broadcast(message: SignedVote): Promise<void> {
        for (const state of this.states.values()) {
            await state.processVote(message);
        }
    }

    // Handles a new block by notifying all participants
    public async handleNewBlock(slot: number, hash: string): Promise<void> {
        for (const state of this.states.values()) {
            await state.handleNewBlock(slot, hash);
        }
    }
}