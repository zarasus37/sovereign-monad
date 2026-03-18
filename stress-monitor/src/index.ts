import { StressMonitor } from './service';
import { createLogger } from './utils/logger';

const logger = createLogger('main');
let monitor: StressMonitor | null = null;

async function main(): Promise<void> {
  monitor = new StressMonitor();
  await monitor.start();
}

process.on('SIGINT', async () => {
  logger.info('Shutting down');
  if (monitor) await monitor.stop();
  process.exit(0);
});

main();
