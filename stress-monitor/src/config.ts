import dotenv from 'dotenv';
dotenv.config();

export interface Config {
  kafkaBrokers: string[];
  outputTopic: string;
  clientId: string;
  logLevel: string;
  monadWsUrl: string;
  monadRpcUrl: string;
  liquidationThreshold: number;
  depegThreshold: number;
  pollIntervalMs: number;
  kuruPoolAddress: string;
  usdcTokenAddress: string;
  gasSpikeMultiplier: number;
  blockDelayThresholdSec: number;
}

let configInstance: Config | null = null;

export function getConfig(): Config {
  if (configInstance) return configInstance;
  const brokers = process.env.KAFKA_BROKERS;
  if (!brokers) throw new Error('KAFKA_BROKERS required');
  configInstance = {
    kafkaBrokers: brokers.split(',').map(b => b.trim()),
    outputTopic: process.env.OUTPUT_TOPIC || 'market.stress-signal',
    clientId: process.env.KAFKA_CLIENT_ID || 'stress-monitor',
    logLevel: process.env.LOG_LEVEL || 'info',
    monadWsUrl: process.env.MONAD_WS_URL || 'wss://monad-mainnet.quiknode.pro/',
    monadRpcUrl: process.env.MONAD_RPC_URL || 'https://monad-testnet.drpc.org',
    liquidationThreshold: parseFloat(process.env.LIQUIDATION_THRESHOLD || '1.1'),
    depegThreshold: parseFloat(process.env.DODEG_THRESHOLD || '0.95'),
    pollIntervalMs: parseInt(process.env.POLL_INTERVAL_MS || '5000'),
    kuruPoolAddress: process.env.KURU_STRESS_POOL_ADDR || process.env.KURU_MON_USDC_ADDR || process.env.KURU_ETH_USDC_ADDR || '',
    usdcTokenAddress: process.env.USDC_TOKEN_ADDRESS || '',
    gasSpikeMultiplier: parseFloat(process.env.GAS_SPIKE_MULTIPLIER || '2.0'),
    blockDelayThresholdSec: parseFloat(process.env.BLOCK_DELAY_THRESHOLD_SEC || '5'),
  };
  return configInstance;
}
