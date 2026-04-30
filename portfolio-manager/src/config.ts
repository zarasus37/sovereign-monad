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
  supportedExecutionModes: Array<'inventory_based' | 'bridge_based'>;
}

let configInstance: Config | null = null;

export function getConfig(): Config {
  if (configInstance) return configInstance;
  const brokers = process.env.KAFKA_BROKERS;
  if (!brokers) throw new Error('KAFKA_BROKERS required');
  const supportedExecutionModes = (process.env.SUPPORTED_EXECUTION_MODES || 'inventory_based')
    .split(',')
    .map((mode) => mode.trim())
    .filter((mode): mode is 'inventory_based' | 'bridge_based' =>
      mode === 'inventory_based' || mode === 'bridge_based'
    );
  configInstance = {
    kafkaBrokers: brokers.split(',').map(b => b.trim()),
    inputTopic: process.env.INPUT_TOPIC || 'risk.opportunity-evaluation',
    outputTopic: process.env.OUTPUT_TOPIC || 'execution.execution-plan',
    clientId: process.env.KAFKA_CLIENT_ID || 'portfolio-manager',
    logLevel: process.env.LOG_LEVEL || 'info',
    maxBridgeExposurePercent: parseFloat(process.env.MAX_BRIDGE_EXPOSURE_PERCENT || '5'),
    maxChainExposurePercent: parseFloat(process.env.MAX_CHAIN_EXPOSURE_PERCENT || '80'),
    maxSingleTradePercent: parseFloat(process.env.MAX_SINGLE_TRADE_PERCENT || '10'),
    supportedExecutionModes: supportedExecutionModes.length > 0 ? supportedExecutionModes : ['inventory_based'],
  };
  return configInstance;
}
