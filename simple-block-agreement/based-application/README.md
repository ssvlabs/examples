# __Based Application Setup & Data Sources__

&nbsp;

## :eyes: __Overview__

This project calculates voting power for a given `bApp` using the SSV Subgraph and the SSV API. The calculation involves fetching delegation and strategy details from the subgraph and validator balances from the SSV network API.

&nbsp;

## :postbox: __Fetching Voting Power__

### CLI Input

1. Provide the `bApp` address for the operator.
   
2. Provide the two `private_keys` required for consensus.

### Data Sources

* **SSV Subgraph:**
   
   - Fetch strategies and delegation details for a given `bApp`.
     
   - Calculate validator balance.
  
   - Determine active vs. inactive validators.
  
   - Compute the total delegated ETH and SSV holdings.

&nbsp;

## :satellite: __Example API Queries__

&nbsp;

#### Querying Strategies from SSV Subgraph

```sh
  curl -X POST "https://api.studio.thegraph.com/query/71118/based-applications-ssv-holesky/version/latest/" \
     -H "Content-Type: application/json" \
     -d '{
       "query": "query MyQuery { bapp(id: \"0x8F3A66Bb003EBBD5fB115981DfaD8D8400FCeb76\") { strategies { id strategy { deposits { depositAmount token } balances { id } } obligations { obligatedBalance percentage } } bAppTokens { token totalObligatedBalance } owner { id } } }"
     }'
```

&nbsp;

## :computer: __Manual Steps__

1. Register bApp with ETH and SSV tokens.
   
2. Register Strategy.
   
3. Opt-in with the strategy into the bAPP with ETH and SSV tokens obligations.
   
4. Run the CLI to fetch voting power.
   
5. Run the CLI to fetch the delegated validator balance.

&nbsp;

## :crystal_ball: __Future Milestones__

- **Automated registration** using Alchemy Node for broadcasting transactions.
- Integration with **Holesky Explorer (holesky.explorer.ssv.network)**.
- Utilizing **Subsquid on Holeskys** for enhanced querying.

&nbsp;

## :page_with_curl: __Contract and Token Details__

- **Owner bApp and Strategy:** `0x219437D13532d225D98bACe5638EB9146D4BDD4B`
- **Holesky Prod Based App Contract:** `0x1bd6ceb98daf7ffeb590236b720f81b65213836a`
- **bApp Registered with ETH:** `0x8F3A66Bb003EBBD5fB115981DfaD8D8400FCeb76`
- **SSV Token:** `0xad45A78180961079BFaeEe349704F411dfF947C6`

&nbsp;

## __Example Transactions__

- **Obligation Created with Native ETH (10%)**: [View on Etherscan](https://holesky.etherscan.io/tx/0x334a40a97780a5414284d7520d026b737e0d79b0ff8cd5dfed6057f734542e47)
  
- **Deposit ETH (0.001 ETH)**: [View on Etherscan](https://holesky.etherscan.io/tx/0xfea86a202f3a112ab8de447620f84e30bda6f60284c459b402a0f4c482bb1770)

&nbsp;

## :black_nib: __Notes__

- The system determines validator balance based on delegation percentages.
  
- Active validators are assumed to have **32 ETH**.
  
- The CLI tool is responsible for handling the consensus mechanism.

### ⚠️ DISCLAIMER

The keys below are randomly generated and are used solely for testing purposes.

```json
{
  "id": 1,
  "publicKey": "dc47786918f4462de09fe6d02537f216e80c9844dfd2eff66a15b89cf73c6ce7",
  "privateKey": "63920609bb76b09d816b9427e906d1ad7d3008b4f8a164adf3b4900969ac97fa"
}
{
  "id": 2,
  "publicKey": "02e86e4e71811735582785d4d161a2a0e85c77d40e9b200b63d940b7e9f78e6e",
  "privateKey": "228ffcb12deb17c72d7348415909290db647153c6b255c0b76628496d136b875"
}
```

### 📌 Registering bApp
- **bApp Address:** `0x89EF15BC1E7495e3dDdc0013C0d2B049d487b2fD`
- **Metadata URL:** [GitHub Metadata](https://github.com/ssvlabs/examples/tree/main/simple-block-agreement/based-application/metadata.json)
- **Owner:** `0x8F3A66Bb003EBBD5fB115981DfaD8D8400FCeb76`
- **bApp Token:** `SSV Holesky (0xad45A78180961079BFaeEe349704F411dfF947C6)`
- **Shared Risk Level:** `100`

### 🎯 Strategy 4

#### 🔹 Creating the Strategy

- **Owner:** `0x219437D13532d225D98bACe5638EB9146D4BDD4B`
- **Delegation:** Owner delegates **100% balance** to itself.
- **Opt-in to bApp** with **SSV token** and data:
  ```
  0x02e86e4e71811735582785d4d161a2a0e85c77d40e9b200b63d940b7e9f78e6e
  ```
- **Strategy Token:** `SSV Holesky (0xad45A78180961079BFaeEe349704F411dfF947C6)`

#### 🔹 Transactions

- **Approve Main Contract to move SSV tokens**
- **Deposit (Owner: 20 SSV):**
- **Deposit (Non-Owner: 30 SSV)**

### 🎯 Strategy 5

#### 🔹 Creating the Strategy
- **Owner:** `0x8F3A66Bb003EBBD5fB115981DfaD8D8400FCeb76`
- **Delegation:** Owner delegates **100% balance** to itself.
- **Opt-in to bApp** with **SSV token** and data:
  ```
  0xdc47786918f4462de09fe6d02537f216e80c9844dfd2eff66a15b89cf73c6ce7
  ```

- **Strategy Token:** `SSV Holesky (0xad45A78180961079BFaeEe349704F411dfF947C6)`

#### 🔹 Transactions

- **Approve Main Contract to move SSV tokens:** 
- **Deposit (Owner: 30 SSV):**
