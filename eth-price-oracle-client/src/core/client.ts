import { TITLE_ART, DIVIDER, CONTRACT_ADDRESS } from '../config/constants';
import { writeToClient } from '../utils/logger';
import { startEventListener, setStrategyParams } from './eventListener';
import { account } from '../sdk-weights/client';
import * as fs from 'fs';

const logFile: string = 'client.log';

// Function to monitor the log file for new votes and task events
async function monitorVotes(taskId: string): Promise<void> {
  let lastSize = 0;

  // Initial read of the file
  if (fs.existsSync(logFile)) {
    lastSize = fs.statSync(logFile).size;
  }

  // Set up file watcher
  fs.watch(logFile, async (eventType) => {
    if (eventType === 'change') {
      const currentSize = fs.statSync(logFile).size;
      if (currentSize > lastSize) {
        // Read new content
        const content = fs.readFileSync(logFile, 'utf8');
        const lines = content.split('\n');

        // Process only new lines
        for (let i = lines.length - 1; i >= 0; i--) {
          const line = lines[i];
          if (line.startsWith('VOTE|') && line.includes(taskId)) {
            const voteMatch = line.match(new RegExp(`VOTE\\|${taskId}\\|S(\\d+)\\|([\\d.]+)`));
            if (voteMatch) {
              const strategyId = voteMatch[1];
              const percentage = parseFloat(voteMatch[2]);
              console.log(`\nNew vote detected: Strategy ${strategyId}: ${percentage.toFixed(1)}%`);
            }
          } else if (line.startsWith('TASK_COMPLETE|') && line.includes(taskId)) {
            console.log(`\nTask ${taskId} has reached majority and is complete!`);
          } else if (line.startsWith('TRANSACTION_START|') && line.includes(taskId)) {
            const txMatch = line.match(new RegExp(`TRANSACTION_START\\|${taskId}\\|(\\d+)`));
            if (txMatch) {
              const strategyId = txMatch[1];
              console.log(
                `\nMajority reached! Strategy ${strategyId} will send the transaction.\n`
              );
            }
          } else if (line === DIVIDER) {
            console.log(line);
          } else if (line.startsWith('Task Number: ')) {
            console.log(line);
          } else if (line.startsWith('ETH Price: ')) {
            console.log(line);
          } else if (line.startsWith('Number of Signatures: ')) {
            console.log(line);
          } else if (line.startsWith('Strategy ID: ')) {
            console.log(line);
          } else if (line.startsWith('Transaction submitted: ')) {
            console.log(line);
          } else if (line.startsWith('TASK_SUBMITTED|') && line.includes(taskId)) {
            // Skip this as we already show the transaction details above
            continue;
          } else if (line.startsWith('TASK_EXPIRED|') && line.includes(taskId)) {
            console.log(`\nTask ${taskId} has expired!`);
          }
        }
        lastSize = currentSize;
      }
    }
  });
}

export async function run(
  strategy: string,
  calculationType: string,
  verboseMode: boolean
): Promise<void> {
  let unwatch: (() => void) | null = null;
  try {
    console.clear();
    console.log('\x1b[36m%s\x1b[0m', TITLE_ART);
    console.log('\x1b[33m%s\x1b[0m', DIVIDER);
    console.log('\x1b[32m%s\x1b[0m', '📍 Initializing ETH Price Oracle Client v1.0.0');
    console.log('\x1b[33m%s\x1b[0m', '🔑 Account Address:', account.address);
    if (verboseMode) {
      console.log('\x1b[33m%s\x1b[0m', '📝 Verbose mode enabled');
    }
    console.log('\x1b[33m%s\x1b[0m', DIVIDER);

    await writeToClient(`Local client initialized for Strategy [${strategy}]`, 'success', false);
    await writeToClient(`Connecting to Hoodi network...`, 'status', false);
    await writeToClient(
      `Listening for NewTaskCreated events on contract: ${CONTRACT_ADDRESS}`,
      'status',
      false
    );

    // Set strategy parameters
    setStrategyParams(strategy, calculationType, verboseMode);

    // Start the event listener
    unwatch = await startEventListener();

    // Start monitoring votes for any new tasks
    monitorVotes('*');

    await writeToClient('Client is ready to process on-chain tasks', 'status', true);

    // Simple heartbet log every 10 seconds
    setInterval(() => {
      console.log('[Heartbeat] Client is running and waiting for new tasks...');
    }, 10000);

    // crtl+c handler
    process.on('SIGINT', async () => {
      console.log('\n[DEBUG] SIGINT received!');
      console.log('[Shutdown] Stopping event listener...');
      if (unwatch) unwatch();
      await writeToClient('Shutting down event listener...', 'status', false);
      // delete client.log
      try {
        fs.truncateSync(logFile, 0);
        console.log('[Shutdown] client.log has been emptied.');
      } catch (err) {
        console.error('[Shutdown] Failed to truncate client.log:', err);
      }
      console.log('[DEBUG] Exiting now...');
      process.exit(0);
    });
  } catch (error) {
    await writeToClient(`Error running client: ${error}`, 'error', false);
    throw error;
  }
}
