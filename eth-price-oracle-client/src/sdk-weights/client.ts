import { BasedAppsSDK, chains } from '@ssv-labs/bapps-sdk';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  TOKEN_COEFFICIENTS,
  VALIDATOR_COEFFICIENT,
  BEACON_CHAIN_URL,
  SUBGRAPH_URL,
  BAPP_ID,
} from '../config/constants';
import * as dotenv from 'dotenv';

// Load environment variables for private key only
dotenv.config();

const hoodi = chains.hoodi;
const transport = http();

export const publicClient = createPublicClient({
  chain: hoodi,
  transport,
});

const privateKey = process.env.PRIVATE_KEY;
if (!privateKey) {
  throw new Error('PRIVATE_KEY environment variable is not set');
}

const derivedAddress = privateKeyToAccount(privateKey as `0x${string}`).address;
console.log('Derived address from private key:', derivedAddress);

export const account = privateKeyToAccount(privateKey as `0x${string}`);

export const walletClient = createWalletClient({
  account,
  chain: hoodi,
  transport,
});

export const sdk = new BasedAppsSDK({
  beaconchainUrl: BEACON_CHAIN_URL,
  publicClient,
  walletClient,
  _: {
    subgraphUrl: SUBGRAPH_URL,
  },
});

export async function calculateParticipantsWeightSDK(
  strategy: string,
  calculationType: string,
  verboseMode: boolean
): Promise<Map<string, number>> {
  try {
    const strategyTokenWeights = await sdk.api.getParticipantWeights({
      bAppId: BAPP_ID,
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
