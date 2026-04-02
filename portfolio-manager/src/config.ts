import dotenv from 'dotenv';
dotenv.config();

export interface Config {
  kafkaBrokers: string[];
  inputTopic: string;
  outputTopic: string;
  clientId: string;
  logLevel: string;
  maxBridgeExposurePercent: number;
  maxChainExposurePercent: number;
  maxSingleTradePercent: number;
}

let configInstance: Config | null = null;

export function getConfig(): Config {
  if (configInstance) return configInstance;
  const brokers = process.env.KAFKA_BROKERS;
  if (!brokers) throw new Error('KAFKA_BROKERS required');
  configInstance = {
    kafkaBrokers: brokers.split(',').map(b => b.trim()),
    inputTopic: process.env.INPUT_TOPIC || 'risk.opportunity-evaluation',
    outputTopic: process.env.OUTPUT_TOPIC || 'execution.execution-plan',
    clientId: process.env.KAFKA_CLIENT_ID || 'portfolio-manager',
    logLevel: process.env.LOG_LEVEL || 'info',
    maxBridgeExposurePercent: parseFloat(process.env.MAX_BRIDGE_EXPOSURE_PERCENT || '30'),
    maxChainExposurePercent: parseFloat(process.env.MAX_CHAIN_EXPOSURE_PERCENT || '50'),
    maxSingleTradePercent: parseFloat(process.env.MAX_SINGLE_TRADE_PERCENT || '10'),
  };
  return configInstance;
}
