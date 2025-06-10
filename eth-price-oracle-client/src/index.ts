console.log('ENTRY POINT REACHED: index.ts');
import { run } from './core/client';
import { initializeSDK } from './sdk-weights/client';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  try {
    console.log('Starting ETH Price Oracle Client...');

    // Parse command line arguments
    const args = process.argv.slice(2);
    const strategyIndex = args.findIndex((arg) => arg === '--strategy');
    const calculationTypeIndex = args.findIndex((arg) => arg === '--calculation_type');
    const verboseIndex = args.findIndex((arg) => arg === '--verbose');
    const keyNumberIndex = args.findIndex((arg) => arg === '--key_number');

    if (strategyIndex === -1) {
      throw new Error('--strategy argument is required');
    }

    if (keyNumberIndex === -1) {
      throw new Error('--key_number argument is required');
    }

    const strategy = args[strategyIndex + 1];
    const calculationType =
      calculationTypeIndex !== -1 ? args[calculationTypeIndex + 1] : 'arithmetic';
    const verboseMode = verboseIndex !== -1;
    const keyNumber = parseInt(args[keyNumberIndex + 1]);

    // Get private key from environment variables
    const privateKey = process.env[`PRIVATE_KEY_${keyNumber}`];
    if (!privateKey) {
      throw new Error(`PRIVATE_KEY_${keyNumber} not found in .env file`);
    }

    console.log('Configuration:');
    console.log(`- Strategy: ${strategy}`);
    console.log(`- Calculation Type: ${calculationType}`);
    console.log(`- Verbose Mode: ${verboseMode}`);
    console.log(`- Using Key Number: ${keyNumber}`);

    // Initialize SDK with private key
    initializeSDK(privateKey);

    await run(strategy, calculationType, verboseMode);
  } catch (error) {
    console.error('Error in main:', error);
    process.exit(1);
  }
}

main();
