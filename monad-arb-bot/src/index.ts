/**
 * Historical reference artifact retained for possible future Monad execution reactivation.
 * Monad-side execution entrypoint for the Sovereign Monad runtime.
 */

import { ArbitrageBot } from './service';
import { createLogger } from './utils/logger';

const logger = createLogger('main');
let bot: ArbitrageBot | null = null;

async function main(): Promise<void> {
  bot = new ArbitrageBot();
  await bot.start();
}

process.on('SIGINT', async () => {
  logger.info('Shutting down');
  if (bot) await bot.stop();
  process.exit(0);
});

main();

