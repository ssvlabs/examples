import { walletClient, publicClient } from '../sdk-weights/client';
import { Task } from '../config/types';
import { CONTRACT_ADDRESS } from '../config/constants';
import { writeToClient, writeToSharedLog } from '../utils/logger';
import { DIVIDER } from '../config/constants';

const respondToTaskABI = [
  {
    inputs: [],
    name: 'AlreadyResponded',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidPrice',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidSignature',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidSigner',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NotOptedIn',
    type: 'error',
  },
  {
    inputs: [],
    name: 'TaskMismatch',
    type: 'error',
  },
  {
    inputs: [
      { internalType: 'bytes32', name: 'taskHash', type: 'bytes32' },
      { internalType: 'uint32', name: 'taskNumber', type: 'uint32' },
      { internalType: 'uint256', name: 'ethPrice', type: 'uint256' },
      { internalType: 'bytes[]', name: 'signatures', type: 'bytes[]' },
      { internalType: 'address[]', name: 'signers', type: 'address[]' },
      { internalType: 'uint32', name: 'strategyId', type: 'uint32' }
    ],
    name: 'respondToTask',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

export async function submitTaskResponse(
  task: Task,
  taskNumber: number,
  signatures: string[],
  signers: string[],
  strategyId: number
): Promise<string> {
  try {
    if (!task.ethPrice) {
      throw new Error('Task does not have an ETH price');
    }

    // Ensure taskNumber is a valid uint32
    if (taskNumber < 0 || taskNumber > 4294967295) {
      throw new Error(`Task number ${taskNumber} is not in valid uint32 range (0 to 4294967295)`);
    }

    // Ensure strategyId is a valid uint32
    if (strategyId < 0 || strategyId > 4294967295) {
      throw new Error(`Strategy ID ${strategyId} is not in valid uint32 range (0 to 4294967295)`);
    }

    // Write transaction details to log file
    await writeToSharedLog(`${DIVIDER}`);
    await writeToSharedLog(`TRANSACTION_START|${task.id}|${strategyId}`);
    await writeToSharedLog(`Task Number: ${taskNumber}`);
    await writeToSharedLog(`ETH Price: $${task.ethPrice}`);
    await writeToSharedLog(`Number of Signatures: ${signatures.length}`);
    await writeToSharedLog(`Strategy ID: ${strategyId}`);

    // Prepare the transaction
    const { request } = await publicClient.simulateContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      abi: respondToTaskABI,
      functionName: 'respondToTask',
      args: [
        task.id as `0x${string}`,
        taskNumber,
        BigInt(task.ethPrice),
        signatures as `0x${string}`[],
        signers as `0x${string}`[],
        strategyId
      ],
      account: walletClient.account,
    });

    // Send the transaction
    const hash = await walletClient.writeContract(request);

    await writeToSharedLog(`Transaction submitted: ${hash}`);
    await writeToSharedLog(`${DIVIDER}`);

    return hash;
  } catch (error) {
    await writeToClient(`Error submitting task response: ${error}`, 'error', true);
    throw error;
  }
}
