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
      process.env.INPUT_TOPIC_MONAD || 'market.monad.price-snapshot',
      process.env.INPUT_TOPIC_ETH || 'market.eth.price-snapshot',
    ],
    outputTopic: process.env.OUTPUT_TOPIC || 'market.spread.signal',
    clientId: process.env.KAFKA_CLIENT_ID || 'spread-scanner',
    logLevel: process.env.LOG_LEVEL || 'info',
    minSpreadBps: parseFloat(process.env.MIN_SPREAD_BPS || '5'),
    minLiquidity10bpsUsd: parseFloat(process.env.MIN_LIQUIDITY_10BPS_USD || '0'),
    minCapacityUsd: parseFloat(process.env.MIN_CAPACITY_USD || '50000'),
  };
  return configInstance;
}
