import { SpreadScanner } from './scanner';
import { createLogger } from './utils/logger';

const logger = createLogger('main');
let scanner: SpreadScanner | null = null;

async function main(): Promise<void> {
  logger.info('Starting spread-scanner');
  scanner = new SpreadScanner();
  await scanner.start();
}

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutting down');
  if (scanner) await scanner.stop();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

main();
