import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { GameFiSourceConfig } from './types';
dotenv.config();

export interface GameFiControlCoreServiceConfig {
  kafkaBrokers: string[];
  outputTopic: string;
  clientId: string;
  logLevel: string;
  /** How often to emit a source health snapshot (ms). */
  pollIntervalMs: number;
  /** Path to the GameFi source JSON config file. */
  sourceConfigPath: string;
}

let serviceConfigInstance: GameFiControlCoreServiceConfig | null = null;

export function getServiceConfig(): GameFiControlCoreServiceConfig {
  if (serviceConfigInstance) return serviceConfigInstance;

  const brokers = process.env.KAFKA_BROKERS;
  if (!brokers) throw new Error('KAFKA_BROKERS is required');

  serviceConfigInstance = {
    kafkaBrokers: brokers.split(',').map((b) => b.trim()),
    outputTopic: process.env.GAMEFI_HEALTH_TOPIC || 'system.health',
    clientId: process.env.KAFKA_CLIENT_ID || 'gamefi-control-core',
    logLevel: process.env.LOG_LEVEL || 'info',
    pollIntervalMs: parseInt(process.env.GAMEFI_POLL_INTERVAL_MS || '30000', 10),
    sourceConfigPath:
      process.env.GAMEFI_SOURCE_CONFIG ||
      path.resolve(process.cwd(), 'config', 'gamefi-source.json'),
  };

  return serviceConfigInstance;
}

export function loadSourceConfig(configPath: string): GameFiSourceConfig {
  const resolved = path.isAbsolute(configPath)
    ? configPath
    : path.resolve(process.cwd(), configPath);

  if (!fs.existsSync(resolved)) {
    throw new Error(
      `GameFi source config not found: ${resolved}\n` +
        `Copy gamefi-control-core/config/gamefi-source.example.json to ${resolved} and fill in real values.`,
    );
  }

  const raw = fs.readFileSync(resolved, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw) as GameFiSourceConfig;
}
