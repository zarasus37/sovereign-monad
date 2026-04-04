import path from 'path';
import dotenv from 'dotenv';
import { StateApiConfig } from './types';

dotenv.config();

export function getConfig(): StateApiConfig {
  const packageRoot = path.resolve(__dirname, '..');

  return {
    port: Number.parseInt(process.env.PORT || '4040', 10),
    logLevel: process.env.LOG_LEVEL || 'info',
    runtimeConfigPath:
      process.env.ORGAN_RUNTIME_CONFIG ||
      path.resolve(packageRoot, '..', 'organ-runtime', 'config', 'runtime.json'),
    packageRoot,
  };
}
