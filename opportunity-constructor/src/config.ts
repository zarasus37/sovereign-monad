/**
 * Configuration loader for opportunity-constructor
 * Phase 4: Constructs OpportunityCandidate from SpreadSignal
 */

import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  kafkaBrokers: string[];
  inputTopic: string;
  outputTopic: string;
  clientId: string;
  logLevel: string;
  defaultSizePercent: number;
  minSizeUsd: number;
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
    inputTopic: process.env.INPUT_TOPIC || 'market.spread.signal',
    outputTopic: process.env.OUTPUT_TOPIC || 'risk.opportunity-candidate',
    clientId: process.env.KAFKA_CLIENT_ID || 'opportunity-constructor',
    logLevel: process.env.LOG_LEVEL || 'info',
    defaultSizePercent: parseFloat(process.env.DEFAULT_SIZE_PERCENT || '10'),
    minSizeUsd: parseFloat(process.env.MIN_SIZE_USD || '250'),
  };

  return configInstance;
}

export function validateConfig(): string[] {
  const errors: string[] = [];
  const config = getConfig();

  if (config.kafkaBrokers.length === 0) {
    errors.push('KAFKA_BROKERS must contain at least one broker');
  }

  if (config.defaultSizePercent <= 0 || config.defaultSizePercent > 100) {
    errors.push('DEFAULT_SIZE_PERCENT must be between 0 and 100');
  }

  if (config.minSizeUsd <= 0) {
    errors.push('MIN_SIZE_USD must be greater than 0');
  }

  return errors;
}
