import { getBappAddress } from '../utils/validation';

export const CONTRACT_ADDRESS = getBappAddress();
export const BAPP_ID = CONTRACT_ADDRESS;

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
    token: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
    coefficient: 220,
  },
] as const;

export const VALIDATOR_COEFFICIENT = 100;

export const BEACON_CHAIN_URL = 'https://eth-beacon-chain-hoodi.drpc.org/rest/';
export const SUBGRAPH_URL =
  'https://api.studio.thegraph.com/query/71118/ssv-network-hoodi/version/latest';
export const COINGECKO_API_URL =
  'https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd';
