/**
 * Configuration loader for base-market-agent
 */

import dotenv from 'dotenv';

// Load .env file
dotenv.config();

export interface Config {
  baseWsUrl: string;
  baseRpcUrl: string;
  aerodromeRouterAddr: string;
  aerodromeEthUsdcPool: string;
  kafkaBrokers: string[];
  kafkaTopic: string;
  kafkaClientId: string;
  logLevel: string;
  blockTimeMs: number;
  volWindow1m: number;
  volWindow5m: number;
  volWindow1h: number;
}

let configInstance: Config | null = null;

export function getConfig(): Config {
  if (configInstance) {
    return configInstance;
  }

  const baseWsUrl = process.env.BASE_WS_URL || process.env.CHAIN_A_WS_URL;
  const baseRpcUrl = process.env.BASE_RPC_URL || process.env.CHAIN_A_RPC_URL;
  const aerodromeRouterAddr = process.env.AERODROME_ROUTER_ADDR;
  const aerodromeEthUsdcPool = process.env.AERODROME_ETH_USDC_POOL;
  const kafkaBrokers = process.env.KAFKA_BROKERS;
  const kafkaTopic = process.env.KAFKA_TOPIC || 'market.base.price-snapshot';
  const kafkaClientId = process.env.KAFKA_CLIENT_ID || 'base-market-agent';
  const logLevel = process.env.LOG_LEVEL || 'info';

  if (!baseWsUrl) {
    throw new Error('BASE_WS_URL (or CHAIN_A_WS_URL) is required');
  }
  if (!aerodromeEthUsdcPool) {
    throw new Error('AERODROME_ETH_USDC_POOL is required');
  }
  if (!kafkaBrokers) {
    throw new Error('KAFKA_BROKERS is required');
  }

  configInstance = {
    baseWsUrl,
    baseRpcUrl: baseRpcUrl || '',
    aerodromeRouterAddr: aerodromeRouterAddr || '',
    aerodromeEthUsdcPool,
    kafkaBrokers: kafkaBrokers.split(',').map((b) => b.trim()),
    kafkaTopic,
    kafkaClientId,
    logLevel,
    blockTimeMs: 2000, // Base block time ~2 seconds
    volWindow1m: 30,   // 30 blocks * 2s ≈ 1 minute
    volWindow5m: 150,  // 150 blocks * 2s ≈ 5 minutes
    volWindow1h: 1800, // 1800 blocks * 2s ≈ 1 hour
  };

  return configInstance;
}

export function validateConfig(): string[] {
  const errors: string[] = [];
  const config = getConfig();

  if (!config.baseWsUrl.startsWith('wss://')) {
    errors.push('BASE_WS_URL must be a WebSocket URL (wss://)');
  }

  if (config.kafkaBrokers.length === 0) {
    errors.push('KAFKA_BROKERS must contain at least one broker');
  }

  return errors;
}
