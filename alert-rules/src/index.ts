import { AlertService } from './service';
import { createLogger } from './utils/logger';

const logger = createLogger('main');

async function main() {
  const service = new AlertService();

  process.on('SIGTERM', async () => {
    logger.info({ signal: 'SIGTERM' }, 'Shutting down');
    await service.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.info({ signal: 'SIGINT' }, 'Shutting down');
    await service.stop();
    process.exit(0);
  });

  await service.start();
}

main().catch((err) => {
  logger.error({ err }, 'Fatal error');
  process.exit(1);
});
