import dotenv from 'dotenv';
dotenv.config();

// Chain IDs
export const CHAIN_IDS = {
  BASE: 8453,
  ARBITRUM: 42161,
  ETHEREUM: 1,
  OPTIMISM: 10,
} as const;

// Across SpokePool addresses (mainnet)
export const SPOKE_POOL_ADDRESSES: Record<number, string> = {
  [CHAIN_IDS.BASE]: process.env.ACROSS_SPOKEPOOL_BASE || '0x11984dc4465481512eb5b777E44061C158CF2259', // Across Base SpokePool
  [CHAIN_IDS.ARBITRUM]: process.env.ACROSS_SPOKEPOOL_ARBITRUM || '0xB88690461dDbaB6f04D39C1eB3B8E805e5bF44f6', // Across Arbitrum SpokePool
  [CHAIN_IDS.ETHEREUM]: '0x5d7F1A31cde67b9C0d8b5f79e1C4bBd8b0Cf7E4c', // Ethereum SpokePool
  [CHAIN_IDS.OPTIMISM]: '0x6f26Bf09B1C792e3228e54647898327e98dBBD9B', // Optimism SpokePool
};

export interface Config {
  kafkaBrokers: string[];
  inputTopic: string;
  outputTopic: string;
  quotesTopic: string;
  clientId: string;
  logLevel: string;
  baseRpcUrl: string;
  arbitrumRpcUrl: string;
  privateKey: string;
  dryRun: boolean;
  maxSlippageBps: number;
}

let configInstance: Config | null = null;

export function getConfig(): Config {
  if (configInstance) return configInstance;
  
  const brokers = process.env.KAFKA_BROKERS;
  if (!brokers) throw new Error('KAFKA_BROKERS required');
  
  configInstance = {
    kafkaBrokers: brokers.split(',').map(b => b.trim()),
    inputTopic: process.env.INPUT_TOPIC || 'bridge.transfer-request',
    outputTopic: process.env.OUTPUT_TOPIC || 'bridge.transfer-result',
    quotesTopic: process.env.QUOTES_TOPIC || 'bridge.quotes',
    clientId: process.env.KAFKA_CLIENT_ID || 'bridge-agent',
    logLevel: process.env.LOG_LEVEL || 'info',
    baseRpcUrl: process.env.BASE_RPC_URL || 'https://mainnet.base.org',
    arbitrumRpcUrl: process.env.ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc',
    privateKey: process.env.PRIVATE_KEY || '',
    dryRun: process.env.DRY_RUN === 'true',
    maxSlippageBps: parseInt(process.env.MAX_SLIPPAGE_BPS || '100'),
  };
  return configInstance;
}
