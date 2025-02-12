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
│ Tokens                         │        SSV (Amount: 102 / Significance: 1) │
│ Strategies                     │                                          3 │
│ Total Validator Balance        │                                 14,784 ETH │
│ Validator Balance Significance │                                          2 │
└────────────────────────────────┴────────────────────────────────────────────┘

                💲 BApp Token Weight Summary for SSV                 
┌──────────┬─────────┬────────────────┬───────────────────┬─────────┐
│ Strategy │ Balance │ Obligation (%) │ Obligated Balance │    Risk │
├──────────┼─────────┼────────────────┼───────────────────┼─────────┤
│    10    │ 100 SSV │         90.00% │            90 SSV │ 180.00% │
│    12    │  20 SSV │         10.00% │             2 SSV │  10.00% │
│    13    │  10 SSV │        100.00% │            10 SSV │ 100.00% │
└──────────┴─────────┴────────────────┴───────────────────┴─────────┘

🚀  Starting weight calculations for 3 strategies
[💲 Token SSV] 🪙  Calculating token weights
[💲 Token SSV] 🗂️  Total amount obligated to bApp: 102
[💲 Token SSV] 🗂️  Beta: 10
[💲 Token SSV] [🧍‍♂️ strategy 10] 🧮 Calculating weight (polynomial formula):
  -> Obligation participation (obligated balance / total bApp amount): 0.8823529411764706
  - Risk: 1.8
  -> Weight (obligation participation / (max(1, risk)^{beta})): 0.0024712534387572728
[💲 Token SSV] [🧍‍♂️ strategy 12] 🧮 Calculating weight (polynomial formula):
  -> Obligation participation (obligated balance / total bApp amount): 0.0196078431372549
  - Risk: 0.1
  -> Weight (obligation participation / (max(1, risk)^{beta})): 0.0196078431372549
[💲 Token SSV] [🧍‍♂️ strategy 13] 🧮 Calculating weight (polynomial formula):
  -> Obligation participation (obligated balance / total bApp amount): 0.09803921568627451
  - Risk: 1
  -> Weight (obligation participation / (max(1, risk)^{beta})): 0.09803921568627451
                           
📊 Normalized Weights for SSV                           
┌──────────┬────────────┬──────────────┬────────────┐
│ Strategy │ Raw Weight │ Norm. Weight │ Weight (%) │
├──────────┼────────────┼──────────────┼────────────┤
│    10    │    2.06e-2 │      2.06e-2 │      2.06% │
│    12    │    1.63e-1 │      1.63e-1 │     16.32% │
│    13    │    8.16e-1 │      8.16e-1 │     81.62% │
└──────────┴────────────┴──────────────┴────────────┘

[🔑 Validator Balance] 🪙  Calculating validator balance weights
[🔑 Validator Balance] 🗂️  Total VB amount in bApp: 14784
[🔑 Validator Balance] [🧍‍♂️ strategy 10] 🧮 Calculating normalized weight:
  - Validator Balance: 9744
  - Total VB amount in bApp: 14784
  - Weight (validator balance / total amount): 65.91%
[🔑 Validator Balance] [🧍‍♂️ strategy 12] 🧮 Calculating normalized weight:
  - Validator Balance: 1008
  - Total VB amount in bApp: 14784
  - Weight (validator balance / total amount): 6.82%
[🔑 Validator Balance] [🧍‍♂️ strategy 13] 🧮 Calculating normalized weight:
  - Validator Balance: 4032
  - Total VB amount in bApp: 14784
  - Weight (validator balance / total amount): 27.27%

            🔑 Validator Weights             
┌──────────┬───────────────────┬────────────┐
│ Strategy │ Validator Balance │ Weight (%) │
├──────────┼───────────────────┼────────────┤
│    10    │         9,744 ETH │     65.91% │
│    12    │         1,008 ETH │      6.82% │
│    13    │         4,032 ETH │     27.27% │
│  TOTAL   │        14,784 ETH │    100.00% │
└──────────┴───────────────────┴────────────┘

[⚖️ Final Weight] [🧍‍♂️ strategy 10] 🧮 Calculating Final Weight:
  -> Total significance sum: 3
  - Token: SSV
  - Significance: 1
  - Weight: 0.020573494517314887
  -> (Significance/Significance Sum) / Weight = 16.20207656277334
  - Validator Balance
  - Significance: 2
  - Weight: 0.6590909090909091
  -> (Significance/Significance Sum) / Weight = 1.0114942528735633
  --> Harmonic mean = (1/(sum_t (significance_t/significance sum) / weight_t)): 0.05809369890243885

[⚖️ Final Weight] [🧍‍♂️ strategy 12] 🧮 Calculating Final Weight:
  -> Total significance sum: 3
  - Token: SSV
  - Significance: 1
  - Weight: 0.16323775091378084
  -> (Significance/Significance Sum) / Weight = 2.0420113084588736
  - Validator Balance
  - Significance: 2
  - Weight: 0.06818181818181818
  -> (Significance/Significance Sum) / Weight = 9.777777777777779
  --> Harmonic mean = (1/(sum_t (significance_t/significance sum) / weight_t)): 0.08460387852135472

[⚖️ Final Weight] [🧍‍♂️ strategy 13] 🧮 Calculating Final Weight:
  -> Total significance sum: 3
  - Token: SSV
  - Significance: 1
  - Weight: 0.8161887545689043
  -> (Significance/Significance Sum) / Weight = 0.4084022616917747
  - Validator Balance
  - Significance: 2
  - Weight: 0.2727272727272727
  -> (Significance/Significance Sum) / Weight = 2.4444444444444446
  --> Harmonic mean = (1/(sum_t (significance_t/significance sum) / weight_t)): 0.35052707103017106

             📊 Normalized Final Weights             
┌──────────┬────────────┬──────────────┬────────────┐
│ Strategy │ Raw Weight │ Norm. Weight │ Weight (%) │
├──────────┼────────────┼──────────────┼────────────┤
│    10    │    5.81e-2 │      1.18e-1 │     11.78% │
│    12    │    8.46e-2 │      1.72e-1 │     17.15% │
│    13    │    3.51e-1 │      7.11e-1 │     71.07% │
└──────────┴────────────┴──────────────┴────────────┘

🚀 Simulate Blockchain Agreement Process for Slot 11044866

[🧍strategy 10]  📦 Handling new block with slot 11044866.
[🧍strategy 10]  📤 Broadcasting vote
[🧍strategy 10]  🗳️ Received vote from participant 10 with slot 11044866
[🧍strategy 10]  📄 Checking majority for slot 11044866
[🧍strategy 10]  🔢 Total weight: 11.78%. Decomposition: 11.78% (from P10)
[🧍strategy 10]  ❌ Majority not yet reached for slot: 11044866
[🧍strategy 12]  🗳️ Received vote from participant 10 with slot 11044866
[🧍strategy 12]  📄 Checking majority for slot 11044866
[🧍strategy 12]  🔢 Total weight: 11.78%. Decomposition: 11.78% (from P10)
[🧍strategy 12]  ❌ Majority not yet reached for slot: 11044866
[🧍strategy 13]  🗳️ Received vote from participant 10 with slot 11044866
[🧍strategy 13]  📄 Checking majority for slot 11044866
[🧍strategy 13]  🔢 Total weight: 11.78%. Decomposition: 11.78% (from P10)
[🧍strategy 13]  ❌ Majority not yet reached for slot: 11044866
[🧍strategy 12]  📦 Handling new block with slot 11044866.
[🧍strategy 12]  📤 Broadcasting vote
[🧍strategy 10]  🗳️ Received vote from participant 12 with slot 11044866
[🧍strategy 10]  📄 Checking majority for slot 11044866
[🧍strategy 10]  🔢 Total weight: 28.93%. Decomposition: 11.78% (from P10) + 17.15% (from P12)
[🧍strategy 10]  ❌ Majority not yet reached for slot: 11044866
[🧍strategy 12]  🗳️ Received vote from participant 12 with slot 11044866
[🧍strategy 12]  📄 Checking majority for slot 11044866
[🧍strategy 12]  🔢 Total weight: 28.93%. Decomposition: 11.78% (from P10) + 17.15% (from P12)
[🧍strategy 12]  ❌ Majority not yet reached for slot: 11044866
[🧍strategy 13]  🗳️ Received vote from participant 12 with slot 11044866
[🧍strategy 13]  📄 Checking majority for slot 11044866
[🧍strategy 13]  🔢 Total weight: 28.93%. Decomposition: 11.78% (from P10) + 17.15% (from P12)
[🧍strategy 13]  ❌ Majority not yet reached for slot: 11044866
[🧍strategy 13]  📦 Handling new block with slot 11044866.
[🧍strategy 13]  📤 Broadcasting vote
[🧍strategy 10]  🗳️ Received vote from participant 13 with slot 11044866
[🧍strategy 10]  📄 Checking majority for slot 11044866
[🧍strategy 10]  🔢 Total weight: 100.00%. Decomposition: 11.78% (from P10) + 17.15% (from P12) + 71.07% (from P13)
[🧍strategy 10]  ✅ Majority found for slot: 11044866. Updating last decided slot.
[🧍strategy 12]  🗳️ Received vote from participant 13 with slot 11044866
[🧍strategy 12]  📄 Checking majority for slot 11044866
[🧍strategy 12]  🔢 Total weight: 100.00%. Decomposition: 11.78% (from P10) + 17.15% (from P12) + 71.07% (from P13)
[🧍strategy 12]  ✅ Majority found for slot: 11044866. Updating last decided slot.
[🧍strategy 13]  🗳️ Received vote from participant 13 with slot 11044866
[🧍strategy 13]  📄 Checking majority for slot 11044866
[🧍strategy 13]  🔢 Total weight: 100.00%. Decomposition: 11.78% (from P10) + 17.15% (from P12) + 71.07% (from P13)
[🧍strategy 13]  ✅ Majority found for slot: 11044866. Updating last decided slot.
```