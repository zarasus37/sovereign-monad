import pino from 'pino';
import { getConfig } from '../config';

export const logger = pino({ level: getConfig().logLevel });
export const createLogger = (name: string) => logger.child({ component: name });

