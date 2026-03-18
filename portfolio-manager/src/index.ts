import { PortfolioManager } from './service';
import { createLogger } from './utils/logger';

const logger = createLogger('main');
let manager: PortfolioManager | null = null;

async function main(): Promise<void> {
  manager = new PortfolioManager();
  await manager.start();
}

process.on('SIGINT', async () => {
  logger.info('Shutting down');
  if (manager) await manager.stop();
  process.exit(0);
});

main();
