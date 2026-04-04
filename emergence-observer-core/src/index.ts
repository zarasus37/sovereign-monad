import path from 'path';
import {
  buildEmergenceObservationSnapshot,
  loadLocalEmergenceObservationSnapshot,
} from './emergence';
import { EmergenceObservationInput, EmergenceObservationSnapshot } from './types';

export { buildEmergenceObservationSnapshot, loadLocalEmergenceObservationSnapshot };
export type { EmergenceObservationInput, EmergenceObservationSnapshot };

function main() {
  const snapshot: EmergenceObservationSnapshot = loadLocalEmergenceObservationSnapshot(
    path.resolve(__dirname, '..', '..'),
  );
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
