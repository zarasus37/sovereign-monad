/**
 * Logger Utility
 */

import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

export const createLogger = (component: string) => {
  return winston.createLogger({
    level: logLevel,
    defaultMeta: { component },
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
    ],
  });
};
