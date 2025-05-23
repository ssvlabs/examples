import { keccak256, encodePacked } from 'viem';
import { account } from '../sdk-weights/client';
import { writeToClient } from './logger';

export async function signTaskResponse(taskNumber: number, ethPrice: number): Promise<string> {
  // Create the message that will be signed (task num + price)
  // Match exactly what the contract does: keccak256(abi.encodePacked(taskNumber, ethPrice))
  const messageHash = keccak256(
    encodePacked(['uint32', 'uint256'], [taskNumber, BigInt(ethPrice)])
  );

  // Log the message hash for debugging
  await writeToClient(`Message Hash: ${messageHash}`, 'info', true);
  await writeToClient(`Task Number: ${taskNumber}`, 'info', true);
  await writeToClient(`ETH Price: ${ethPrice}`, 'info', true);

  // Sign the raw message hash directly without any prefix
  const signature = await account.sign({
    hash: messageHash,
  });

  // Log the signature for debugging
  await writeToClient(`Signature: ${signature}`, 'info', true);
  await writeToClient(`Signer Address: ${account.address}`, 'info', true);

  return signature;
}
