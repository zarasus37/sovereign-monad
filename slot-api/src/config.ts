import dotenv from 'dotenv';
import path from 'path';
dotenv.config();

export interface ApiConfig {
  port: number;
  logLevel: string;
  /** Absolute path to the slot-source JSON config file. */
  sourceConfigPath: string;
}

let instance: ApiConfig | null = null;

export function getConfig(): ApiConfig {
  if (instance) return instance;

  const rawPath =
    process.env.SLOT_SOURCE_CONFIG ||
    path.resolve(__dirname, '../../slot-core/config/slot-source.json');

  instance = {
    port: parseInt(process.env.PORT || '4020', 10),
    logLevel: process.env.LOG_LEVEL || 'info',
    sourceConfigPath: path.isAbsolute(rawPath)
      ? rawPath
      : path.resolve(process.cwd(), rawPath),
  };

  return instance;
}
