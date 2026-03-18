import { BridgeExecutorBot } from './service';
import { createLogger } from './utils/logger';

const logger = createLogger('main');
let bot: BridgeExecutorBot | null = null;

async function main(): Promise<void> {
  bot = new BridgeExecutorBot();
  await bot.start();
}

process.on('SIGINT', async () => {
  logger.info('Shutting down');
  if (bot) await bot.stop();
  process.exit(0);
});

main();
