# :construction_worker: :closed_lock_with_key: __Simple Block Agreement Example__

:construction: CAUTION: This example is currently under **heavy development!** :construction:

&nbsp;

## :book: _Description_

This repository contains the core Based Applications Contracts, including UUPS upgradeable contracts for managing delegations, creating strategies, and registering bApps on the SSV Based-Applications Platform. 

### **Main Components**

- **`Operator`** – The software client run by operators.
  
- **`Based Application`** – CLI commands to properly setup your based application with the SSV Based Application platform.

&nbsp;

## :page_with_curl: _Instructions for Operator_

**1)** Fire up your favorite console & clone this repo somewhere:

__`❍ git clone https://github.com/ssvlabs/examples.git`__

**2)** Enter the example folder:

__`❍ cd examples/simple-block-agreement/operator`__

**3)** Install dependencies:

__`❍ npm install`__

**4)** Setup the env:

__`❍ cp .env.example .env`__

**5)** Load the env:

__`❍ cd .`__

**6)** Run the operator:

__`❍ npm run start`__

&nbsp;

## :camera: _Expected Output_


```console

                               📊 BApp Overview                                
┌────────────────────────────────┬────────────────────────────────────────────┐
│ Metric                         │                                      Value │
├────────────────────────────────┼────────────────────────────────────────────┤
│ Address                        │ 0x89EF15BC1E7495e3dDdc0013C0d2B049d487b2fD │
│ Tokens                         │        SSV (Amount: 76 / Significance: 50) │
│ Strategies                     │                                          2 │
│ Total Validator Balance        │                           6,108,012.48 ETH │
│ Validator Balance Significance │                                          2 │
└────────────────────────────────┴────────────────────────────────────────────┘

                💲 BApp Token Weight Summary for SSV                 
┌──────────┬─────────┬────────────────┬───────────────────┬─────────┐
│ Strategy │ Balance │ Obligation (%) │ Obligated Balance │    Risk │
├──────────┼─────────┼────────────────┼───────────────────┼─────────┤
│    4     │  70 SSV │        100.00% │            70 SSV │ 100.00% │
│    5     │  30 SSV │         20.00% │             6 SSV │  20.00% │
└──────────┴─────────┴────────────────┴───────────────────┴─────────┘

🚀  Starting weight calculations for 2 strategies

|==============================================================================================|
|                              Token Weight Formula (Polynomial)                               |
|==============================================================================================|
|                      ObligatedBalance              1                                         |
| W_strategy,token =  -------------------  *  -------------------                              |
|                       TotalAmount            max(1, Risk)^β                                  |
|==============================================================================================|


|==============================================================================================|
|                     Combination Function (Final Weight) (Harmonic Mean)                      |
|==============================================================================================|
|                                           1                                                  |
| W_strategy^final  =  --------------------------------------                                  |
|                     Σ(Significance_token / Weight_strategy,token)                            |
|                     + (Significance_ValidatorBalance / Weight_strategy,ValidatorBalance)     |
|==============================================================================================|


[💲 Token SSV] 🪙  Calculating token weights
[💲 Token SSV] 🗂️  Total amount obligated to bApp: 76
[💲 Token SSV] 🗂️  Beta: 100
[💲 Token SSV] [🧍strategy 4] 🧮 Calculating weight (polynomial formula):
  -> Obligation participation (obligated balance / total bApp amount): 0.9210526315789473
  - Risk: 1
  -> Weight (obligation participation / (max(1, risk)^{beta})): 0.9210526315789473
[💲 Token SSV] [🧍strategy 5] 🧮 Calculating weight (polynomial formula):
  -> Obligation participation (obligated balance / total bApp amount): 0.07894736842105263
  - Risk: 0.2
  -> Weight (obligation participation / (max(1, risk)^{beta})): 0.07894736842105263

                           
📊 Normalized Weights for SSV                           
┌──────────┬────────────┬──────────────┬────────────┐
│ Strategy │ Raw Weight │ Norm. Weight │ Weight (%) │
├──────────┼────────────┼──────────────┼────────────┤
│    4     │    9.21e-1 │      9.21e-1 │     92.11% │
│    5     │    7.89e-2 │      7.89e-2 │      7.89% │
└──────────┴────────────┴──────────────┴────────────┘

[🔑 Validator Balance] 🪙  Calculating validator balance weights
[🔑 Validator Balance] 🗂️  Total VB amount in bApp: 6108012.48
[🔑 Validator Balance] [🧍strategy 4] 🧮 Calculating normalized weight:
  - Validator Balance: 3052.48
  - Total VB amount in bApp: 6108012.48
  - Weight (validator balance / total amount): 0.05%
[🔑 Validator Balance] [🧍strategy 5] 🧮 Calculating normalized weight:
  - Validator Balance: 6104960
  - Total VB amount in bApp: 6108012.48
  - Weight (validator balance / total amount): 99.95%

            🔑 Validator Weights             
┌──────────┬───────────────────┬────────────┐
│ Strategy │ Validator Balance │ Weight (%) │
├──────────┼───────────────────┼────────────┤
│    4     │      3,052.48 ETH │      0.05% │
│    5     │     6,104,960 ETH │     99.95% │
│  TOTAL   │  6,108,012.48 ETH │    100.00% │
└──────────┴───────────────────┴────────────┘

[⚖️ Final Weight] [🧍strategy 4] 🧮 Calculating Final Weight:
  -> Total significance sum: 52
  - Token: SSV
  - Significance: 50
  - Weight: 0.9210526315789473
  -> (Significance/Significance Sum) / Weight = 1.043956043956044
  - Validator Balance
  - Significance: 2
  - Weight: 0.0004997501249375312
  -> (Significance/Significance Sum) / Weight = 76.96153846153847
  --> Harmonic mean = (1/(sum_t (significance_t/significance sum) / weight_t)): 0.012819609776713389

[⚖️ Final Weight] [🧍strategy 5] 🧮 Calculating Final Weight:
  -> Total significance sum: 52
  - Token: SSV
  - Significance: 50
  - Weight: 0.07894736842105263
  -> (Significance/Significance Sum) / Weight = 12.17948717948718
  - Validator Balance
  - Significance: 2
  - Weight: 0.9995002498750624
  -> (Significance/Significance Sum) / Weight = 0.038480769230769235
  --> Harmonic mean = (1/(sum_t (significance_t/significance sum) / weight_t)): 0.08184667075550248


             📊 Normalized Final Weights             
┌──────────┬────────────┬──────────────┬────────────┐
│ Strategy │ Raw Weight │ Norm. Weight │ Weight (%) │
├──────────┼────────────┼──────────────┼────────────┤
│    4     │    1.28e-2 │      1.35e-1 │     13.54% │
│    5     │    8.18e-2 │      8.65e-1 │     86.46% │
└──────────┴────────────┴──────────────┴────────────┘

🚀 Simulate Blockchain Agreement Process for Slot 11059006
[🧍strategy 4]  📦 Handling new block with slot 11059006.
[🧍strategy 4]  📤 Broadcasting vote
[🧍strategy 4]  🗳️ Received vote from participant 4 with slot 11059006
[🧍strategy 4]  📄 Checking majority for slot 11059006
[🧍strategy 4]  🔢 Total weight: 13.54%. Decomposition: 13.54% (from P4)
[🧍strategy 4]  ❌ Majority not yet reached for slot: 11059006
[🧍strategy 5]  🗳️ Received vote from participant 4 with slot 11059006
[🧍strategy 5]  📄 Checking majority for slot 11059006
[🧍strategy 5]  🔢 Total weight: 13.54%. Decomposition: 13.54% (from P4)
[🧍strategy 5]  ❌ Majority not yet reached for slot: 11059006
[🧍strategy 5]  📦 Handling new block with slot 11059006.
[🧍strategy 5]  📤 Broadcasting vote
[🧍strategy 4]  🗳️ Received vote from participant 5 with slot 11059006
[🧍strategy 4]  📄 Checking majority for slot 11059006
[🧍strategy 4]  🔢 Total weight: 100.00%. Decomposition: 13.54% (from P4) + 86.46% (from P5)
[🧍strategy 4]  ✅ Majority found for slot: 11059006. Updating last decided slot.
[🧍strategy 5]  🗳️ Received vote from participant 5 with slot 11059006
[🧍strategy 5]  📄 Checking majority for slot 11059006
[🧍strategy 5]  🔢 Total weight: 100.00%. Decomposition: 13.54% (from P4) + 86.46% (from P5)
[🧍strategy 5]  ✅ Majority found for slot: 11059006. Updating last decided slot.
```