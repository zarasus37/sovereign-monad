/**
 * Historical reference artifact retained for possible future legacy-market reactivation.
 * Ethereum-side market feed entrypoint for the Sovereign Monad runtime.
 */

import { createAgent } from './agent';
import { createLogger } from './utils/logger';

const logger = createLogger('main');
let agent: ReturnType<typeof createAgent> | null = null;

async function main(): Promise<void> {
  logger.info('Starting eth-market-agent');
  try {
    agent = createAgent();
    await agent.initialize();
    agent.start();
    logger.info('Agent running. Press Ctrl+C to stop.');
  } catch (error) {
    logger.error({ error }, 'Fatal error');
    process.exit(1);
  }
}

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutting down');
  if (agent) await agent.stop();
  process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('uncaughtException', (err) => {
  logger.error({ error: err.message }, 'Uncaught exception');
  shutdown('uncaughtException').then(() => process.exit(1));
});

main();

