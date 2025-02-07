
/*
0.1 M: ✅ creates a key generator (ed25519 key) and a opt-in data field generator
1. R: creates the bApp, 2 strategies, deposits, delegations, and opt-in (using the key generator)
2. M: ✅ implements AppInterface
3. R: execute the AppInterface
4. R: provides latest slot using public API.
*/

export type StrategyID = number // Represents an identifier of a strategy
export type Token = string // Represents a token address
export type Amount = number // Represents an amount of a token
export type Percentage = number // Represents a percentage value

// StrategyToken represents how a token is being used by a strategy for the bApp.
// Includes:
// - the token identifier
// - the amount of the token held by the strategy
// - the obligation percentage dedicated to the bApp
// - the risk level of the token
export type StrategyToken = {
    token: Token
    amount: Amount
    obligationPercentage: Percentage
    risk: number
}

// BAppToken represents the usage of a token by a bApp with
// a shared risk level (beta) and significance (weight in the combination funtion)
export type BAppToken = {
    token: Token
    sharedRiskLevel: number
    significance: number
}

// Strategy represents a strategy of the bApp platform that opted-in to the bApp.
// Includes:
// - the strategy identifier
// - the owner account of the strategy
// - the private key of the strategy
// - a token configuration for each token used for the bApp
// - the validator balance of the owner account
export type Strategy = {
    id: StrategyID
    owner: string
    privateKey: Uint8Array
    token: StrategyToken[]
    validatorBalance: number // ETH
}

// BApp represents the configuration of a bApp, including
// - its address (identifier)
// - the configuration for each token used
// - the significance of the validator balance capital in the combination function
export type BApp = {
    address: string
    token: BAppToken[]
    validatorBalanceSignificance: number
}

export interface AppInterface {
    // Setup the app with a bApp configuration and a set of strategies that opted-in to the bApp
    Setup(
        bApp: BApp,
        strategies: Strategy[],
    ): void

    // Starts an agreement round on a slot number
    StartAgreement(slot: number): void
}