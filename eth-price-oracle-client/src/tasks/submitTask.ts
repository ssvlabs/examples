import { walletClient, publicClient } from '../sdk-weights/client';
import { Task } from '../config/types';
import { CONTRACT_ADDRESS } from '../config/constants';
import { writeToClient } from '../utils/logger';
import { DIVIDER } from '../config/constants';

const respondToTaskABI = [
  {
    "inputs": [],
    "name": "AlreadyResponded",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidPrice",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidSignature",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "InvalidSigner",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "NotOptedIn",
    "type": "error"
  },
  {
    "inputs": [],
    "name": "TaskMismatch",
    "type": "error"
  },
  {
    "inputs": [
      { "internalType": "bytes32", "name": "taskHash", "type": "bytes32" },
      { "internalType": "uint32", "name": "taskNumber", "type": "uint32" },
      { "internalType": "uint256", "name": "ethPrice", "type": "uint256" },
      { "internalType": "bytes[]", "name": "signatures", "type": "bytes[]" },
      { "internalType": "address[]", "name": "signers", "type": "address[]" }
    ],
    "name": "respondToTask",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export async function submitTaskResponse(
  task: Task,
  taskNumber: number,
  signatures: string[],
  signers: string[]
): Promise<string> {
  try {
    if (!task.ethPrice) {
      throw new Error('Task does not have an ETH price');
    }

    // Ensure taskNumber is a valid uint32
    if (taskNumber < 0 || taskNumber > 4294967295) {
      throw new Error(`Task number ${taskNumber} is not in valid uint32 range (0 to 4294967295)`);
    }

    await writeToClient(`${DIVIDER}`, 'info', true);
    await writeToClient('Submitting task response on-chain...', 'status', true);
    await writeToClient(`Task Number: ${taskNumber}`, 'info', true);
    await writeToClient(`ETH Price: $${task.ethPrice}`, 'info', true);
    await writeToClient(`Number of Signatures: ${signatures.length}`, 'info', true);

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
        signers as `0x${string}`[]
      ],
      account: walletClient.account
    });

    // Send the transaction
    const hash = await walletClient.writeContract(request);
    
    await writeToClient(`Transaction submitted: ${hash}`, 'success', true);
    await writeToClient(`${DIVIDER}`, 'info', true);

    return hash;
  } catch (error) {
    await writeToClient(`Error submitting task response: ${error}`, 'error', true);
    throw error;
  }
} 