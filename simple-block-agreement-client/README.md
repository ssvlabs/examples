# Block Agreement Client

A client application for the SSV Network that handles task creation, voting, and agreement processes.

## Project Structure

```
src/
├── config/         # Configuration and types
├── core/           # Core client functionality
├── sdk/            # SDK integration
├── tasks/          # Task management
├── utils/          # Utility functions
└── voting/         # Voting system
```

## Features

- Task creation and management
- Voting system with weight calculation
- Real-time monitoring and logging
- Multiple strategy support
- Configurable calculation types (arithmetic, geometric, harmonic)

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

Run the client with default settings:
```bash
npm run dev
```

Run with specific strategy and calculation type:
```bash
npm run dev -- --strategy 1 --calculation_type arithmetic
```

Enable verbose mode:
```bash
npm run dev -- --verbose
```

## Configuration

The client supports the following command-line arguments:

- `--strategy`: Specify the strategy number (default: "default")
- `--calculation_type`: Set the weight calculation type (arithmetic, geometric, or harmonic)
- `--verbose`: Enable verbose logging

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

## Overview

The Block Agreement Client demonstrates:

- Distributed task creation and voting
- Strategy-based weight calculation
- Majority-based voting
- Synchronized client coordination

## How It Works

1. **Client Initialization**: The first client creates an initial timestamp in the log file
2. **Task Creation**: Every 15 seconds, the first available client creates a new task
3. **Voting Process**: Each client detects new tasks and votes using their strategy weights
4. **Task Completion**: Tasks complete when total weight > 50% or expire after 15 seconds

## Learn More

For more information about Based Applications, check out the [SSV Network Based Applications Documentation](https://docs.ssv.network/based-applications/).

## Note

This is an educational example and should not be used in production without proper security considerations and testing.
