/**
 * Entry point for risk-engine (Phase 5)
 */

import { RiskEngineService } from './service';
import { createLogger } from './utils/logger';

const logger = createLogger('main');
let service: RiskEngineService | null = null;

/**
 * Main entry point
 */
async function main(): Promise<void> {
  logger.info('Starting risk-engine (Phase 5)');

  try {
    service = new RiskEngineService();
    await service.start();
    logger.info('Risk Engine is running. Press Ctrl+C to stop.');
  } catch (error) {
    logger.error({ error }, 'Fatal error starting service');
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 */
async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Received shutdown signal');

  if (service) {
    try {
      await service.stop();
    } catch (error) {
      logger.error({ error }, 'Error during shutdown');
    }
  }

  logger.info('Shutdown complete');
  process.exit(0);
}

// Handle shutdown signals
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error({ error: error.message, stack: error.stack }, 'Uncaught exception');
  shutdown('uncaughtException').then(() => process.exit(1));
});

process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled rejection');
  shutdown('unhandledRejection').then(() => process.exit(1));
});

// Start the service
main();
