import * as fs from 'fs';
import { Task } from '../config/types';
import { writeToClient } from '../utils/logger';
import { DIVIDER } from '../config/constants';
import { calculateParticipantsWeightSDK, account } from '../sdk-weights/client';
import { submitTaskResponse } from '../tasks/submitTask';

const logFile: string = 'client.log';

export async function voteOnTask(
  task: Task,
  strategy: string,
  calculationType: string,
  verboseMode: boolean
): Promise<void> {
  try {
    // First check if task is already completed
    const content = fs.readFileSync(logFile, 'utf8');
    if (
      content.includes(`TASK_COMPLETE|${task.id}`) ||
      content.includes(`TASK_EXPIRED|${task.id}`)
    ) {
      await writeToClient(`Task [${task.id}] is no longer active`, 'warning', false);
      return;
    }

    // Calculate strategy weights
    const weights = await calculateParticipantsWeightSDK(strategy, calculationType, verboseMode);
    const strategyWeight = weights.get(strategy) || 0;

    // Add vote to task
    task.votes.set(strategy, strategyWeight);

    // Calculate total weight of all votes
    let totalWeight = 0;
    task.votes.forEach((weight) => {
      totalWeight += weight;
    });

    // Check if we have a majority (more than 50% of total weight)
    if (strategyWeight > totalWeight / 2) {
      await writeToClient(`${DIVIDER}`, 'info', true);
      await writeToClient('Majority vote reached!', 'success', true);
      await writeToClient(
        `Strategy ${strategy} has majority with ${strategyWeight} weight`,
        'info',
        true
      );

      // Get all signatures and signers from votes
      const signatures: string[] = [];
      const signers: string[] = [];

      // Use the account's address derived from the private key
      if (task.signature) {
        signatures.push(task.signature);
        signers.push(account.address);
      }

      // Submit the task response on-chain
      const txHash = await submitTaskResponse(task, task.taskNumber, signatures, signers);

      await writeToClient(`Task response submitted in transaction: ${txHash}`, 'success', true);
      await writeToClient(`${DIVIDER}`, 'info', true);
    } else {
      await writeToClient(
        `Vote recorded for strategy ${strategy} with weight ${strategyWeight}`,
        'info',
        true
      );
    }
  } catch (error) {
    await writeToClient(`Error voting on task: ${error}`, 'error', true);
    throw error;
  }
}
