import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { SlotSourceConfig } from './types';
dotenv.config();

export interface SlotCoreServiceConfig {
  kafkaBrokers: string[];
  outputTopic: string;
  clientId: string;
  logLevel: string;
  /** How often to emit a source health snapshot (ms). */
  pollIntervalMs: number;
  /** Path to the slot-source JSON config file. */
  sourceConfigPath: string;
}

let serviceConfigInstance: SlotCoreServiceConfig | null = null;

export function getServiceConfig(): SlotCoreServiceConfig {
  if (serviceConfigInstance) return serviceConfigInstance;

  const brokers = process.env.KAFKA_BROKERS;
  if (!brokers) throw new Error('KAFKA_BROKERS is required');

  serviceConfigInstance = {
    kafkaBrokers: brokers.split(',').map((b) => b.trim()),
    outputTopic: process.env.SLOT_HEALTH_TOPIC || 'system.health',
    clientId: process.env.KAFKA_CLIENT_ID || 'slot-core',
    logLevel: process.env.LOG_LEVEL || 'info',
    pollIntervalMs: parseInt(process.env.SLOT_POLL_INTERVAL_MS || '30000', 10),
    sourceConfigPath:
      process.env.SLOT_SOURCE_CONFIG ||
      path.resolve(process.cwd(), 'config', 'slot-source.json'),
  };

  return serviceConfigInstance;
}

export function loadSourceConfig(configPath: string): SlotSourceConfig {
  const resolved = path.isAbsolute(configPath)
    ? configPath
    : path.resolve(process.cwd(), configPath);

  if (!fs.existsSync(resolved)) {
    throw new Error(
      `Slot source config not found: ${resolved}\n` +
        `Copy slot-core/config/slot-source.example.json to ${resolved} and fill in real values.`,
    );
  }

  const raw = fs.readFileSync(resolved, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw) as SlotSourceConfig;
}
