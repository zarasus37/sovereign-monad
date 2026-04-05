import path from 'path';
import {
  buildEmergenceAccumulatorSnapshot,
  loadLocalEmergenceAccumulatorSnapshot,
} from './accumulator';
import { EmergenceAccumulationPolicy, EmergenceAccumulationSnapshot } from './types';

export { buildEmergenceAccumulatorSnapshot, loadLocalEmergenceAccumulatorSnapshot };
export type { EmergenceAccumulationPolicy, EmergenceAccumulationSnapshot };

function main() {
  const snapshot = loadLocalEmergenceAccumulatorSnapshot(path.resolve(__dirname, '..', '..'));
  process.stdout.write(`${JSON.stringify(snapshot, null, 2)}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    process.exitCode = 1;
  }
}
