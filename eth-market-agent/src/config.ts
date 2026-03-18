/**
 * Configuration loader for eth-market-agent
 */

import dotenv from 'dotenv';
import { MarketConfig } from './models/events';

dotenv.config();

export interface Config {
  ethWsUrl: string;
  kafkaBrokers: string[];
  kafkaTopic: string;
  kafkaClientId: string;
  logLevel: string;
  markets: MarketConfig[];
  blockTimeMs: number;
}

let configInstance: Config | null = null;

export function getConfig(): Config {
  if (configInstance) return configInstance;

  const ethWsUrl = process.env.ETH_WS_URL;
  const kafkaBrokers = process.env.KAFKA_BROKERS;
  const kafkaTopic = process.env.KAFKA_TOPIC || 'market.eth.price-snapshot';
  const kafkaClientId = process.env.KAFKA_CLIENT_ID || 'eth-market-agent';
  const logLevel = process.env.LOG_LEVEL || 'info';

  if (!ethWsUrl) throw new Error('ETH_WS_URL is required');
  if (!kafkaBrokers) throw new Error('KAFKA_BROKERS is required');

  // Default markets - Uniswap V3
  const markets: MarketConfig[] = [
    {
      id: 'uni_v3:ETH/USDC:0.05%',
      baseAsset: 'ETH',
      quoteAsset: 'USDC',
      poolAddress: process.env.UNI_ETH_USDC_005_ADDR || process.env.UNI_V3_ETH_USDC_POOL || '0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640',
      fee: 500,
    },
  ];

  configInstance = {
    ethWsUrl,
    kafkaBrokers: kafkaBrokers.split(',').map((b) => b.trim()),
    kafkaTopic,
    kafkaClientId,
    logLevel,
    markets,
    blockTimeMs: 12000, // ~12 seconds for Ethereum
  };

  return configInstance;
}
