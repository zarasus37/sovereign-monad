import { GameFiSourceMonitor } from './monitor';

export { GameFiSourceMonitor } from './monitor';
export { deriveState, validateSourceConfig } from './source-state';
export type {
  SourceLifecycleState,
  SourceEntry,
  GameFiSourceConfig,
  SourceHealthPayload,
} from './types';

async function main() {
  const monitor = new GameFiSourceMonitor();

  const shutdown = async () => {
    await monitor.stop();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  await monitor.start();
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err.message || err);
    process.exitCode = 1;
  });
}
