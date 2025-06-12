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

    if (strategyIndex === -1) {
      throw new Error('--strategy argument is required');
    }

    const strategy = args[strategyIndex + 1];
    const calculationType =
      calculationTypeIndex !== -1 ? args[calculationTypeIndex + 1] : 'arithmetic';
    const verboseMode = verboseIndex !== -1;

    // Get private key from environment variable
    const privateKey = process.env.PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('PRIVATE_KEY environment variable is not set');
    }

    console.log('Configuration:');
    console.log(`- Strategy: ${strategy}`);
    console.log(`- Calculation Type: ${calculationType}`);
    console.log(`- Verbose Mode: ${verboseMode}`);

    // Initialize SDK with private key
    initializeSDK(privateKey);

    await run(strategy, calculationType, verboseMode);
  } catch (error) {
    console.error('Error in main:', error);
    process.exit(1);
  }
}

main();
