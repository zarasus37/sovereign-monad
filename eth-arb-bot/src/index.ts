/**
 * Historical reference artifact retained for possible future legacy execution reactivation.
 * Ethereum-side execution entrypoint for the Sovereign Monad runtime.
 */

import { EthArbBot } from './service';
import { createLogger } from './utils/logger';

const logger = createLogger('main');
let bot: EthArbBot | null = null;

async function main(): Promise<void> {
  bot = new EthArbBot();
  await bot.start();
}

process.on('SIGINT', async () => {
  logger.info('Shutting down');
  if (bot) await bot.stop();
  process.exit(0);
});

main();

