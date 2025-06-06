import * as fs from 'fs';
import { Task } from '../config/types';
import { writeToClient } from '../utils/logger';
import { DIVIDER } from '../config/constants';
import { calculateParticipantsWeightSDK, account } from '../sdk-weights/client';
import { submitTaskResponse } from '../tasks/submitTask';

const logFile: string = 'client.log';

// Function to write only VOTE and TASK_COMPLETE to client.log
async function writeToSharedLog(message: string): Promise<void> {
  if (message.startsWith('VOTE|') || message.startsWith('TASK_COMPLETE|') || 
      message.startsWith('TASK_SUBMITTED|') || message.startsWith('TASK_EXPIRED|')) {
    fs.appendFileSync(logFile, `${message}\n`);
  }
}

// Function to read all votes for a task from the log file
function readVotesFromLog(taskId: string): Map<string, number> {
  const allVotes = new Map<string, number>();
  if (!fs.existsSync(logFile)) return allVotes;

  const content = fs.readFileSync(logFile, 'utf8');
  const lines = content.split('\n');
  for (const line of lines) {
    const voteMatch = line.match(new RegExp(`VOTE\\|${taskId}\\|S(\\d+)\\|([\\d.]+)`));
    if (voteMatch) {
      allVotes.set(voteMatch[1], parseFloat(voteMatch[2]));
    }
  }
  return allVotes;
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
      console.log(`Task [${task.id}] is no longer active`);
      return;
    }

    // Calculate strategy weights from SDK
    const weights = await calculateParticipantsWeightSDK(strategy, calculationType, verboseMode);
    
    // Get the weight for this strategy
    const strategyWeight = weights.get(strategy) || 0;
    
    // Calculate total weight of ALL strategies (not just this one)
    let totalWeight = 0;
    weights.forEach((weight) => {
      totalWeight += weight;
    });

    // Calculate percentage for this strategy based on SDK weights
    // This will be 33% for S19 and 66% for S25
    const strategyPercentage = (strategyWeight / totalWeight) * 100;
    const formattedPercentage = strategyPercentage.toFixed(1);

    // Write vote to shared log file (this will be read by all instances)
    await writeToSharedLog(`VOTE|${task.id}|S${strategy}|${formattedPercentage}`);

    // Read all votes from log file for this task (including our just-written vote)
    const allVotes = readVotesFromLog(task.id);

    // Calculate total percentage from all votes
    let totalPercentage = 0;
    allVotes.forEach((percentage) => {
      totalPercentage += percentage;
    });

    // Display all votes in console (instance-specific)
    console.log('\nCurrent votes for this task:');
    allVotes.forEach((percentage, strategyId) => {
      console.log(`Strategy ${strategyId}: ${percentage.toFixed(1)}%`);
    });
    console.log(`Total: ${totalPercentage.toFixed(1)}%\n`);

    // Check if we have a majority (more than 50% of total weight)
    if (totalPercentage > 50) {
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

        // Get all signatures and signers from votes
        const signatures: string[] = [];
        const signers: string[] = [];

        // Use the account's address derived from the private key
        if (task.signature) {
          signatures.push(task.signature);
          signers.push(account.address);
        }

        // Submit the task response on-chain
        const txHash = await submitTaskResponse(task, task.taskNumber, signatures, signers, strategyId);

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
      console.log(`\nWaiting for more votes... (Current total: ${totalPercentage.toFixed(1)}%)\n`);
    }
  } catch (error) {
    console.error(`Error voting on task: ${error}`);
    throw error;
  }
}
