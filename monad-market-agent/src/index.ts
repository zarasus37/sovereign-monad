/**
 * Historical reference artifact retained for possible future Monad reactivation.
 * Monad-side market feed entrypoint for the Sovereign Monad runtime.
 *
 * Entry point for monad-market-agent
 * Handles graceful shutdown on SIGINT/SIGTERM
 */

import { createAgent, MonadMarketAgent } from './agent';
import { createLogger } from './utils/logger';

const logger = createLogger('main');

let agent: MonadMarketAgent | null = null;

async function main(): Promise<void> {
  logger.info('Starting monad-market-agent');

  try {
    // Create and initialize agent
    agent = createAgent();
    await agent.initialize();

    // Start listening for blocks
    agent.start();

    logger.info('Agent is running. Press Ctrl+C to stop.');
  } catch (error) {
    logger.error({ error }, 'Fatal error starting agent');
    process.exit(1);
  }
}

/**
 * Graceful shutdown handler
 */
async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Received shutdown signal');

  if (agent) {
    try {
      await agent.stop();
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

process.on('unhandledRejection', (reason: any) => {
  const msg = String(reason?.message ?? reason);
  // Don't crash on subscription errors â€” the RPC adapter handles failover
  if (msg.includes('Unsupported subscription') || msg.includes('newHeads')) {
    logger.warn({ reason: msg }, 'Suppressed subscription rejection (handled by polling fallback)');
    return;
  }
  logger.error({ reason }, 'Unhandled rejection');
  shutdown('unhandledRejection').then(() => process.exit(1));
});

// Start the agent
main();

