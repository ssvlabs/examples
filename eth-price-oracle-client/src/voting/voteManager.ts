import * as fs from 'fs';
import { Task } from '../config/types';
import { calculateParticipantsWeightSDK, account } from '../sdk-weights/client';
import { submitTaskResponse } from '../tasks/submitTask';
import { signTaskResponse } from '../utils/signing';
import { fetchSlot } from '../utils/slot';

const logFile: string = 'client.log';

// Function to write only VOTE and TASK_COMPLETE to client.log
async function writeToSharedLog(message: string): Promise<void> {
  if (
    message.startsWith('VOTE|') ||
    message.startsWith('TASK_COMPLETE|') ||
    message.startsWith('TASK_SUBMITTED|') ||
    message.startsWith('TASK_EXPIRED|') ||
    message.startsWith('SIGNATURE|')
  ) {
    fs.appendFileSync(logFile, `${message}\n`);
  }
}

// Function to read votes from log file
function readVotesFromLog(taskId: string): Map<string, number> {
  const votes = new Map<string, number>();
  if (!fs.existsSync(logFile)) return votes;

  const content = fs.readFileSync(logFile, 'utf8');
  const lines = content.split('\n');

  for (const line of lines) {
    const voteMatch = line.match(new RegExp(`VOTE\\|${taskId}\\|S(\\d+)\\|([\\d.]+)`));
    if (voteMatch) {
      const strategyId = voteMatch[1];
      const percentage = parseFloat(voteMatch[2]);
      votes.set(strategyId, percentage);
    }
  }

  return votes;
}

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
      await writeToSharedLog(`Task [${task.id}] is no longer active`);
      return;
    }

    // Get current slot number
    const currentSlot = await fetchSlot();
    await writeToSharedLog(`Current slot number: [${currentSlot}]`);

    // Calculate strategy weights from SDK
    const weights = await calculateParticipantsWeightSDK(strategy, calculationType, verboseMode);
    const strategyWeight = weights.get(strategy) || 0;
    const currentStrategyWeight = Math.floor(strategyWeight * 100);

    // Sign the task response if we have an ETH price
    if (task.ethPrice) {
      const signature = await signTaskResponse(task.taskNumber, task.ethPrice);
      // Save signature and signer to log file
      await writeToSharedLog(`SIGNATURE|${task.id}|${strategy}|${signature}|${account.address}`);
    }

    await writeToSharedLog(`Strategy ${strategy} submitting vote for task [${task.id}]`);
    await writeToSharedLog(`VOTE|${task.id}|S${strategy}|${currentStrategyWeight}|${currentSlot}`);
    await writeToSharedLog(
      `Strategy ${strategy} submitted vote: ${currentStrategyWeight}% for slot [${currentSlot}]`
    );

    // Wait briefly to allow other votes to be recorded
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Read all votes from the log file
    const allVotes = readVotesFromLog(task.id);
    let totalWeight = 0;
    allVotes.forEach((weight) => {
      totalWeight += weight;
    });

    // Check if task was completed while we were calculating
    const updatedContent = fs.readFileSync(logFile, 'utf8');
    if (
      updatedContent.includes(`TASK_COMPLETE|${task.id}`) ||
      updatedContent.includes(`TASK_EXPIRED|${task.id}`)
    ) {
      return;
    }

    // Display all votes in console (instance-specific)
    console.log('\nCurrent votes for this task:');
    allVotes.forEach((percentage, strategyId) => {
      console.log(`Strategy ${strategyId}: ${percentage.toFixed(1)}%`);
    });
    console.log(`Total: ${totalWeight.toFixed(1)}%\n`);

    // Check if we have a majority (more than 50% of total weight)
    if (totalWeight > 50) {
      // Check if this task has already been completed
      if (content.includes(`TASK_COMPLETE|${task.id}`)) {
        console.log(`Task [${task.id}] has already been completed`);
        return;
      }

      // Write completion to shared log file
      await writeToSharedLog(`TASK_COMPLETE|${task.id}`);

      // Check if this is the last vote that pushed us over 50%
      const isLastVote = strategy === Array.from(allVotes.keys()).pop();
      if (isLastVote) {
        // Extract strategy ID from the strategy string (e.g., "S19" -> 19)
        const strategyId = parseInt(strategy.replace('S', ''));
        console.log(`\nMajority reached! Strategy ${strategyId} will send the transaction.\n`);

        // Get all signatures and signers from the log file
        const signatures: string[] = [];
        const signers: string[] = [];
        const strategyIds: number[] = [];

        // Read all signature entries from the log file
        const content = fs.readFileSync(logFile, 'utf8');
        const lines = content.split('\n');

        for (const line of lines) {
          if (line.startsWith('SIGNATURE|')) {
            const [, taskId, strategyStr, signature, signer] = line.split('|');
            if (taskId === task.id) {
              const sigStrategyId = parseInt(strategyStr.replace('S', ''));
              signatures.push(signature);
              signers.push(signer);
              strategyIds.push(sigStrategyId);
            }
          }
        }

        console.log(`Found ${signatures.length} signatures for task ${task.id}`);
        signatures.forEach((sig, i) => {
          console.log(`Signature ${i + 1}: ${sig}`);
          console.log(`Signer ${i + 1}: ${signers[i]}`);
          console.log(`Strategy ID ${i + 1}: ${strategyIds[i]}`);
        });

        // Submit the task response on-chain with all signatures and signers
        const txHash = await submitTaskResponse(
          task,
          task.taskNumber,
          signatures,
          signers,
          strategyIds
        );

        // Write transaction submission to shared log file
        await writeToSharedLog(`TASK_SUBMITTED|${task.id}|${txHash}|${strategyId}`);

        console.log(`Transaction submitted: ${txHash}\n`);
      } else {
        // Find the strategy that will send the transaction
        const lastStrategy = Array.from(allVotes.keys()).pop();
        const lastStrategyId = lastStrategy ? parseInt(lastStrategy.replace('S', '')) : null;
        console.log(`\nMajority reached! Strategy ${lastStrategyId} will send the transaction.\n`);
      }
    } else {
      console.log(`\nWaiting for more votes... (Current total: ${totalWeight.toFixed(1)}%)\n`);
    }
  } catch (error) {
    console.error(`Error voting on task: ${error}`);
    throw error;
  }
}
