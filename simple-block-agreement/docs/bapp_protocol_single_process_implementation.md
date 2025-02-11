# bApp Protocol - Single Process Implementation

This document outlines an implementation for the bApp protocol.

For simplicity, the whole bApp system is mocked in a single process.

The implementation for the app can be found in [app.ts](./../operator/src/app.ts).

## Implementation

Each participant should have a state with the message processing functions as described in the [protocol](./bapp_protocol.md).

The broadcasting of messages can be done through a channel that triggers all participants' states to process it immediately.

1. **Input Data**: the bApp receive data from an API that reads the bApps platform contract state. The following types are used:
```r
# How a token is used by a strategy for the bApp
type StrategyToken:
    token: Token
    amount: Amount
    obligationPercentage: Percentage
    risk: number

# bApp configuration for a token
type BAppToken:
    token: Token
    sharedRiskLevel: number # beta
    significance: number # weight in combination function

# Strategy as in the contract state
type Strategy:
    id: StrategyID
    owner: string
    privateKey: Uint8Array
    token: StrategyToken[]
    validatorBalance: number // ETH

# BApp configuration
type BApp:
    address: string
    token: BAppToken[]
    validatorBalanceSignificance: number
```

2. **Setup**: setups the app with the bApp configuration and strategies.
```r
procedure Setup(bApp, strategies)
    # Compute weights
    weights <- ComputeWeights(bApp, strategies)
    # Create participants set
    participantsSet <- ConstructParticipantsSet(strategies, weights)
    # Init states
    states <- CreateStates(strategies, participantsSet, network <- broadcast)

procedure broadcast(m)
    # Each participant processes the message
    for state in states do
        state.process(m)
```

3. **StartAgreement**: delivers the new block number for each state and wait for them to reach majority.

```r
upon receiving a new Ethereum block with slot number s do
    # Each participant receives the new block
    for state in states do
        state.process_ethereum_block(s,h)
```
