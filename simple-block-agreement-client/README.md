# Block Agreement Client

This is an educational example demonstrating how a Based Application Client could function. The client participates in a block agreement protocol where multiple clients vote on tasks using their strategy weights.

## Overview

The Block Agreement Client demonstrates:

- Distributed task creation and voting
- Strategy-based weight calculation
- Majority-based voting
- Synchronized client coordination

## Installation

1. Clone the repository
2. Navigate to the project directory:

```bash
cd simple-block-agreement-client
```

3. Install dependencies:

```bash
npm install
```

## Usage

To run the client with a specific strategy:

```bash
npm run block-agreement-client -- --strategy 11 --calculation_type arithmetic
```

The default bapp in this example currently has strategies 8, 9, 11 and 12 opted into it, so can these be used.

### Command Line Arguments

- `--strategy`: Your strategy number (required)
- `--calculation_type`: The calculation type you wish to use ( arithmetic | geometric | harmonic ) (required)
- `--verbose`: Enable verbose logging (optional)

## How It Works

1. **Client Initialization**: The first client creates an initial timestamp in the log file
2. **Task Creation**: Every 15 seconds, the first available client creates a new task
3. **Voting Process**: Each client detects new tasks and votes using their strategy weights
4. **Task Completion**: Tasks complete when total weight > 50% or expire after 15 seconds

## Learn More

For more information about Based Applications, check out the [SSV Network Based Applications Documentation](https://docs.ssv.network/based-applications/).

## Note

This is an educational example and should not be used in production without proper security considerations and testing.
