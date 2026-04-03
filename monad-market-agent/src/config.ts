/**
 * Configuration loader for monad-market-agent
 */

import dotenv from 'dotenv';
import { MarketConfig } from './models/events';

dotenv.config();

export interface Config {
  monadWsUrl: string;
  monadWsFallbacks: string[];
  kuruEthUsdcAddr: string;
  kuruWethMonAddr: string;
  kuruWethAusdAddr: string;
  kuruMonUsdcAddr: string;
  kafkaBrokers: string[];
  kafkaTopic: string;
  kafkaClientId: string;
  logLevel: string;
  markets: MarketConfig[];
  blockTimeMs: number;
  volWindow1m: number;
  volWindow5m: number;
  volWindow1h: number;
  minFetchIntervalMs: number;
  marketFetchConcurrency: number;
  rpcConnectTimeoutMs: number;
}

let configInstance: Config | null = null;

export function getConfig(): Config {
  if (configInstance) {
    return configInstance;
  }

  const monadWsUrl = process.env.MONAD_WS_URL;
  const monadWsFallbacks = process.env.MONAD_WS_FALLBACKS || '';
  const kuruEthUsdcAddr = process.env.KURU_ETH_USDC_ADDR;
  const kuruWethMonAddr = process.env.KURU_WETH_MON_ADDR;
  const kuruWethAusdAddr = process.env.KURU_WETH_AUSD_ADDR;
  const kuruMonUsdcAddr = process.env.KURU_MON_USDC_ADDR;
  const kafkaBrokers = process.env.KAFKA_BROKERS;
  const kafkaTopic = process.env.KAFKA_TOPIC || 'market.monad.price-snapshot';
  const kafkaClientId = process.env.KAFKA_CLIENT_ID || 'monad-market-agent';
  const logLevel = process.env.LOG_LEVEL || 'info';
  const minFetchIntervalMs = parseInt(process.env.MIN_FETCH_INTERVAL_MS || '4000', 10);
  const marketFetchConcurrency = parseInt(process.env.MARKET_FETCH_CONCURRENCY || '1', 10);
  const rpcConnectTimeoutMs = parseInt(process.env.RPC_CONNECT_TIMEOUT_MS || '15000', 10);

  if (!monadWsUrl) {
    throw new Error('MONAD_WS_URL is required');
  }

  if (!kafkaBrokers) {
    throw new Error('KAFKA_BROKERS is required');
  }

  const markets: MarketConfig[] = [];

  if (kuruEthUsdcAddr) {
    markets.push({
      id: 'kuru:ETH/USDC:spot',
      baseAsset: 'ETH',
      quoteAsset: 'USDC',
      contractAddress: kuruEthUsdcAddr,
    });
  }

  if (kuruWethMonAddr) {
    markets.push({
      id: 'kuru:WETH/MON:spot',
      baseAsset: 'ETH',
      quoteAsset: 'MON',
      contractAddress: kuruWethMonAddr,
    });
  }

  if (kuruWethAusdAddr) {
    markets.push({
      id: 'kuru:WETH/AUSD:spot',
      baseAsset: 'ETH',
      quoteAsset: 'AUSD',
      contractAddress: kuruWethAusdAddr,
    });
  }

  if (kuruMonUsdcAddr) {
    markets.push({
      id: 'kuru:MON/USDC:spot',
      baseAsset: 'MON',
      quoteAsset: 'USDC',
      contractAddress: kuruMonUsdcAddr,
    });
  }

  if (markets.length === 0) {
    throw new Error('At least one Kuru market address must be configured');
  }

  configInstance = {
    monadWsUrl,
    monadWsFallbacks: monadWsFallbacks.split(',').map((url) => url.trim()).filter(Boolean),
    kuruEthUsdcAddr: kuruEthUsdcAddr || '',
    kuruWethMonAddr: kuruWethMonAddr || '',
    kuruWethAusdAddr: kuruWethAusdAddr || '',
    kuruMonUsdcAddr: kuruMonUsdcAddr || '',
    kafkaBrokers: kafkaBrokers.split(',').map((broker) => broker.trim()),
    kafkaTopic,
    kafkaClientId,
    logLevel,
    markets,
    blockTimeMs: 400,
    volWindow1m: 150,
    volWindow5m: 750,
    volWindow1h: 9000,
    minFetchIntervalMs,
    marketFetchConcurrency,
    rpcConnectTimeoutMs,
  };

  return configInstance;
}

export function validateConfig(): string[] {
  const errors: string[] = [];
  const config = getConfig();

  if (!config.monadWsUrl.startsWith('wss://')) {
    errors.push('MONAD_WS_URL must be a WebSocket URL (wss://)');
  }

  for (const fallback of config.monadWsFallbacks) {
    if (!fallback.startsWith('wss://')) {
      errors.push('MONAD_WS_FALLBACKS must contain only WebSocket URLs (wss://)');
      break;
    }
  }

  if (config.kafkaBrokers.length === 0) {
    errors.push('KAFKA_BROKERS must contain at least one broker');
  }

  if (config.minFetchIntervalMs < 1000) {
    errors.push('MIN_FETCH_INTERVAL_MS must be at least 1000');
  }

  if (config.marketFetchConcurrency < 1) {
    errors.push('MARKET_FETCH_CONCURRENCY must be at least 1');
  }

  if (config.rpcConnectTimeoutMs < 1000) {
    errors.push('RPC_CONNECT_TIMEOUT_MS must be at least 1000');
  }

  return errors;
}
