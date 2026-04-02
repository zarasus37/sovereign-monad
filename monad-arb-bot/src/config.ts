import dotenv from 'dotenv';
dotenv.config();

export interface Config {
  kafkaBrokers: string[];
  inputTopic: string;
  outputTopic: string;
  clientId: string;
  logLevel: string;
  monadRpcUrl: string;
  privateKey: string;
  dryRun: boolean;
  maxSlippageBps: number;
}

let configInstance: Config | null = null;

export function getConfig(): Config {
  if (configInstance) return configInstance;
  const brokers = process.env.KAFKA_BROKERS;
  if (!brokers) throw new Error('KAFKA_BROKERS required');
  configInstance = {
    kafkaBrokers: brokers.split(',').map(b => b.trim()),
    inputTopic: process.env.INPUT_TOPIC || 'execution.execution-plan',
    outputTopic: process.env.OUTPUT_TOPIC || 'execution.execution-result',
    clientId: process.env.KAFKA_CLIENT_ID || 'monad-arb-bot',
    logLevel: process.env.LOG_LEVEL || 'info',
    monadRpcUrl: process.env.MONAD_RPC_URL || 'https://monad-mainnet.quiknode.pro/',
    privateKey: process.env.PRIVATE_KEY || '',
    dryRun: process.env.DRY_RUN === 'true',
    maxSlippageBps: parseInt(process.env.MAX_SLIPPAGE_BPS || '50'),
  };
  return configInstance;
}
