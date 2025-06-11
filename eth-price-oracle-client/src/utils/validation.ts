import { isAddress } from 'viem';

export function getBappAddress(): `0x${string}` {
  const address = process.env.BAPP_ADDRESS;
  if (!address) {
    throw new Error('BAPP_ADDRESS environment variable is not set');
  }
  if (!isAddress(address)) {
    throw new Error('BAPP_ADDRESS is not a valid Ethereum address');
  }
  return address as `0x${string}`;
} 