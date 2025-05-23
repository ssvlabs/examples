import { BasedAppsSDK, chains } from '@ssv-labs/bapps-sdk';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { TOKEN_COEFFICIENTS, VALIDATOR_COEFFICIENT } from '../config/constants';

const hoodi = chains.hoodi;
const transport = http();

export const publicClient = createPublicClient({
  chain: hoodi,
  transport,
});

export const account = privateKeyToAccount(
  '0x0000000000000000000000000000000000000000000000000000000000000000'
);

export const walletClient = createWalletClient({
  account,
  chain: hoodi,
  transport,
});

export const sdk = new BasedAppsSDK({
  beaconchainUrl: 'https://eth-beacon-chain-hoodi.drpc.org/rest/',
  publicClient,
  walletClient,
  _: {
    subgraphUrl:
      'https://api.studio.thegraph.com/query/71118/ssv-network-hoodi-stage/version/latest',
  },
});

export async function calculateParticipantsWeightSDK(strategy: string, calculationType: string, verboseMode: boolean): Promise<Map<string, number>> {
  try {
    const strategyTokenWeights = await sdk.api.getParticipantWeights({
      bAppId: '0xbc8e0973fE8898716Df33C15C26ea74D032Df98a',
    });

    const weightCalculationOptions = {
      coefficients: TOKEN_COEFFICIENTS,
      validatorCoefficient: VALIDATOR_COEFFICIENT,
    };

    if (verboseMode) {
      console.log('Strategy Token Weights:');
      console.log(JSON.stringify(strategyTokenWeights, null, 2));
    }

    let strategyWeights;
    switch (calculationType.toLowerCase()) {
      case 'geometric':
        strategyWeights = sdk.utils.calcGeometricStrategyWeights(
          strategyTokenWeights,
          weightCalculationOptions
        );
        break;
      case 'harmonic':
        strategyWeights = sdk.utils.calcHarmonicStrategyWeights(
          strategyTokenWeights,
          weightCalculationOptions
        );
        break;
      case 'arithmetic':
      default:
        strategyWeights = sdk.utils.calcArithmeticStrategyWeights(
          strategyTokenWeights,
          weightCalculationOptions
        );
    }

    const strategyWeight = strategyWeights.get(strategy);

    return new Map([[strategy, Number(strategyWeight)]]);
  } catch (error) {
    console.error('Error in calculateParticipantsWeightSDK:', error);
    return new Map([[strategy, 0]]);
  }
} 