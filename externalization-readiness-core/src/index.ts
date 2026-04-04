import path from 'path';
import {
  buildExternalizationReadinessSnapshot,
  loadLocalExternalizationReadinessSnapshot,
} from './readiness';
import {
  ExternalizationReadinessInput,
  ExternalizationReadinessSnapshot,
  ExternalizationReadinessStatus,
} from './types';

export { buildExternalizationReadinessSnapshot, loadLocalExternalizationReadinessSnapshot };
export type {
  ExternalizationReadinessInput,
  ExternalizationReadinessSnapshot,
  ExternalizationReadinessStatus,
};

function main() {
  const snapshot = loadLocalExternalizationReadinessSnapshot(path.resolve(__dirname, '..', '..'));
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
