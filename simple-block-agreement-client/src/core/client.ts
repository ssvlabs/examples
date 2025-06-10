import { exec } from 'child_process';
import {
  TITLE_ART,
  DIVIDER,
  INITIAL_WAIT,
  DEBUG_INTERVAL,
  TASK_INTERVAL,
} from '../config/constants';
import { writeToClient } from '../utils/logger';
import {
  getOrCreateFirstTimestamp,
  isTimeForNewTask,
  getCurrentTask,
  createNewTask,
} from '../tasks/taskManager';
import { voteOnTask } from '../voting/voteManager';

const logFile: string = 'client.log';

export async function monitorTasks(
  strategy: string,
  calculationType: string,
  verboseMode: boolean
): Promise<void> {
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

      // create task
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
          await voteOnTask(currentTask, strategy, calculationType, verboseMode);
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

export async function run(
  strategy: string,
  calculationType: string,
  verboseMode: boolean
): Promise<void> {
  console.clear();
  console.log('\x1b[36m%s\x1b[0m', TITLE_ART);
  console.log('\x1b[33m%s\x1b[0m', DIVIDER);
  console.log('\x1b[32m%s\x1b[0m', '📍 Initializing bApp Client v1.0.0');
  if (verboseMode) {
    console.log('\x1b[33m%s\x1b[0m', '📝 Verbose mode enabled');
  }
  console.log('\x1b[33m%s\x1b[0m', DIVIDER);

  await writeToClient(`Local client initialized for Strategy [${strategy}]`, 'success', false);
  await writeToClient(`Connecting to network...`, 'status', false);
  await writeToClient(`Ready to process tasks`, 'success', false);

  const tail = exec(`tail -f ${logFile}`);
  tail.stdout?.pipe(process.stdout);

  // Start monitoring tasks
  await monitorTasks(strategy, calculationType, verboseMode);
}
