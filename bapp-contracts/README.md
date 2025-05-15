# :construction_worker: :closed_lock_with_key: __Based Application Contract Templates__

[![License: GPL-3.0](https://img.shields.io/badge/license-GPL--3.0-blue.svg)](https://www.gnu.org/licenses/gpl-3.0.html)

&nbsp;

## :book: _Description_

This repository demonstrates how to build and deploy a bApp contract (Based Application). It serves as both a learning resource and a template for developers looking to build their own bApps.

```/src/middleware/examples/``` is where a number of bApp use cases will be contained, more will be added here over time. If you have a specific use case that needs a template, please reach out in the SSV Discord. 

Deployment scripts for each will be available in ```/scripts```

These contracts make use of the Based Applications contract, detailed information on these can be found [in this repo](https://github.com/ssvlabs/based-applications)

## :page_with_curl: _Instructions_

**1)** Clone the repo:

```git clone https://github.com/ssvlabs/examples.git```


**2)** Install dependencies:
```cd bapp-contracts```
```forge install```

**3)** Compile the contracts:

```forge build```


## :rocket: _Deployments_

### How to Deploy

Prerequisite: 
Create a .env file and set the following environment variables:

```
# Private key for deployment (without 0x prefix)
PRIVATE_KEY=your_private_key_here

# SSV Based Apps contract address
SSV_BASED_APPS=0x40d959B95e7c56962D6d388d87921c03734b9C2C

# Deployer owner address for the contract
INIT_OWNER=0xbc8e0973fE8898716Df33C15C26ea74D032Df98a
```

**1)** Run the deployment script for the specific contract to deploy:

```forge script scripts/DeployEthPriceOracle.s.sol --fork-url https://rpc.hoodi.ethpandaops.io --broadcast```

**2)** Verify the contract:

```forge verify-contract <CONTRACT_ADDRESS> src/middleware/examples/ethPriceOracle.sol:EthPriceOracle --chain-id 560048 --etherscan-api-key <YOUR_API_KEY>```

&nbsp;

## **Contract Templates**

`EthPriceOracle.sol` 

A contract to fetch the current price of ETH and verify the 

Functionality:
- Task creation and management
- Strategy response handling
- ECDSA signature verification
- Price data validation
- Event emission for off-chain tracking

### Creating a Task

```solidity
function createNewTask() external returns (bytes32)
```

Creates a new price oracle task and returns its hash.

### Responding to a Task

```solidity
function respondToTask(
    bytes32 taskHash,
    uint32 taskNumber,
    uint256 ethPrice,
    bytes calldata aggregatedSignature,
    bytes calldata publicKeys
) external
```

Allows strategies to respond to a task with the current ETH price, verified through ECDSA signatures.

### Off-chain Integration

The contract is designed to work with off-chain strategies who:
1. Monitor for new tasks
2. Fetch current ETH prices
3. Sign responses using ECDSA
4. Aggregate signatures
5. Submit verified responses

&nbsp;

## :scroll: _License_

2025 SSV Network <https://ssv.network/>

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, version 3 of the License, or any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU General Public License for more details.

You should have received a copy of the [GNU General Public License](LICENSE)
along with this program. If not, see <https://www.gnu.org/licenses/>.