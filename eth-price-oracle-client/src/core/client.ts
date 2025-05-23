import { exec } from 'child_process';
import { TITLE_ART, DIVIDER, CONTRACT_ADDRESS } from '../config/constants';
import { writeToClient } from '../utils/logger';
import { startEventListener, setStrategyParams } from './eventListener';
import { account } from '../sdk-weights/client';
import * as fs from 'fs';

const logFile: string = 'client.log';

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
    await writeToClient(`Listening for NewTaskCreated events on contract: ${CONTRACT_ADDRESS}`, 'status', false);

    // Set strategy parameters
    setStrategyParams(strategy, calculationType, verboseMode);

    // Start the event listener
    unwatch = await startEventListener();
    
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