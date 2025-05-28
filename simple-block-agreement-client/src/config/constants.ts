export const TASK_INTERVAL = 15000; // Time between tasks
export const INITIAL_WAIT = 5000; // Initial monitoring period
export const DEBUG_INTERVAL = 2000; // Interval for monitoring messages
export const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export const TITLE_ART = `
██████╗  █████╗ ██████╗ ██████╗     ██████╗██╗     ██╗███████╗███╗   ██╗████████╗
██╔══██╗██╔══██╗██╔══██╗██╔══██╗   ██╔════╝██║     ██║██╔════╝████╗  ██║╚══██╔══╝
██████╔╝███████║██████╔╝██████╔╝   ██║     ██║     ██║█████╗  ██╔██╗ ██║   ██║   
██╔══██╗██╔══██║██╔═══╝ ██╔═══╝    ██║     ██║     ██║██╔══╝  ██║╚██╗██║   ██║   
██████╔╝██║  ██║██║     ██║        ╚██████╗███████╗██║███████╗██║ ╚████║   ██║   
╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝         ╚═════╝╚══════╝╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝   
`;

export const DIVIDER =
  '════════════════════════════════════════════════════════════════════════════════';

export const TOKEN_COEFFICIENTS: Array<{ token: `0x${string}`; coefficient: number }> = [
  {
    token: '0x9F5d4Ec84fC4785788aB44F9de973cF34F7A038e',
    coefficient: 200,
  },
  {
    token: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    coefficient: 220,
  },
] as const;

export const VALIDATOR_COEFFICIENT = 100;
