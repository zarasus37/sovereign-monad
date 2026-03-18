import dotenv from 'dotenv';
dotenv.config();

export interface Config {
  kafkaBrokers: string[];
  inputTopic: string;
  outputTopic: string;
  clientId: string;
  logLevel: string;
  ethRpcUrl: string;
  monadRpcUrl: string;
  privateKey: string;
  bridgeType: 'wormhole-ntt' | 'axelar-gmp';
  dryRun: boolean;
  timeoutMs: number;
  wormholeNttAddress: string;
  wormholeChainIdMonad: number;
}

let configInstance: Config | null = null;

export function getConfig(): Config {
  if (configInstance) return configInstance;
  const brokers = process.env.KAFKA_BROKERS;
  if (!brokers) throw new Error('KAFKA_BROKERS required');
  configInstance = {
    kafkaBrokers: brokers.split(',').map(b => b.trim()),
    inputTopic: process.env.INPUT_TOPIC || 'execution.bridge-request',
    outputTopic: process.env.OUTPUT_TOPIC || 'execution.bridge-result',
    clientId: process.env.KAFKA_CLIENT_ID || 'bridge-exec-bot',
    logLevel: process.env.LOG_LEVEL || 'info',
    ethRpcUrl: process.env.ETH_RPC_URL || 'https://eth-mainnet.alchemyapi.io/',
    monadRpcUrl: process.env.MONAD_RPC_URL || 'https://monad-mainnet.quiknode.pro/',
    privateKey: process.env.PRIVATE_KEY || '',
    bridgeType: (process.env.BRIDGE_TYPE as 'wormhole-ntt' | 'axelar-gmp') || 'wormhole-ntt',
    dryRun: process.env.DRY_RUN === 'true',
    timeoutMs: parseInt(process.env.BRIDGE_TIMEOUT_MS || '120000'),
    wormholeNttAddress: process.env.WORMHOLE_NTT_ADDRESS || '',
    wormholeChainIdMonad: parseInt(process.env.WORMHOLE_CHAIN_ID_MONAD || '0'),
  };
  return configInstance;
}
