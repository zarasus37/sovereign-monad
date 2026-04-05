import path from 'path';
import { buildExecutionTruthSnapshot, loadLocalExecutionTruthSnapshot } from './snapshot';
import {
  ExecutionTruthInput,
  ExecutionTruthPolicy,
  ExecutionTruthRecord,
  ExecutionTruthSnapshot,
  ExecutionTruthStatus,
} from './types';

export { buildExecutionTruthSnapshot, loadLocalExecutionTruthSnapshot };
export type {
  ExecutionTruthInput,
  ExecutionTruthPolicy,
  ExecutionTruthRecord,
  ExecutionTruthSnapshot,
  ExecutionTruthStatus,
};

function main() {
  const snapshot = loadLocalExecutionTruthSnapshot(path.resolve(__dirname, '..', '..'));
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
