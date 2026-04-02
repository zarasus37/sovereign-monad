import { FeedbackLogger } from './service';
import { createLogger } from './utils/logger';

const logger = createLogger('main');
let loggerInstance: FeedbackLogger | null = null;

async function main(): Promise<void> {
  loggerInstance = new FeedbackLogger();
  await loggerInstance.start();
}

process.on('SIGINT', async () => {
  logger.info('Shutting down');
  if (loggerInstance) await loggerInstance.stop();
  process.exit(0);
});

main();
