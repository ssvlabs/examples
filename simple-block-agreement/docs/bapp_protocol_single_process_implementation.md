# bApp Protocol - Single Process Implementation

This document outlines an implementation for the bApp protocol.

For simplicity, the whole bApp system is mocked in a single process.

## Implementation

Each participant should have a state with the message processing functions as described in the [algorithm](./bapp_protocol.md).

The broadcasting of messages can be done through a channel that triggers all participants' states to process it immediately.

```r
procedure START()

    private_keys <- new Map(Participant -> PrivKey)

    states <- new Map(Participant -> State)
```

```r
upon registering a new participant p_j with private key privkey_j do
    private_keys[p_j] <- privkey_j
```

```r
procedure broadcast(m)

    # Each participant processes the message
    for state in states do
        state.process(m)
```

```r
upon receiving a new Ethereum block with slot number $s$ and hash $h$ do

    participants <- FETCH_PARTICIPANTS(h)

    # Create new participants
    for p_j in participants do
        if p_j not in states then
            states[p_j] <- new State(private_keys[p_j])

    # Each participant receives the new block
    for state in states do
        state.process_ethereum_block(s,h)
```
