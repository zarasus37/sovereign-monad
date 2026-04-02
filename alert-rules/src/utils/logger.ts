import pino from 'pino';

export function createLogger(component: string) {
  return pino({
    level: process.env.LOG_LEVEL || 'info',
    name: component,
  });
}
