
// ======================== BApp Chain Types ========================

export type token = number;
export type amount = number;
export type percentage = number;

export type address = string;
export type strategyID = number;
export type bAppAddress = string;

// ======================== Simple Block Agreement Types ========================

// Participant
export type Participant = {
    participantID: number;
    weight: number;
    publicKey: Uint8Array;
};

// Messages
export type Vote = {
    slot: number;
    hash: string;
};
export type SignedVote = {
    participantID: number;
    signature: Uint8Array;
    vote: Vote;
};
