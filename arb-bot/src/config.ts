import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  kafkaBrokers: string[];
  inputTopic: string;
  outputTopic: string;
  clientId: string;
  logLevel: string;
  chainARpcUrl: string;
  chainBRpcUrl: string;
  chainAName: string;
  chainBName: string;
  privateKey: string;
  dryRun: boolean;
  maxSlippageBps: number;
}

let configInstance: Config | null = null;

export function getConfig(): Config {
  if (configInstance) return configInstance;

  const brokers = process.env.KAFKA_BROKERS;
  if (!brokers) {
    throw new Error('KAFKA_BROKERS required');
  }

  configInstance = {
    kafkaBrokers: brokers.split(',').map((broker) => broker.trim()),
    inputTopic: process.env.INPUT_TOPIC || 'execution.execution-plan',
    outputTopic: process.env.OUTPUT_TOPIC || 'execution.execution-result',
    clientId: process.env.KAFKA_CLIENT_ID || 'arb-bot',
    logLevel: process.env.LOG_LEVEL || 'info',
    chainARpcUrl: process.env.CHAIN_A_RPC_URL || process.env.BASE_RPC_URL || '',
    chainBRpcUrl: process.env.CHAIN_B_RPC_URL || process.env.ARBITRUM_RPC_URL || '',
    chainAName: process.env.CHAIN_A_NAME || 'base',
    chainBName: process.env.CHAIN_B_NAME || 'arbitrum',
    privateKey: process.env.PRIVATE_KEY || '',
    dryRun: process.env.DRY_RUN === 'true',
    maxSlippageBps: parseInt(process.env.MAX_SLIPPAGE_BPS || '50', 10),
  };

  return configInstance;
}