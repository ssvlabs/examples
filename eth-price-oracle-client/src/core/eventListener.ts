import { publicClient } from '../sdk-weights/client';
import { writeToClient } from '../utils/logger';
import { DIVIDER } from '../config/constants';
import { createTaskFromEvent } from '../tasks/taskManager';
import { voteOnTask } from '../voting/voteManager';

const CONTRACT_ADDRESS = '0x2224E61A609E850E67bC73997c2d7633FC18238B';

const NEW_TASK_CREATED_EVENT = {
  type: 'event',
  name: 'NewTaskCreated',
  inputs: [
    { type: 'uint32', name: 'taskIndex', indexed: true },
    { type: 'bytes32', name: 'taskHash', indexed: false }
  ]
} as const;

let currentStrategy: string = '';
let currentCalculationType: string = '';
let currentVerboseMode: boolean = false;

export function setStrategyParams(strategy: string, calculationType: string, verboseMode: boolean) {
  currentStrategy = strategy;
  currentCalculationType = calculationType;
  currentVerboseMode = verboseMode;
}

export async function startEventListener() {
  try {
    await writeToClient(`${DIVIDER}`, 'info', true);
    await writeToClient('Starting event listener for NewTaskCreated events...', 'status', true);
    await writeToClient(`${DIVIDER}`, 'info', true);

    // use viem to listen for event
    const unwatch = publicClient.watchEvent({
      address: CONTRACT_ADDRESS,
      event: NEW_TASK_CREATED_EVENT,
      onLogs: (logs) => {
        logs.forEach((log) => {
          const { taskIndex, taskHash } = log.args;
          if (taskIndex !== undefined && taskHash) {
            handleNewTask(BigInt(taskIndex), taskHash);
          }
        });
      },
    });

    return unwatch;
  } catch (error) {
    await writeToClient(`Error starting event listener: ${error}`, 'error', false);
    throw error;
  }
}

async function handleNewTask(taskIndex: bigint, taskHash: string) {
  try {
    const task = await createTaskFromEvent(taskIndex, taskHash);
    if (currentStrategy) {
      await voteOnTask(task, currentStrategy, currentCalculationType, currentVerboseMode);
    }
  } catch (error) {
    await writeToClient(`Error handling new task: ${error}`, 'error', false);
  }
} 