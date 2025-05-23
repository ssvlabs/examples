import * as fs from 'fs';
import { LogMessageType } from '../config/types';

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

  // Add strategy identifier to each message if provided
  const strategyPrefix = strategy ? `[S${strategy}] ` : '';
  const formattedMessage = `${strategyPrefix}${message}`;

  // Always log to console
  await logToConsole(formattedMessage, type);

  // Write to file if logToFile is true
  if (logToFile) {
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        fs.appendFileSync(logFile, `[${timestamp}] ${prefix}${formattedMessage}\n`);
        resolve(undefined);
      }, 750);
    });
  }

  return Promise.resolve();
}
