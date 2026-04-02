/**
 * Pino logger instance for structured logging
 */

import pino from 'pino';
import { getConfig } from '../config';

const config = getConfig();

export const logger = pino({
  level: config.logLevel,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
    },
  },
  formatters: {
    level: (label: string) => {
      return { level: label };
    },
  },
});

export function createLogger(name: string) {
  return logger.child({ component: name });
}

