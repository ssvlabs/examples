import { ParticipantState } from '../../protocol';
import { ParticipantFetcher, CryptoService, Network, Ed25519CryptoService } from '../../protocol_interfaces';
import { Vote, SignedVote, Participant } from '../../types';
import { ed25519} from '@noble/curves/ed25519';

export const testingHash1 = 'hash1';
export const testingHash2 = 'hash2';

export const testingSlot1 = 1;
export const testingSlot2 = 2;
function generateEd25519KeyPair(): { publicKey: Uint8Array, privateKey: Uint8Array } {
    const privateKey = ed25519.utils.randomPrivateKey();
    const publicKey = ed25519.getPublicKey(privateKey);
    return { publicKey, privateKey };
}

export const testingKeyPair1 = generateEd25519KeyPair();
export const testingKeyPair2 = generateEd25519KeyPair();
export const testingKeyPair3 = generateEd25519KeyPair();
export const testingKeyPair4 = generateEd25519KeyPair();
export const testingKeyPair5 = generateEd25519KeyPair();

export const testingKeyPair: Map<number, { publicKey: Uint8Array, privateKey: Uint8Array }> =
    new Map<number, { publicKey: Uint8Array, privateKey: Uint8Array }> ([
    [1, testingKeyPair1],
    [2, testingKeyPair2],
    [3, testingKeyPair3],
    [4, testingKeyPair4],
    [5, testingKeyPair5]
]);


export const testing4Participants: Map<number, Participant> = new Map<number, Participant>([
    [1, { participantID: 1, weight: 0.2, publicKey: testingKeyPair1.publicKey }],
    [2, { participantID: 2, weight: 0.3, publicKey: testingKeyPair2.publicKey }],
    [3, { participantID: 3, weight: 0.1, publicKey: testingKeyPair3.publicKey }],
    [4, { participantID: 4, weight: 0.4, publicKey: testingKeyPair4.publicKey }]
]);

export const testing5Participants: Map<number, Participant> = new Map<number, Participant>([
    [1, { participantID: 1, weight: 0.1, publicKey: testingKeyPair1.publicKey }],
    [2, { participantID: 2, weight: 0.2, publicKey: testingKeyPair2.publicKey }],
    [3, { participantID: 3, weight: 0.1, publicKey: testingKeyPair3.publicKey }],
    [4, { participantID: 4, weight: 0.3, publicKey: testingKeyPair4.publicKey }],
    [5, { participantID: 5, weight: 0.3, publicKey: testingKeyPair5.publicKey }]
]);

export class mockParticipantFetcher implements ParticipantFetcher {
    fetchParticipants(hash: string): Promise<Map<number, Participant>> {
        if (hash === testingHash1) {
            return Promise.resolve(testing4Participants);
        }
        if (hash === testingHash2) {
            return Promise.resolve(testing5Participants);
        }
        return Promise.resolve(new Map<number, Participant>());
    }
}

export class mockNetwork implements Network {
    public messages = new Array<SignedVote>();
    async broadcast(message: SignedVote): Promise<void> {
        this.messages.push(message);
    }
}

export function equalSignedVote(a: SignedVote, b: SignedVote): boolean {
    return a.participantID === b.participantID &&
        isEqualUint8Array(a.signature, b.signature) &&
        a.vote.slot === b.vote.slot &&
        a.vote.hash === b.vote.hash;
}

function isEqualUint8Array(arr1: Uint8Array, arr2: Uint8Array): boolean {
    if (arr1.length !== arr2.length) {
        return false
    }

    return arr1.every((value, index) => value === arr2[index])
}

export function equalSignedVotes(a: SignedVote[], b: SignedVote[]): boolean {
    if (a.length !== b.length) {
        return false;
    }
    for (let i = 0; i < a.length; i++) {
        if (!equalSignedVote(a[i], b[i])) {
            return false;
        }
    }
    return true;
}

export async function testingSignedVote(participantID: number, slot: number, hash: string, privKey: Uint8Array): Promise<SignedVote> {
    const vote: Vote = { slot, hash };
    let cryptoService = new Ed25519CryptoService();
    const signature = await cryptoService.signAsync(vote, privKey);
    return { participantID, signature, vote };
}
