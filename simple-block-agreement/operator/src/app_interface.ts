/*
1. M: ✅ creates a key generator (ed25519 key) and a opt-in data field generator
2. R: ✅ creates the bApp, 2 strategies, deposits, delegations, and opt-in (using the key generator)
3. M: ✅ implements AppInterface
4. R: execute the AppInterface
5. R: provides latest slot using public API.
*/

/* KEYS GENERATED */

// DISCLAIMER: The keys below are randomly generated and are used solely for testing purposes.

// {
//   "id": 1,
//   "publicKey": "dc47786918f4462de09fe6d02537f216e80c9844dfd2eff66a15b89cf73c6ce7",
//   "privateKey": "63920609bb76b09d816b9427e906d1ad7d3008b4f8a164adf3b4900969ac97fa"
// }
// {
//   "id": 2,
//   "publicKey": "02e86e4e71811735582785d4d161a2a0e85c77d40e9b200b63d940b7e9f78e6e",
//   "privateKey": "228ffcb12deb17c72d7348415909290db647153c6b255c0b76628496d136b875"
// }

// bApp: 0x89EF15BC1E7495e3dDdc0013C0d2B049d487b2fD
// registering bApp: https://holesky.etherscan.io/tx/0xff9e46c17ed75a9228113fd25f56f3b26e988cb983edfedbf25d47428d7d06be
// metadata URL: https://github.com/ssvlabs/examples/tree/main/simple-block-agreement/based-application/metadata.json
// owner: 0x219437D13532d225D98bACe5638EB9146D4BDD4B
// bApp token [SSV Devnet (0x68A8DDD7a59A900E0657e9f8bbE02B70c947f25F)]

// STRATEGY 12
// create strategy: https://holesky.etherscan.io/tx/0xe062c0b5a2b212caeab8ae4cccb583b6eaa37e74f487ebf18e5ab89b6f89b5cc
// owner: 0x219437D13532d225D98bACe5638EB9146D4BDD4B
// owner delegates 100% balance to himself: https://holesky.etherscan.io/tx/0x0195d00a55ee44fa06c4e15d56cf558a46cf205d8fa7e4e4e170ea6e17513189
// another account (0xE014ad0eecd8053282eA37704F296Ae1F25bA12F) delegates to this owner 60%: https://holesky.etherscan.io/tx/0x62c9105228d7abe8dff8c3df05fa4d1eaea4fc3cdc0c0a51c910a291bdc2fd1f
// opt in to bApp w/ SSV token and data 0xdc47786918f4462de09fe6d02537f216e80c9844dfd2eff66a15b89cf73c6ce7: https://holesky.etherscan.io/tx/0xcfc79574d195ce9acafab2f7f22b5b56e92110f6aea8a41188ae8ece380f6d9a
// strategy token [SSV Devnet (0x68A8DDD7a59A900E0657e9f8bbE02B70c947f25F)]
// approve Main contract to move SSV tokens: https://holesky.etherscan.io/tx/0x7c943d1452b42e079640f39bd33cdd8d03332ccc2227b5bc35c405d745e926c2
// deposit owner 20 SSV: https://holesky.etherscan.io/tx/0xb4e209615fc72c08b18d3676f87f9df32c13c432289a03d33130ded520e6feca

// STRATEGY 13
// create strategy: https://holesky.etherscan.io/tx/0xc074872cd01c934b6cffca960ead46d8e772a37c9e06f4ad66ace62cc1377406
// owner: 0x8F3A66Bb003EBBD5fB115981DfaD8D8400FCeb76
// owner delegates 100% balance to himself: https://holesky.etherscan.io/tx/0x71e169eedbf178c9c24c2f8ef50040af3d0bd853fc2cba90af585892e62eb1c7
// opt in to bApp w/ SSV token and data 0x02e86e4e71811735582785d4d161a2a0e85c77d40e9b200b63d940b7e9f78e6e: https://holesky.etherscan.io/tx/0x9917d7d0cf4fac3730b2aac12bfa233818e76612d307147314a901554e7e22b2
// strategy token [SSV Devnet (0x68A8DDD7a59A900E0657e9f8bbE02B70c947f25F)]
// approve Main Contract to move SSV tokens: https://holesky.etherscan.io/tx/0x90319748259140ee2fff0b4bcbb4125932c2219596f0fbc679fe4295fb27c38d
// deposit owner 10 SSV: https://holesky.etherscan.io/tx/0x758d761e4b51b55b4ad1ab39d11dc48e35d3fbcde5b8345f77e7c7c849516f69

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
  Setup(bApp: BApp, strategies: Strategy[]): void

  // Starts an agreement round on a slot number
  StartAgreement(slot: number): void
}
