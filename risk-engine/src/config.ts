/**
 * Configuration loader for risk-engine (Phase 5)
 * Monte Carlo risk evaluation for cross-chain arbitrage
 */

import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  kafkaBrokers: string[];
  inputTopic: string;
  outputTopic: string;
  clientId: string;
  logLevel: string;
  simulations: number;
  evMinThreshold: number;
  sharpeLikeThreshold: number;
  maxTailLossPercent: number;
  fixedCostBps: number;
  minEffectiveSpreadBps: number;
  executionRpcUrl: string;
  ethPriceUsd: number;
  gasLimitUnits: number;
}

let configInstance: Config | null = null;

export function getConfig(): Config {
  if (configInstance) {
    return configInstance;
  }

  const brokers = process.env.KAFKA_BROKERS;
  if (!brokers) {
    throw new Error('KAFKA_BROKERS is required');
  }

  configInstance = {
    kafkaBrokers: brokers.split(',').map((b) => b.trim()),
    inputTopic: process.env.INPUT_TOPIC || 'risk.opportunity-candidate',
    outputTopic: process.env.OUTPUT_TOPIC || 'risk.opportunity-evaluation',
    clientId: process.env.KAFKA_CLIENT_ID || 'risk-engine',
    logLevel: process.env.LOG_LEVEL || 'info',
    simulations: parseInt(process.env.SIMULATIONS || '10000'),
    evMinThreshold: parseFloat(process.env.EV_MIN_THRESHOLD || '100'),
    sharpeLikeThreshold: parseFloat(process.env.SHARPE_LIKE_THRESHOLD || '0.5'),
    maxTailLossPercent: parseFloat(process.env.MAX_TAIL_LOSS_PERCENT || '20'),
    fixedCostBps: parseFloat(process.env.RISK_FIXED_COST_BPS || '8'),
    minEffectiveSpreadBps: parseFloat(process.env.RISK_MIN_EFFECTIVE_SPREAD_BPS || '12'),
    executionRpcUrl: process.env.CHAIN_A_RPC_URL || process.env.BASE_RPC_URL || process.env.ETH_RPC_URL || 'https://mainnet.base.org',
    ethPriceUsd: parseFloat(process.env.ETH_PRICE_USD || '2500'),
    gasLimitUnits: parseInt(process.env.GAS_LIMIT_UNITS || '200000'),
  };

  return configInstance;
}

export function validateConfig(): string[] {
  const errors: string[] = [];
  const config = getConfig();

  if (config.kafkaBrokers.length === 0) {
    errors.push('KAFKA_BROKERS must contain at least one broker');
  }

  if (config.simulations < 1000) {
    errors.push('SIMULATIONS must be at least 1000');
  }

  if (config.evMinThreshold < 0) {
    errors.push('EV_MIN_THRESHOLD must be non-negative');
  }

  return errors;
}
