/**
 * MEV Arbitrage Bot - Configuration
 */

export interface BotConfig {
  // Kafka
  kafkaBrokers: string[];
  inputTopic: string;
  outputTopic: string;
  
  // Chain
  chainARpcUrl: string;
  chainBRpcUrl: string;
  chainAName: string;
  chainBName: string;
  
  // Execution
  privateKey: string;
  dryRun: boolean;
  
  // Trading
  minSpreadBps: number;
  maxSlippageBps: number;
  minPositionSize: string;
  maxPositionSize: string;
  
  // Risk
  maxExposure: string;
  maxDailyLoss: string;
  
  // Logging
  logLevel: string;
}

export function getConfig(): BotConfig {
  return {
    kafkaBrokers: (process.env.KAFKA_BROKERS || 'kafka:29092').split(','),
    inputTopic: process.env.INPUT_TOPIC || 'execution.execution-plan',
    outputTopic: process.env.OUTPUT_TOPIC || 'execution.execution-result',
    
    chainARpcUrl: process.env.CHAIN_A_RPC_URL || '',
    chainBRpcUrl: process.env.CHAIN_B_RPC_URL || '',
    chainAName: process.env.CHAIN_A_NAME || 'base',
    chainBName: process.env.CHAIN_B_NAME || 'arbitrum',
    
    privateKey: process.env.PRIVATE_KEY || '',
    dryRun: process.env.DRY_RUN !== 'false',
    
    minSpreadBps: parseFloat(process.env.MIN_SPREAD_BPS || '5'),
    maxSlippageBps: parseFloat(process.env.MAX_SLIPPAGE_BPS || '50'),
    minPositionSize: process.env.MIN_POSITION_SIZE || '100',
    maxPositionSize: process.env.MAX_POSITION_SIZE || '10000',
    
    maxExposure: process.env.MAX_EXPOSURE || '100000',
    maxDailyLoss: process.env.MAX_DAILY_LOSS || '5000',
    
    logLevel: process.env.LOG_LEVEL || 'info',
  };
}
