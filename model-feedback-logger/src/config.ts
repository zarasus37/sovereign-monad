import dotenv from 'dotenv';
dotenv.config();

export interface Config {
  kafkaBrokers: string[];
  inputTopics: string[];
  outputDir: string;
  clientId: string;
  logLevel: string;
}

let configInstance: Config | null = null;

export function getConfig(): Config {
  if (configInstance) return configInstance;
  const brokers = process.env.KAFKA_BROKERS;
  if (!brokers) throw new Error('KAFKA_BROKERS required');
  configInstance = {
    kafkaBrokers: brokers.split(',').map(b => b.trim()),
    inputTopics: (process.env.INPUT_TOPICS || 'market.base.price-snapshot,market.arbitrum.price-snapshot,risk.opportunity-candidate,risk.opportunity-evaluation,execution.execution-result').split(','),
    outputDir: process.env.OUTPUT_DIR || './logs',
    clientId: process.env.KAFKA_CLIENT_ID || 'model-feedback-logger',
    logLevel: process.env.LOG_LEVEL || 'info',
  };
  return configInstance;
}
