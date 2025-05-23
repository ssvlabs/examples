import * as fs from 'fs';
import { Task } from '../config/types';
import { TASK_INTERVAL, DIVIDER } from '../config/constants';
import { writeToClient } from '../utils/logger';

const logFile: string = 'client.log';
const lockFile: string = 'client.lock';

export function generateTaskId(): string {
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 4 }, () => CHARS.charAt(Math.random() * CHARS.length)).join('');
}

export function generateRandomAddress(): string {
  const chars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += chars[Math.floor(Math.random() * chars.length)];
  }
  return address;
}

export async function getOrCreateFirstTimestamp(): Promise<number> {
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

export function isTimeForNewTask(firstTimestamp: number): boolean {
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

export async function getCurrentTask(): Promise<Task | null> {
  if (!fs.existsSync(logFile)) return null;

  const content = fs.readFileSync(logFile, 'utf8');
  const lines = content.split('\n').reverse(); // Read from bottom to get most recent task

  let taskStatus: Task['status'] = 'pending';
  let taskId: string | null = null;
  let taskTimestamp: string | null = null;

  // Find most recent task start
  for (const line of lines) {
    const startMatch = line.match(/TASK_START\|(\w+)\|(\d+)\|pending/);
    if (startMatch) {
      taskId = startMatch[1];
      taskTimestamp = startMatch[2];
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
  };
}

export async function createNewTask(): Promise<Task> {
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
