import dotenv from 'dotenv';
dotenv.config();

export interface Config {
  kafkaBrokers: string[];
  inputTopics: string[];
  outputTopic: string;
  clientId: string;
  logLevel: string;
  minSpreadBps: number;
  minLiquidity10bpsUsd: number;
  minCapacityUsd: number;
}

let configInstance: Config | null = null;

export function getConfig(): Config {
  if (configInstance) return configInstance;
  
  const brokers = process.env.KAFKA_BROKERS;
  if (!brokers) throw new Error('KAFKA_BROKERS required');
  
  configInstance = {
    kafkaBrokers: brokers.split(',').map(b => b.trim()),
    inputTopics: [
      process.env.INPUT_TOPIC_CHAIN_A || process.env.INPUT_TOPIC_MONAD || 'market.base.price-snapshot',
      process.env.INPUT_TOPIC_CHAIN_B || process.env.INPUT_TOPIC_ETH || 'market.arbitrum.price-snapshot',
    ],
    outputTopic: process.env.OUTPUT_TOPIC || 'market.spread.signal',
    clientId: process.env.KAFKA_CLIENT_ID || 'spread-scanner',
    logLevel: process.env.LOG_LEVEL || 'info',
    minSpreadBps: parseFloat(process.env.MIN_SPREAD_BPS || '12'),
    minLiquidity10bpsUsd: parseFloat(process.env.MIN_LIQUIDITY_10BPS_USD || '750'),
    minCapacityUsd: parseFloat(process.env.MIN_CAPACITY_USD || '3000'),
  };
  return configInstance;
}
