/**
 * Configuration loader for arbitrum-market-agent
 */

import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  arbitrumWsUrl: string;
  arbitrumRpcUrl: string;
  camelotRouterAddr: string;
  camelotEthUsdcPool: string;
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

  const arbitrumWsUrl = process.env.ARBITRUM_WS_URL || process.env.CHAIN_B_WS_URL;
  const arbitrumRpcUrl = process.env.ARBITRUM_RPC_URL || process.env.CHAIN_B_RPC_URL;
  const camelotRouterAddr = process.env.CAMELOT_ROUTER_ADDR;
  const camelotEthUsdcPool = process.env.CAMELOT_ETH_USDC_POOL;
  const kafkaBrokers = process.env.KAFKA_BROKERS;
  const kafkaTopic = process.env.KAFKA_TOPIC || 'market.arbitrum.price-snapshot';
  const kafkaClientId = process.env.KAFKA_CLIENT_ID || 'arbitrum-market-agent';
  const logLevel = process.env.LOG_LEVEL || 'info';

  if (!arbitrumWsUrl) {
    throw new Error('ARBITRUM_WS_URL (or CHAIN_B_WS_URL) is required');
  }
  if (!camelotEthUsdcPool) {
    throw new Error('CAMELOT_ETH_USDC_POOL is required');
  }
  if (!kafkaBrokers) {
    throw new Error('KAFKA_BROKERS is required');
  }

  configInstance = {
    arbitrumWsUrl,
    arbitrumRpcUrl: arbitrumRpcUrl || '',
    camelotRouterAddr: camelotRouterAddr || '',
    camelotEthUsdcPool,
    kafkaBrokers: kafkaBrokers.split(',').map((broker) => broker.trim()),
    kafkaTopic,
    kafkaClientId,
    logLevel,
    blockTimeMs: 250,
    volWindow1m: 240,
    volWindow5m: 1200,
    volWindow1h: 14400,
  };

  return configInstance;
}

export function validateConfig(): string[] {
  const errors: string[] = [];
  const config = getConfig();

  if (!config.arbitrumWsUrl.startsWith('wss://')) {
    errors.push('ARBITRUM_WS_URL must be a WebSocket URL (wss://)');
  }

  if (config.kafkaBrokers.length === 0) {
    errors.push('KAFKA_BROKERS must contain at least one broker');
  }

  return errors;
}
