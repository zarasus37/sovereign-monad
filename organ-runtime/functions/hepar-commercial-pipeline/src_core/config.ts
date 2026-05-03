import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { OrganRuntimeConfig, RuntimeMode } from './types';

dotenv.config();

export interface OrganRuntimeServiceConfig {
  logLevel: string;
  runtimeMode: RuntimeMode;
  runtimeConfigPath: string;
}

let configInstance: OrganRuntimeServiceConfig | null = null;

export function getServiceConfig(): OrganRuntimeServiceConfig {
  if (configInstance) return configInstance;

  configInstance = {
    logLevel: process.env.LOG_LEVEL || 'info',
    runtimeMode: (process.env.ORGAN_RUNTIME_MODE as RuntimeMode) || 'analysis',
    runtimeConfigPath:
      process.env.ORGAN_RUNTIME_CONFIG ||
      path.resolve(process.cwd(), 'config', 'runtime.json'),
  };

  return configInstance;
}

export function loadRuntimeConfig(configPath: string): OrganRuntimeConfig {
  const resolved = path.isAbsolute(configPath)
    ? configPath
    : path.resolve(process.cwd(), configPath);

  if (!fs.existsSync(resolved)) {
    throw new Error(
      `Organ runtime config not found: ${resolved}\n` +
        `Copy organ-runtime/config/runtime.example.json to ${resolved} and fill in the current operating truth.`,
    );
  }

  const raw = fs.readFileSync(resolved, 'utf8').replace(/^\uFEFF/, '');
  return JSON.parse(raw) as OrganRuntimeConfig;
}
