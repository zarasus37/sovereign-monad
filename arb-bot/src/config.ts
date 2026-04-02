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
  enableLiveExecution: boolean;
  maxSlippageBps: number;
  maxPlanAgeMs: number;
  expectedChainAId: number;
  expectedChainBId: number;
  minGasBalanceEth: number;
  enableSwapSubmission: boolean;
  enableAutoApprove: boolean;
  aerodromeRouterAddress: string | null;
  aerodromeFactoryAddress: string | null;
  camelotRouterAddress: string | null;
  camelotReferrerAddress: string | null;
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
    enableLiveExecution: process.env.ENABLE_LIVE_EXECUTION === 'true',
    maxSlippageBps: parseInt(process.env.MAX_SLIPPAGE_BPS || '50', 10),
    maxPlanAgeMs: parseInt(process.env.MAX_PLAN_AGE_MS || '30000', 10),
    expectedChainAId: parseInt(process.env.EXPECTED_CHAIN_A_ID || '8453', 10),
    expectedChainBId: parseInt(process.env.EXPECTED_CHAIN_B_ID || '42161', 10),
    minGasBalanceEth: parseFloat(process.env.MIN_GAS_BALANCE_ETH || '0.005'),
    enableSwapSubmission: process.env.ENABLE_SWAP_SUBMISSION === 'true',
    enableAutoApprove: process.env.ENABLE_AUTO_APPROVE === 'true',
    aerodromeRouterAddress: process.env.AERODROME_ROUTER_ADDR || null,
    aerodromeFactoryAddress:
      process.env.AERODROME_FACTORY_ADDR || '0x420DD381b31aEf6683db6B902084cB0FFECe40Da',
    camelotRouterAddress: process.env.CAMELOT_ROUTER_ADDR || null,
    camelotReferrerAddress:
      process.env.CAMELOT_REFERRER_ADDR || '0x0000000000000000000000000000000000000000',
  };

  return configInstance;
}
