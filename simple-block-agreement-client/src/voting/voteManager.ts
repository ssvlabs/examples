import * as fs from 'fs';
import { Task } from '../config/types';
import { writeToClient } from '../utils/logger';
import { calculateParticipantsWeightSDK } from '../sdk-weights/client';

const logFile: string = 'client.log';

export async function fetchSlot(): Promise<number> {
  try {
    // TODO: Implement actual slot fetching
    return 1;
  } catch (error) {
    console.error('Error fetching slot number:', error);
    return 0;
  }
}

export async function voteOnTask(
  task: Task,
  strategy: string,
  calculationType: string,
  verboseMode: boolean
): Promise<void> {
  // First check if task is already completed
  const content = fs.readFileSync(logFile, 'utf8');
  if (content.includes(`TASK_COMPLETE|${task.id}`) || content.includes(`TASK_EXPIRED|${task.id}`)) {
    await writeToClient(`Task [${task.id}] is no longer active`, 'warning', false);
    return;
  }

  // Get current slot number
  const currentSlot = await fetchSlot();
  await writeToClient(`Current slot number: [${currentSlot}]`, 'status', false);

  const weights = await calculateParticipantsWeightSDK(strategy, calculationType, verboseMode);
  const strategyWeight = weights.get(strategy) || 0;
  const currentStrategyWeight = Math.floor(strategyWeight * 100);

  await writeToClient(
    `Strategy ${strategy} submitting vote for task [${task.id}]`,
    'status',
    false
  );
  await writeToClient(
    `VOTE|${task.id}|S${strategy}|${currentStrategyWeight}|${currentSlot}`,
    'info',
    true
  );
  await writeToClient(
    `Strategy ${strategy} submitted vote: ${currentStrategyWeight}% for slot [${currentSlot}]`,
    'success',
    true
  );

  // Wait briefly to allow other votes to be recorded
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Read all votes from the log file
  const updatedContent = fs.readFileSync(logFile, 'utf8');
  const voteMatches = Array.from(
    updatedContent.matchAll(new RegExp(`VOTE\\|${task.id}\\|S\\d+\\|(\\d+)\\|(\\d+)`, 'g'))
  );
  const totalWeight = voteMatches.reduce((sum: number, match: RegExpMatchArray) => sum + parseInt(match[1], 10), 0);

  // Check if task was completed while we were calculating
  if (
    updatedContent.includes(`TASK_COMPLETE|${task.id}`) ||
    updatedContent.includes(`TASK_EXPIRED|${task.id}`)
  ) {
    return;
  }

  if (totalWeight > 50) {
    // Only proceed if no completion message exists yet
    if (!updatedContent.includes(`TASK_COMPLETE|${task.id}`)) {
      const messages = [
        `Task Completed Successfully`,
        `Task ID: ${task.id}`,
        `Total Weight: ${totalWeight}%`,
        `Final Slot Number: ${currentSlot}`,
        `TASK_COMPLETE|${task.id}`,
      ];

      // Write all messages in sequence
      for (const message of messages) {
        await writeToClient(message, message.includes('TASK_COMPLETE') ? 'success' : 'info', true);
      }

      // Wait 2 seconds before showing monitoring message
      await new Promise((resolve) => setTimeout(resolve, 2000));
      await writeToClient(`Waiting for user to submit task...`, 'status', false);
    }
  } else {
    const remainingWeight = 50 - totalWeight;
    await writeToClient(`Waiting for more votes...`, 'status', false);
    await writeToClient(`Current Progress: ${totalWeight}% / 50%`, 'info', false);
    await writeToClient(`Need ${remainingWeight}% more for majority`, 'info', false);
  }
} 