console.log('ENTRY POINT REACHED: index.ts');
import { run } from './core/client';
import { writeToClient } from './utils/logger';

async function main() {
  try {
    console.log('Starting ETH Price Oracle Client...');
    
    // Parse command line arguments
    const args = process.argv.slice(2);
    const strategyIndex = args.findIndex(arg => arg === '--strategy');
    const calculationTypeIndex = args.findIndex(arg => arg === '--calculation_type');
    const verboseIndex = args.findIndex(arg => arg === '--verbose');

    if (strategyIndex === -1) {
      throw new Error('--strategy argument is required');
    }

    const strategy = args[strategyIndex + 1];
    const calculationType = calculationTypeIndex !== -1 ? args[calculationTypeIndex + 1] : 'arithmetic';
    const verboseMode = verboseIndex !== -1;

    console.log('Configuration:');
    console.log(`- Strategy: ${strategy}`);
    console.log(`- Calculation Type: ${calculationType}`);
    console.log(`- Verbose Mode: ${verboseMode}`);

    await run(strategy, calculationType, verboseMode);
  } catch (error) {
    console.error('Error in main:', error);
    process.exit(1);
  }
}

main().catch(console.error); 