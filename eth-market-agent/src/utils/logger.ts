import pino from 'pino';
import { getConfig } from '../config';

const config = getConfig();

export const logger = pino({
  level: config.logLevel,
  formatters: { level: (label) => ({ level: label }) },
});

export function createLogger(name: string) {
  return logger.child({ component: name });
}

