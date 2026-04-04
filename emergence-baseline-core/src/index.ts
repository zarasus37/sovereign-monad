import path from 'path';
import {
  buildEmergenceBaselineSnapshot,
  loadLocalEmergenceBaselineSnapshot,
} from './baseline';
import { EmergenceBaselineSnapshot, EmergenceObservationWindow } from './types';

export { buildEmergenceBaselineSnapshot, loadLocalEmergenceBaselineSnapshot };
export type { EmergenceBaselineSnapshot, EmergenceObservationWindow };

function main() {
  const snapshot = loadLocalEmergenceBaselineSnapshot(path.resolve(__dirname, '..', '..'));
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
