import * as fs from 'fs';
import { Task } from '../config/types';
import { DIVIDER } from '../config/constants';
import { writeToClient } from '../utils/logger';
import { getCurrentEthPrice } from '../utils/price';
import { signTaskResponse } from '../utils/signing';

const logFile: string = 'client.log';

export async function getCurrentTask(): Promise<Task | null> {
  if (!fs.existsSync(logFile)) return null;

  const content = fs.readFileSync(logFile, 'utf8');
  const lines = content.split('\n').reverse(); // Read from bottom to get most recent task

  let taskStatus: Task['status'] = 'pending';
  let taskId: string | null = null;
  let taskTimestamp: string | null = null;
  let taskNumber: number = 0;

  // Find most recent task start
  for (const line of lines) {
    const startMatch = line.match(/TASK_START\|(\w+)\|(\d+)\|pending/);
    if (startMatch) {
      taskId = startMatch[1];
      taskTimestamp = startMatch[2];
      // Extract task number from the task ID
      taskNumber = parseInt(taskId, 16);
      break;
    }
  }

  if (!taskId || !taskTimestamp) return null;

  // Check if task was completed or expired
  for (const line of lines) {
    if (line.includes(`TASK_COMPLETE|${taskId}`)) {
      taskStatus = 'completed';
      break;
    }
    if (line.includes(`TASK_EXPIRED|${taskId}`)) {
      taskStatus = 'expired';
      break;
    }
  }

  // Get votes for this task
  const votes = new Map<string, number>();
  for (const line of lines) {
    const voteMatch = line.match(new RegExp(`VOTE\\|${taskId}\\|S(\\d+)\\|(\\d+)`));
    if (voteMatch) {
      votes.set(voteMatch[1], parseInt(voteMatch[2]));
    }
  }

  return {
    id: taskId,
    timestamp: parseInt(taskTimestamp),
    status: taskStatus,
    votes,
    taskNumber
  };
}

export async function createTaskFromEvent(taskIndex: bigint, taskHash: string): Promise<Task> {
  const task: Task = {
    id: taskHash,
    status: 'pending',
    timestamp: Date.now(),
    votes: new Map<string, number>(),
    taskNumber: Number(taskIndex)
  };

  try {
    // Get current ETH price
    const ethPrice = await getCurrentEthPrice();
    task.ethPrice = ethPrice;

    // Sign the task response
    const signature = await signTaskResponse(Number(taskIndex), ethPrice);
    task.signature = signature;

    await writeToClient(`${DIVIDER}`, 'info', true);
    await writeToClient(`New on-chain task detected:`, 'status', true);
    await writeToClient(`Task Index: ${taskIndex}`, 'info', true);
    await writeToClient(`Task Hash: ${taskHash}`, 'info', true);
    await writeToClient(`Current ETH Price: $${ethPrice}`, 'info', true);
    await writeToClient(`Status: Waiting for votes...`, 'info', true);
    await writeToClient(`${DIVIDER}`, 'info', true);
  } catch (error) {
    await writeToClient(`Error creating task: ${error}`, 'error', true);
    throw error;
  }

  return task;
} 