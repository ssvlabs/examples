# ETH Price Oracle Client

A client application for the SSV Network that handles ETH price reporting, voting, and agreement processes.

## Project Structure

```
src/
├── abi/           # Contract ABIs
├── config/        # Configuration and types
├── core/          # Core client functionality
├── sdk-weights/   # SDK integration
├── tasks/         # Task management
├── utils/         # Utility functions
└── voting/        # Voting system
```

## Features

- Real-time ETH price monitoring
- On-chain task creation and response
- Voting system with weight calculation
- Message signing and verification
- Multiple strategy support
- Configurable calculation types (arithmetic, geometric, harmonic)

## Prerequisites

1. A private key for the strategy owner's wallet
2. The strategy must be opted-in to the BApp
3. The wallet must be the owner of the strategy being used

## Installation

1. Clone the repository
2. Navigate to the project directory:

```bash
cd eth-price-oracle-client
```

3. Install dependencies:

```bash
npm install
```

4. Create a `.env` file in the root directory with your configuration:
```
BAPP_ADDRESS="0xBb00B761d0670f09d80fe176a2b0fB33e91fbCe9"
PRIVATE_KEY_1="0x00000000000000000000000000000000000000"
```

## Usage

Run the client with your private key and strategy. You can pass the private key in two ways:

1. Directly in the command:
```bash
PRIVATE_KEY=your_private_key_here npm run dev -- --strategy 19 --calculation_type arithmetic
```

2. Using a variable from your .env file for each strategy(recommended):
```bash
PRIVATE_KEY=$PRIVATE_KEY_1 npm run dev -- --strategy 19 --calculation_type arithmetic
```

Run with specific strategy and calculation type:
```bash
PRIVATE_KEY=$PRIVATE_KEY_1 npm run dev -- --strategy 19 --calculation_type geometric
```

Enable verbose mode:
```bash
PRIVATE_KEY=$PRIVATE_KEY_1 npm run dev -- --strategy 19 --verbose
```

## Configuration

The client supports the following command-line arguments:

- `--strategy`: Specify the strategy number (required)
- `--calculation_type`: Set the weight calculation type (arithmetic, geometric, or harmonic)
- `--verbose`: Enable verbose logging

## Contract Address

The client interacts with the ETH Price Oracle contract at the address specified in your `.env` file as `BAPP_ADDRESS`.

When the client is running, a transaction must be signed on-chain to trigger the task being created, the client will listen for this, and process it, signing the response and sending it back to the bapp with the private key provided in the environment variable.

**Important**: The private key provided must be from the wallet that owns the strategy being used. The BApp contract will only accept signatures from strategy owners who have opted in to the system. If you're not the strategy owner or haven't opted in, the transactions will be rejected.

## Example Output

```
██████╗  █████╗ ██████╗ ██████╗     ██████╗██╗     ██╗███████╗███╗   ██╗████████╗
██╔══██╗██╔══██╗██╔══██╗██╔══██╗   ██╔════╝██║     ██║██╔════╝████╗  ██║╚══██╔══╝
██████╔╝███████║██████╔╝██████╔╝   ██║     ██║     ██║█████╗  ██╔██╗ ██║   ██║
██╔══██╗██╔══██║██╔═══╝ ██╔═══╝    ██║     ██║     ██║██╔══╝  ██║╚██╗██║   ██║
██████╔╝██║  ██║██║     ██║        ╚██████╗███████╗██║███████╗██║ ╚████║   ██║
╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝         ╚═════╝╚══════╝╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝

════════════════════════════════════════════════════════════════════════════════
📍 Initializing ETH Price Oracle Client v1.0.0
🔑 Account Address: 0xac5a7Ce31843e737CD38938A8EfDEc0BE5e728b4
════════════════════════════════════════════════════════════════════════════════
[09:47:31] ✅ Local client initialized for Strategy [19]
[09:47:31] 📊 Connecting to Hoodi network...
[09:47:31] 📊 Listening for NewTaskCreated events on contract: 0x2224E61A609E850E67bC73997c2d7633FC18238B
[09:47:31] 📡 ════════════════════════════════════════════════════════════════════════════════
[09:47:31] 📊 Starting event listener for NewTaskCreated events...
[09:47:32] 📡 ════════════════════════════════════════════════════════════════════════════════
[09:47:33] 📊 Client is ready to process on-chain tasks
[Heartbeat] Client is running and waiting for new tasks...
```

## Key Implementation Details

### Event Listening
The client listens for `NewTaskCreated` events from the contract in `src/core/eventListener.ts`. When a new task is detected, it:
1. Extracts the task index and hash
2. Creates a new task object
3. Fetches the current ETH price
4. Signs the task response

### Weight Calculation
Weight calculation is handled in `src/voting/voteManager.ts`. The system:
1. Calculates strategy weights using the SDK
2. Records votes for each strategy
3. Checks for majority consensus (>50% total weight)
4. Submits the response when majority is reached

### Message Signing
Message signing is implemented in `src/utils/signing.ts`. Each task response is:
1. Signed using the client's private key
2. Verified before submission
3. Included in the on-chain response

### Task Response
Task responses are submitted in `src/tasks/submitTask.ts`. The process:
1. Validates the ETH price and task number
2. Prepares the transaction with signatures
3. Submits the response to the contract
4. Confirms the transaction hash

## Development

Build the project:
```bash
npm run build
```

Run in development mode:
```bash
npm run dev
```

## License

ISC

## Learn More

For more information about Based Applications, check out the [SSV Network Based Applications Documentation](https://docs.ssv.network/based-applications/).

## Note

This is an educational example and should not be used in production without proper security considerations and testing.
