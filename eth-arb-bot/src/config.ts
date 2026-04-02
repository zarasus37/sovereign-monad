import dotenv from 'dotenv';
dotenv.config();

export interface Config {
  kafkaBrokers: string[];
  inputTopic: string;
  outputTopic: string;
  clientId: string;
  logLevel: string;
  ethRpcUrl: string;
  privateKey: string;
  dryRun: boolean;
  maxSlippageBps: number;
  useFlashbots: boolean;
  flashbotsRelayUrl: string;
  flashbotsAuthKey: string;
}

let configInstance: Config | null = null;

export function getConfig(): Config {
  if (configInstance) return configInstance;
  const brokers = process.env.KAFKA_BROKERS;
  if (!brokers) throw new Error('KAFKA_BROKERS required');
  configInstance = {
    kafkaBrokers: brokers.split(',').map(b => b.trim()),
    inputTopic: process.env.INPUT_TOPIC || 'execution.eth-execution-plan',
    outputTopic: process.env.OUTPUT_TOPIC || 'execution.eth-result',
    clientId: process.env.KAFKA_CLIENT_ID || 'eth-arb-bot',
    logLevel: process.env.LOG_LEVEL || 'info',
    ethRpcUrl: process.env.ETH_RPC_URL || 'https://eth-mainnet.alchemyapi.io/',
    privateKey: process.env.PRIVATE_KEY || '',
    dryRun: process.env.DRY_RUN === 'true',
    maxSlippageBps: parseInt(process.env.MAX_SLIPPAGE_BPS || '50'),
    useFlashbots: process.env.USE_FLASHBOTS === 'true',
    flashbotsRelayUrl: process.env.FLASHBOTS_RELAY_URL || 'https://relay.flashbots.net',
    flashbotsAuthKey: process.env.FLASHBOTS_AUTH_KEY || '',
  };
  return configInstance;
}
