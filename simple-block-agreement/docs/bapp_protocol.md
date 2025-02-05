# bApp Protocol <!-- omit from toc -->

This document describes the bApp Protocol which allows participants to agree on the latest Ethereum block hash for each slot.

For each new Ethereum block, participants send a **VOTE** message containing their local view of the last slot and block hash.
The system state is updated when more than 66% of the system’s participation weight agrees on the block hash.

## Table of Contents <!-- omit from toc -->
- [1. System Model](#1-system-model)
- [2. Participants set](#2-participants-set)
- [3. Algorithm](#3-algorithm)
  - [3.1 Initialization](#31-initialization)
  - [3.2 Voting Phase](#32-voting-phase)


## 1. System Model

The protocol assumes the following system model:
- **Dynamic Participants Set**: The set of participants is dynamic and changes according to events on the Ethereum blockchain.
- **Weight Assignment**: Each participant $P_i$ has a weight $w_i$ where $0 \leq w_i \leq 100%$. The total weight across all participants sums to 100%: $\sum_{i} w_i = 100%$.
- **Honesty Assumption**: All participants are assumed to be honest, with no faults.
- **Partial Synchrony**: The system is partially synchronous. There exists an unknown Global Stabilization Time (GST) after which messages are eventually delivered with an unknown upper bound on time.

## 2. Participants set

The set of participants is dynamically constructed based on the smart contract state of the bApp platform.
Specifically, it is determined by `BAppOptedInByStrategy` events:
```solidity
BAppOptedInByStrategy(strategyId, bApp, data, tokens, obligationPercentages);
```
- `strategyId`: Identifies the strategy opting into the bApp.
- `bApp`: Must match the address of this bApp.
- `data`: Contains the ED25519 public key corresponding to `strategyId`.
- `token`: Must be [`SSV_ADDRESS`] as described in the [bApp participation model](./bapp_participation_model.md).
- `obligationPercentage`: A list with one element indicating the percentage of SSV tokens obligated by the strategy.

For a given Ethereum block hash, considered as the head of the chain, all relevant events must be fetched since the bApp creation.

For computing the participants' weights, the strategies' obligated balances and validator balances should be used as described in the [bApps guide](https://github.com/ssvlabs/based-applications/blob/main/doc/bapp_onboarding.md).

**Participants Set Construction Pseudocode**
```r
procedure FETCH_PARTICIPANTS(blockHash)

    if blockHash is not known then
        return

    participants <- new Map(Participant -> (Weight, PublicKey))

    opt_in_events <- api.GetAllOptInEvents(blockHash)

    for event in opt_in_events do
        strategy_id <- event.GetStrategyID()
        pubkey <- event.GetPubKey()
        weight <- api.GetWeight(strategy_id)

        participants[strategy_id] = (weight, pubkey)

    return participants
```

## 3. Algorithm

This section outlines the algorithm for the bApp protocol for process $p_i$.

### 3.1 Initialization

The initialization step sets up the state for the algorithm:

```r
procedure START()
    lastDecidedSlot <- 0
    lastDecidedHash <- 0
```

### 3.2 Voting Phase

The voting phase begins when a new Ethereum block is received, and participants broadcast their votes:
```r
upon receiving a new Ethereum block with slot number $s$ and hash $h$ do
    broadcast <p_i, signature, <VOTE, s, h>>
```

Participants then collect votes and check if a majority has been reached:
```r
upon receiving a collection Q of <_, _, <VOTE, s, h>> messages such that HAS_MAJORITY(Q) do
    if s > lastDecidedSlot then
        lastDecidedSlot <- s
        lastDecidedHash <- h
```

**Majority Check Predicate**
```r
# Returns true if the sum of weights of votes in the collection is bigger than 66%
predicate HAS_MAJORITY(Q) (where Q is a collection of <_, _, <VOTE, s, h>> messages)
    participants <- FETCH_PARTICIPANTS(h)

    if participants is empty then
        return False

    if not VALID(Q, participants) then
        return False

    collection_weight <- 0

    for p_j in participants do
        if <p_j, _, < VOTE, s, h>> in Q then
          collection_weight <- collection_weight + participants[p_j].weight

    return collection_weight >= 66%
```

**Signature Validation Predicate**
```r
# Validates each signature in the collection of messages
predicate VALID(Q, participants)

    for <p_j, signature_j, < VOTE, s, h>> in Q do
        pubkey_j <- participants[p_j].pubkey
        if not VALID_SIGNATURE(signature_j, pubkey_j, < VOTE, s, h>) then
            return False

    return True
```
