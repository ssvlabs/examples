import { run } from './core/client';

const args: string[] = process.argv.slice(2);
const strategyArgIndex: number = args.indexOf('--strategy');
const calculationTypeArgIndex: number = args.indexOf('--calculation_type');
const verboseMode: boolean = args.includes('--verbose');

const strategy: string =
  strategyArgIndex !== -1 && args[strategyArgIndex + 1] ? args[strategyArgIndex + 1] : 'default';
const calculationType: string =
  calculationTypeArgIndex !== -1 && args[calculationTypeArgIndex + 1]
    ? args[calculationTypeArgIndex + 1]
    : 'arithmetic';

// Run the client
run(strategy, calculationType, verboseMode);
