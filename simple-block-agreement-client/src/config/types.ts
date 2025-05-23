export interface Task {
  id: string; // Unique 4-character identifier
  timestamp: number; // Creation time
  slotNumber?: number; // Optional slot number for task
  status: 'pending' | 'active' | 'expired' | 'completed';
  votes: Map<string, number>; // Strategy -> Weight mapping
}

export type LogMessageType = 'info' | 'success' | 'error' | 'warning' | 'status';

export interface TokenCoefficient {
  token: `0x${string}`;
  coefficient: number;
} 