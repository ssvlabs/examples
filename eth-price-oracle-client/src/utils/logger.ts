import * as fs from 'fs';
import { LogMessageType } from '../config/types';
import { DIVIDER } from '../config/constants';

const logFile: string = 'client.log';

export async function logToConsole(message: string, type: LogMessageType = 'info'): Promise<void> {
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

export async function writeToClient(
  message: string,
  type: LogMessageType = 'info',
  logToFile: boolean = true,
  strategy?: string
): Promise<void> {
  // Add strategy identifier to each message if provided
  const strategyPrefix = strategy ? `[S${strategy}] ` : '';
  const formattedMessage = `${strategyPrefix}${message}`;

  // Always log to console
  await logToConsole(formattedMessage, type);

  // Only write VOTE and TASK_COMPLETE messages to the log file
  if (logToFile && (message.startsWith('VOTE|') || message.startsWith('TASK_COMPLETE|'))) {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        fs.appendFileSync(logFile, `${message}\n`);
        resolve(undefined);
      }, 750);
    });
  }

  return Promise.resolve();
}

// Function to write only VOTE and TASK_COMPLETE to client.log
export async function writeToSharedLog(message: string): Promise<void> {
  if (
    message.startsWith('VOTE|') ||
    message.startsWith('TASK_COMPLETE|') ||
    message.startsWith('TASK_SUBMITTED|') ||
    message.startsWith('TASK_EXPIRED|') ||
    message.startsWith('TRANSACTION_START|') ||
    message.startsWith('Task Number: ') ||
    message.startsWith('ETH Price: ') ||
    message.startsWith('Number of Signatures: ') ||
    message.startsWith('Strategy ID: ') ||
    message.startsWith('Transaction submitted: ') ||
    message === DIVIDER
  ) {
    fs.appendFileSync(logFile, `${message}\n`);
  }
}
