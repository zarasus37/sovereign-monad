import path from 'path';
import { buildPublicActivationSnapshot, loadLocalPublicActivationSnapshot } from './snapshot';
import {
  PublicActivationInput,
  PublicActivationPolicy,
  PublicActivationRecord,
  PublicActivationSnapshot,
  PublicActivationStatus,
} from './types';

export { buildPublicActivationSnapshot, loadLocalPublicActivationSnapshot };
export type {
  PublicActivationInput,
  PublicActivationPolicy,
  PublicActivationRecord,
  PublicActivationSnapshot,
  PublicActivationStatus,
};

function main() {
  const snapshot = loadLocalPublicActivationSnapshot(path.resolve(__dirname, '..', '..'));
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
