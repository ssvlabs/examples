# Experiment <!-- omit from toc -->

This document outlines the sequence of smart contract function calls required to execute the experiment.

## Table of Contents  <!-- omit from toc -->
- [Configuration](#configuration)
- [1. Register bApp](#1-register-bapp)
- [2. Register 4 Strategies](#2-register-4-strategies)
- [3. Token Deposit](#3-token-deposit)
- [4. Validator Balance Delegation](#4-validator-balance-delegation)
- [5. Strategies Opt-In](#5-strategies-opt-in)


## Configuration

| Name | Value |
| --- | --- |
| `BAPP_OWNER` | - |
| `BAPP_ADDRESS` | - |
| - | - |
| `ACCOUNT_1` | - |
| `ACCOUNT_2` | - |
| `ACCOUNT_3` | - |
| `ACCOUNT_4` | - |
| - | - |
| `DEPOSITOR_1` | - |
| `DEPOSITOR_2` | - |
| `DEPOSITOR_3` | - |
| `DEPOSITOR_4` | - |
| - | - |
| `DELEGATOR_1` | - |
| `DELEGATOR_2` | - |
| `DELEGATOR_3` | - |
| `DELEGATOR_4` | - |
| - | - |
| `STRATEGY_1_PUBKEY` | - |
| `STRATEGY_2_PUBKEY` | - |
| `STRATEGY_3_PUBKEY` | - |
| `STRATEGY_4_PUBKEY` | - |
| - | - |
| `STRATEGY_1_PRIVKEY` | - |
| `STRATEGY_2_PRIVKEY` | - |
| `STRATEGY_3_PRIVKEY` | - |
| `STRATEGY_4_PRIVKEY` | - |

## 1. Register bApp

The `BAPP_OWNER` registers the bApp using the following function:

```solidity
function registerBApp(
    address bApp = `BAPP_ADDRESS`,
    address[] calldata tokens = [`SSV_ADDRESS`],
    uint32[] calldata sharedRiskLevels = [2_000_000],
    string calldata metadataURI = "github.com/ssvlabs/bapp_example",
)
```

## 2. Register 4 Strategies

Each account (`ACCOUNT_1` to `ACCOUNT_4`) registers a strategy with a 0% fee.
Each call emits a strategy ID, referenced as `STRATEGY_1` to `STRATEGY_4` respectively.

```solidity
function createStrategy(
    uint32 fee = 0,
)
```

## 3. Token Deposit

Each depositor deposits a specified amount of SSV tokens into a strategy.

```solidity
function depositERC20(
    uint256 strategyId,
    IERC20 token = `SSV_ADDRESS`,
    uint256 amount
)
```

| Depositor     | strategyId   | amount |
|---------------|--------------|--------|
| `DEPOSITOR_1` | `STRATEGY_1` | 5      |
| `DEPOSITOR_2` | `STRATEGY_2` | 10     |
| `DEPOSITOR_3` | `STRATEGY_3` | 15     |
| `DEPOSITOR_4` | `STRATEGY_4` | 20     |

## 4. Validator Balance Delegation

Each delegator delegates a percentage of their validator balance to a strategy owner.
The delegators are considered to have the same owned validator balance amount.

```solidity
function delegateBalance(
    address account,
    uint32 percentage
)
```

| Delegator     | account     | percentage  |
|---------------|-------------|-------------|
| `DELEGATOR_1` | `ACCOUNT_1` | 2000 (20%)  |
| `DELEGATOR_2` | `ACCOUNT_2` | 1500  (15%) |
| `DELEGATOR_3` | `ACCOUNT_3` | 1000 (10%)  |
| `DELEGATOR_4` | `ACCOUNT_4` | 500 (5%)    |


## 5. Strategies Opt-In

Each strategy (`STRATEGY_1` to `STRATEGY_4`) opts into the bApp, obligating 100% of its SSV tokens.
The data field contains a JSON object encoded in UTF-8, with the strategy's public key and its ED25519 signature over the SHA-512 hash of the bApp address, as decribed in the [participation model file](./bapp_participation_model.md).

```solidity
function optInToBApp(
    uint256 strategyId,
    address bApp = `BAPP_ADDRESS`,
    address[] calldata tokens = [`SSV_ADDRESS`],
    uint32[] calldata obligationPercentages = [10000],
    bytes calldata data = ENCODE_UTF8(`{
        "pubkey": HEX(STRATEGY_PUBKEY),
        "signature": HEX(ED25519_SIGN(SHA512(BAPP_ADDRESS), STRATEGY_PRIVKEY))
    }`)
)
```
