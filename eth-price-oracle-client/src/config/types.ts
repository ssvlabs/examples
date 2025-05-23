export type Task = {
  id: string;
  status: 'pending' | 'completed' | 'expired';
  timestamp: number;
  signature?: string;
  ethPrice?: number;
  votes: Map<string, number>;
  taskNumber: number;
};

export type LogMessageType = 'info' | 'success' | 'error' | 'warning' | 'status';

export interface TokenCoefficient {
  token: `0x${string}`;
  coefficient: number;
} 