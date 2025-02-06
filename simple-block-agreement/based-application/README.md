# __Based Application Setup & Data Sources__

&nbsp;

## :eyes: __Overview__

This project calculates voting power for a given `bApp` using the SSV Subgraph and the SSV API. The calculation involves fetching delegation and strategy details from the subgraph and validator balances from the SSV network API.

&nbsp;

## :postbox: __Fetching Voting Power__

### CLI Input

1. Provide the `bApp` address for the operator.
   
2. Provide the four `private_keys` required for consensus.

### Data Sources

* **SSV Subgraph:**
   
   - Fetch strategies and delegation details for a given `bApp`.
  
   - Extract the voting power based on different strategies.

* **SSV API:**
   
   - Calculate validator balance.
  
   - Determine active vs. inactive validators.
  
   - Compute the total delegated ETH and SSV holdings.

&nbsp;

## :satellite: __Example API Queries__

&nbsp;

#### Querying Strategies from SSV Subgraph

```sh
  curl -X POST "https://api.studio.thegraph.com/query/53804/ssv-bapps-subgraph/version/latest" \
     -H "Content-Type: application/json" \
     -d '{
       "query": "query MyQuery { bapp(id: \"0x8F3A66Bb003EBBD5fB115981DfaD8D8400FCeb76\") { strategies { id strategy { deposits { depositAmount token } balances { id } } obligations { obligatedBalance percentage } } bAppTokens { token totalObligatedBalance } owner { id } } }"
     }'
```

&nbsp;


#### Querying Active Validators by Owner from SSV API

```sh
curl -s -X GET "https://api.stage.ops.ssvlabsinternal.com/api/v4/holesky/validators/explorer?ownerAddress=0x5cC0DdE14E7256340CC820415a6022a7d1c93A35" | jq
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
- **Devnet Contract:** `0x9B3345F3B1Ce2d8655FC4B6e2ed39322d52aA317`
- **bApp Registered with ETH:** `0x8F3A66Bb003EBBD5fB115981DfaD8D8400FCeb76`
- **Native ETH Token:** `0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE`
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

