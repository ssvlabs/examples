/**
 * Block Agreement Client
 *
 * Overall Flow:
 * 1. Client Initialization:
 *    - run() -> Initialize system and start monitorTasks()
 *    - First client creates initial timestamp in log file
 *
 * 2. Task Creation Cycle (Every 15 seconds):
 *    - monitorTasks() checks if it's time for new task
 *    - First available client creates task using createNewTask()
 *    - Task gets unique 4-character ID and pending status
 *
 * 3. Voting Process:
 *    - Each client detects new task through monitorTasks()
 *    - Clients vote using voteOnTask() if they haven't voted
 *    - Votes are recorded with strategy weights
 *    - Total weight calculated from all recorded votes
 *
 * 4. Task Completion:
 *    - Task completes if total weight > 50%
 *    - Task expires if no majority after 15 seconds
 *    - System returns to monitoring state
 */

import * as fs from 'fs';
import { exec } from 'child_process';
import { BasedAppsSDK, chains } from '@ssv-labs/bapps-sdk';
import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const args: string[] = process.argv.slice(2);
const strategyArgIndex: number = args.indexOf('--strategy');
const calculationTypeArgIndex: number = args.indexOf('--calculation_type');
const verboseMode: boolean = args.includes('--verbose');
const strategy: string =
  strategyArgIndex !== -1 && args[strategyArgIndex + 1] ? args[strategyArgIndex + 1] : 'default';
const calculationType: string =
  calculationTypeArgIndex !== -1 && args[calculationTypeArgIndex + 1]
    ? args[calculationTypeArgIndex + 1]
    : 'arithmetic';

const logFile: string = 'client.log';
const lockFile: string = 'client.lock';

// client config
const TASK_INTERVAL = 15000; // Time between tasks
const INITIAL_WAIT = 5000; // Initial monitoring period
const DEBUG_INTERVAL = 2000; // Interval for monitoring messages
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

const hoodi = chains.hoodi;

const transport = http();

const publicClient = createPublicClient({
  chain: hoodi,
  transport,
});

const account = privateKeyToAccount(
  '0xa3f73db07859670fa5f7de20ce77d6ef872934f8a3fb978841321125dd31b392'
);
const walletClient = createWalletClient({
  account,
  chain: hoodi,
  transport,
});

const sdk = new BasedAppsSDK({
  beaconchainUrl: 'https://eth-beacon-chain-hoodi.drpc.org/rest/',
  publicClient,
  walletClient,
  _: {
    subgraphUrl:
      'https://api.studio.thegraph.com/query/71118/ssv-network-hoodi-stage/version/latest',
  },
});

// Add these constants at the top with other constants
const TITLE_ART = `
██████╗  █████╗ ██████╗ ██████╗     ██████╗██╗     ██╗███████╗███╗   ██╗████████╗
██╔══██╗██╔══██╗██╔══██╗██╔══██╗   ██╔════╝██║     ██║██╔════╝████╗  ██║╚══██╔══╝
██████╔╝███████║██████╔╝██████╔╝   ██║     ██║     ██║█████╗  ██╔██╗ ██║   ██║   
██╔══██╗██╔══██║██╔═══╝ ██╔═══╝    ██║     ██║     ██║██╔══╝  ██║╚██╗██║   ██║   
██████╔╝██║  ██║██║     ██║        ╚██████╗███████╗██║███████╗██║ ╚████║   ██║   
╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝         ╚═════╝╚══════╝╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝   
`;

const DIVIDER = '════════════════════════════════════════════════════════════════════════════════';

// simulate fetching slot number
async function fetchSlot(): Promise<number> {
  try {
    /*
        const response = await fetch('https://holesky.beaconcha.in/api/v1/epoch/latest');
        const data = await response.json();
        if (!data || !data.data || !data.data.epoch) {
            console.error('Invalid response structure:', data);
            return 0;
        }
        // Each epoch has 32 slots, so we'll use the epoch number * 32 as the slot number
        return data.data.epoch * 32;
        */
    return 1;
  } catch (error) {
    console.error('Error fetching slot number:', error);
    return 0;
  }
}

async function logToConsole(
  message: string,
  type: 'info' | 'success' | 'error' | 'warning' | 'status' = 'info'
): Promise<void> {
  const timestamp = new Date().toLocaleTimeString();
  let color = '';
  let prefix = '';

  switch (type) {
    case 'success':
      color = '\x1b[32m'; // Green
      prefix = '✅ ';
      break;
    case 'error':
      color = '\x1b[31m'; // Red
      prefix = '❌ ';
      break;
    case 'warning':
      color = '\x1b[33m'; // Yellow
      prefix = '⚠️ ';
      break;
    case 'status':
      color = '\x1b[36m'; // Cyan
      prefix = '📊 ';
      break;
    default:
      color = '\x1b[37m'; // White
      prefix = '📡 ';
  }

  console.log(`${color}[${timestamp}] ${prefix}${message}\x1b[0m`);
}

/**
 * Client Message Output
 * Handles formatted logging to both console and file
 * Supports different message types and formatting
 */
async function writeToClient(
  message: string,
  type: 'info' | 'success' | 'error' | 'warning' | 'status' = 'info',
  logToFile: boolean = true
): Promise<void> {
  const timestamp = new Date().toLocaleTimeString();
  let prefix = '';

  switch (type) {
    case 'success':
      prefix = '✅ ';
      break;
    case 'error':
      prefix = '❌ ';
      break;
    case 'warning':
      prefix = '⚠️ ';
      break;
    case 'status':
      prefix = '📊 ';
      break;
    default:
      prefix = '📡 ';
  }

  // Add strategy identifier to each message
  const strategyPrefix = `[S${strategy}] `;

  // Only write to file if logToFile is true
  if (logToFile) {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        fs.appendFileSync(logFile, `[${timestamp}] ${prefix}${strategyPrefix}${message}\n`);
        resolve(undefined);
      }, 750);
    });
  }

  // Log to console only with strategy identifier
  await logToConsole(`${strategyPrefix}${message}`, type);
  return Promise.resolve();
}

export async function calculateParticipantsWeightSDK(): Promise<Map<string, number>> {
  try {
    const tokenCoefficient: Array<{ token: `0x${string}`; coefficient: number }> = [
      {
        token: '0x9F5d4Ec84fC4785788aB44F9de973cF34F7A038e' as `0x${string}`,
        coefficient: 200,
      },
      {
        token: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee' as `0x${string}`,
        coefficient: 220,
      },
    ] as const;
    const validatorCoefficient = 100;

    const strategyTokenWeights = await sdk.api.getParticipantWeights({
      bAppId: '0xbc8e0973fE8898716Df33C15C26ea74D032Df98a',
    });

    const weightCalculationOptions = {
      coefficients: tokenCoefficient,
      validatorCoefficient: validatorCoefficient,
    };

    if (verboseMode) {
      console.log(DIVIDER);
      console.log('Strategy Token Weights:');
      console.log(JSON.stringify(strategyTokenWeights, null, 2));
      console.log(DIVIDER);
    }

    let strategyWeights;
    switch (calculationType.toLowerCase()) {
      case 'geometric':
        strategyWeights = sdk.utils.calcGeometricStrategyWeights(
          strategyTokenWeights,
          weightCalculationOptions
        );
        break;
      case 'harmonic':
        strategyWeights = sdk.utils.calcHarmonicStrategyWeights(
          strategyTokenWeights,
          weightCalculationOptions
        );
        break;
      case 'arithmetic':
      default:
        strategyWeights = sdk.utils.calcArithmeticStrategyWeights(
          strategyTokenWeights,
          weightCalculationOptions
        );
    }

    const strategyWeight = strategyWeights.get(strategy);

    return new Map([[strategy, Number(strategyWeight)]]);
  } catch (error) {
    console.error('Error in calculateParticipantsWeightSDK:', error);
    return new Map([[strategy, 0]]);
  }
}

/**
 * Task Interface
 * Represents a single task in the system with its current state and votes
 */
interface Task {
  id: string; // Unique 4-character identifier
  timestamp: number; // Creation time
  slotNumber?: number; // Optional slot number for task
  status: 'pending' | 'active' | 'expired' | 'completed';
  votes: Map<string, number>; // Strategy -> Weight mapping
}

/**
 * Task ID Generation
 * Creates random 4-character identifier for new tasks
 * Uses alphanumeric characters from CHARS constant
 */
function generateTaskId(): string {
  return Array.from({ length: 4 }, () => CHARS.charAt(Math.random() * CHARS.length)).join('');
}

/**
 * System Initialization Timestamp
 * Either retrieves existing timestamp or creates new one
 * Used to synchronize task creation across all clients
 */
async function getOrCreateFirstTimestamp(): Promise<number> {
  if (!fs.existsSync(logFile)) {
    const timestamp = Date.now();
    return timestamp;
  }

  const content = fs.readFileSync(logFile, 'utf8');
  const match = content.match(/System initialized at timestamp: (\d+)/);
  if (!match) {
    const timestamp = Date.now();
    return timestamp;
  }
  return parseInt(match[1]);
}

/**
 * Task Timing Check
 * Determines if it's time to create a new task based on
 * system's first timestamp and task interval
 */
function isTimeForNewTask(firstTimestamp: number): boolean {
  const elapsed = Date.now() - firstTimestamp;
  const timeInCycle = elapsed % TASK_INTERVAL;

  // Clean up any stale lock file
  if (fs.existsSync(lockFile)) {
    try {
      fs.unlinkSync(lockFile);
    } catch (error) {
      console.error('Error cleaning up stale lock:', error);
    }
  }

  return timeInCycle < 1000;
}

// Add this helper function to generate random Ethereum addresses
function generateRandomAddress(): string {
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

/**
 * Main monitoring loop
 * Continuously checks for new tasks and manages task lifecycle
 * - Handles initial 5-second monitoring period
 * - Creates new tasks at 15-second intervals
 * - Processes votes for current task
 * - Manages task expiration and completion
 */
async function monitorTasks(): Promise<void> {
  const firstTimestamp = await getOrCreateFirstTimestamp();
  let lastProcessedTaskId: string | null = null;
  let lastDebugTime = 0;
  const lastTaskCompletionTime = 0;

  // Initial 5-second monitoring period
  const startTime = Date.now();
  while (Date.now() - startTime < INITIAL_WAIT) {
    await writeToClient(`Waiting for user to submit task...`, 'status', false);
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  while (true) {
    try {
      const now = Date.now();
      const currentTask = await getCurrentTask();
      //const elapsed = now - firstTimestamp;
      //const timeInCycle = elapsed % TASK_INTERVAL;

      // create  task
      if (isTimeForNewTask(firstTimestamp)) {
        if (currentTask && currentTask.status === 'pending') {
          // Only expire the task if it's been running for at least TASK_INTERVAL
          const taskAge = now - currentTask.timestamp;
          if (taskAge >= TASK_INTERVAL) {
            // Expire the current task before creating a new one
            await writeToClient(`${DIVIDER}`, 'info', true);
            await writeToClient(`Task Expired`, 'error', true);
            await writeToClient(`Task ID: ${currentTask.id}`, 'info', true);
            await writeToClient(`Reason: No majority achieved`, 'error', true);
            await writeToClient(`TASK_EXPIRED|${currentTask.id}`, 'info', true);
            await writeToClient(`${DIVIDER}`, 'info', true);
            lastProcessedTaskId = currentTask.id;
          } else {
            // Skip creating a new task if the current one hasn't expired yet
            continue;
          }
        }
        // Create new task after expiring the old one
        await createNewTask();
      }
      // Handle existing task
      else if (currentTask && currentTask.status === 'pending') {
        if (!currentTask.votes.has(strategy) && currentTask.id !== lastProcessedTaskId) {
          await voteOnTask(currentTask);
          lastProcessedTaskId = currentTask.id;
        }
      }
      // Show monitoring message only when no active task and after sufficient delay
      else if (
        (!currentTask || currentTask.status === 'completed') &&
        now - lastDebugTime >= DEBUG_INTERVAL &&
        now - lastTaskCompletionTime >= 5000
      ) {
        await writeToClient(`Waiting for user to submit task...`, 'status', false);
        lastDebugTime = now;
      }

      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error in task monitoring:', error);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

/**
 * Current Task Retrieval
 * Reads and parses current task state from log file
 * Includes task status, votes, and metadata
 */
async function getCurrentTask(): Promise<Task | null> {
  if (!fs.existsSync(logFile)) return null;

  const content = fs.readFileSync(logFile, 'utf8');
  const lines = content.split('\n').reverse(); // Read from bottom to get most recent task

  let taskStatus = 'pending';
  let taskId = null;
  let taskTimestamp = null;

  // Find most recent task start
  for (const line of lines) {
    const startMatch = line.match(/TASK_START\|(\w+)\|(\d+)\|pending/);
    if (startMatch) {
      taskId = startMatch[1];
      taskTimestamp = startMatch[2];
      break;
    }
  }

  if (!taskId) return null;

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
    timestamp: parseInt(taskTimestamp!),
    status: taskStatus as Task['status'],
    votes,
  };
}

/**
 * Task Creation Function
 * Creates a new task with unique ID and prevents duplicate creation
 * Uses file lock to ensure only one client creates task
 * Clears previous task data while preserving system initialization
 */
async function createNewTask(): Promise<Task> {
  // First check if a task has already been created
  const currentTask = await getCurrentTask();
  if (currentTask && currentTask.status === 'pending') {
    return currentTask;
  }

  // Wait for lock file with timeout
  let waitTime = 0;
  const maxWaitTime = 5000; // 5 seconds maximum wait
  while (fs.existsSync(lockFile)) {
    await new Promise((resolve) => setTimeout(resolve, 100));
    waitTime += 100;

    // Break the loop if we've waited too long
    if (waitTime >= maxWaitTime) {
      await writeToClient(`Lock file timeout, forcing continue...`, 'warning', false);
      try {
        fs.unlinkSync(lockFile);
      } catch (error) {
        await writeToClient(`Error removing lock file: ${error}`, 'error', false);
      }
      break;
    }
  }

  // Create lock file to prevent other clients from creating tasks
  try {
    fs.writeFileSync(lockFile, 'locked');

    // Double check if a task was created while we were waiting for the lock
    const existingTask = await getCurrentTask();
    if (existingTask && existingTask.status === 'pending') {
      return existingTask;
    }

    // Add a small delay to ensure file system sync
    await new Promise((resolve) => setTimeout(resolve, 100));

    // One final check for existing task
    const finalCheck = await getCurrentTask();
    if (finalCheck && finalCheck.status === 'pending') {
      return finalCheck;
    }

    const task: Task = {
      id: generateTaskId(),
      timestamp: Date.now(),
      status: 'pending',
      votes: new Map(),
    };

    // Clear the log file but preserve system initialization
    if (fs.existsSync(logFile)) {
      const content = fs.readFileSync(logFile, 'utf8');
      const systemInit = content.match(/System initialized at timestamp: \d+/);
      if (systemInit) {
        fs.writeFileSync(logFile, `${systemInit[0]}\n`);
      } else {
        fs.writeFileSync(logFile, '');
      }
    }

    // Write task creation messages
    await writeToClient(`${DIVIDER}`, 'info', true);
    await writeToClient(`Task submitted by user ${generateRandomAddress()}`, 'status', true);
    await writeToClient(`Task ID: ${task.id}`, 'info', true);
    await writeToClient(`Status: Waiting for votes...`, 'info', true);
    await writeToClient(`TASK_START|${task.id}|${task.timestamp}|${task.status}`, 'info', true);
    await writeToClient(`${DIVIDER}`, 'info', true);

    return task;
  } finally {
    // Ensure lock file is always removed
    try {
      if (fs.existsSync(lockFile)) {
        fs.unlinkSync(lockFile);
      }
    } catch (error) {
      await writeToClient(`Error removing lock file: ${error}`, 'error', false);
    }
  }
}

/**
 * Vote Processing Function
 * Handles vote submission and weight calculation for a task
 * - Records individual strategy vote
 * - Calculates total weight from all votes
 * - Determines if majority is achieved
 * - Updates task status on completion
 */
async function voteOnTask(task: Task): Promise<void> {
  // First check if task is already completed
  const content = fs.readFileSync(logFile, 'utf8');
  if (content.includes(`TASK_COMPLETE|${task.id}`) || content.includes(`TASK_EXPIRED|${task.id}`)) {
    await writeToClient(`Task [${task.id}] is no longer active`, 'warning', false);
    return;
  }

  // Get current slot number
  const currentSlot = await fetchSlot();
  await writeToClient(`Current slot number: [${currentSlot}]`, 'status', false);

  const weights = await calculateParticipantsWeightSDK();
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
  const totalWeight = voteMatches.reduce((sum, match) => sum + parseInt(match[1], 10), 0);

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
        `${DIVIDER}`,
        `Task Completed Successfully`,
        `Task ID: ${task.id}`,
        `Total Weight: ${totalWeight}%`,
        `Final Slot Number: ${currentSlot}`,
        `TASK_COMPLETE|${task.id}`,
        `${DIVIDER}`,
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

// Modify the run function to include verbose mode notification
async function run(): Promise<void> {
  console.clear();
  console.log('\x1b[36m%s\x1b[0m', TITLE_ART);
  console.log('\x1b[33m%s\x1b[0m', DIVIDER);
  console.log('\x1b[32m%s\x1b[0m', '📍 Initializing bApp Client v1.0.0');
  if (verboseMode) {
    console.log('\x1b[33m%s\x1b[0m', '📝 Verbose mode enabled');
  }
  console.log('\x1b[33m%s\x1b[0m', DIVIDER);

  if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile, '');
  }

  await writeToClient(`Local client initialized for Strategy [${strategy}]`, 'success', false);
  await writeToClient(`Connecting to network...`, 'status', false);
  await writeToClient(`Ready to process tasks`, 'success', false);

  const tail = exec(`tail -f ${logFile}`);
  tail.stdout?.pipe(process.stdout);

  // Start monitoring tasks
  await monitorTasks();
}

// Run the client
run();
