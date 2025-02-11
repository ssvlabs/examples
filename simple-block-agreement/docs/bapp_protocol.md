# bApp Protocol <!-- omit from toc -->

This document describes the bApp Protocol which allows participants to sync on the latest Ethereum block number.

For each new Ethereum block, participants send a **VOTE** message acknowledging the block receival.
The system state is updated when more than 66% of the system’s participation weight vote on the slot.

The implementation of the protocol can be found in [protocol.ts](./../operator/src/protocol.ts).

## Table of Contents <!-- omit from toc -->
- [1. System Model](#1-system-model)
- [2. Algorithm](#2-algorithm)
  - [2.1 Initialization](#21-initialization)
  - [2.2 Voting Phase](#22-voting-phase)


## 1. System Model

The protocol assumes the following system model:
- **Weighted Participants Set**: Each participant $P_i$ has a weight $w_i$ where $0 \leq w_i \leq 100%$. The total weight across all participants sums to 100%: $\sum_{i} w_i = 100%$. Every participant knows a priori all other protocol participants along with their weights and public keys.
- **Honesty Assumption**: All participants are assumed to be honest, with no faults.
- **Partial Synchrony**: The system is partially synchronous. There exists an unknown Global Stabilization Time (GST) after which messages are eventually delivered with an unknown upper bound on time.

## 2. Algorithm

This section outlines the algorithm for the bApp protocol for process $p_i$.

### 2.1 Initialization

The initialization step sets up the state for the algorithm:

```r
procedure START()
    lastDecidedSlot <- 0
```

### 2.2 Voting Phase

The voting phase begins when a new Ethereum block is received, and participants broadcast their votes:
```r
upon receiving a new Ethereum block with slot number s do
    broadcast <p_i, signature, <VOTE, s>>
```

Participants, then, collect votes and check if a majority has been reached:
```r
upon receiving a collection Q of <_, _, <VOTE, s>> messages such that HAS_MAJORITY(Q) do
    if s > lastDecidedSlot then
        lastDecidedSlot <- s
```

**Majority Check Predicate**
```r
# Returns true if the sum of weights of votes in the collection is bigger than 66%
predicate HAS_MAJORITY(Q) (where Q is a collection of <_, _, <VOTE, s>> messages)

    if not VALID(Q, participants) then
        return False

    collection_weight <- 0

    for p_j in participants do
        if <p_j, _, < VOTE, s>> in Q then
          collection_weight <- collection_weight + participants[p_j].weight

    return collection_weight >= 66%
```

**Signature Validation Predicate**
```r
# Validates each signature in the collection of messages
predicate VALID(Q, participants)

    for <p_j, signature_j, < VOTE, s>> in Q do
        pubkey_j <- participants[p_j].pubkey
        if not VALID_SIGNATURE(signature_j, pubkey_j, <VOTE, s>) then
            return False

    return True
```
