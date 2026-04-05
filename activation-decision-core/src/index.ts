import path from 'path';
import { buildActivationDecisionSnapshot, loadLocalActivationDecisionSnapshot } from './decision';
import {
  ActivationDecisionInput,
  ActivationDecisionPolicy,
  ActivationDecisionRecord,
  ActivationDecisionSnapshot,
  ActivationDecisionStatus,
  ActivationScope,
} from './types';

export { buildActivationDecisionSnapshot, loadLocalActivationDecisionSnapshot };
export type {
  ActivationDecisionInput,
  ActivationDecisionPolicy,
  ActivationDecisionRecord,
  ActivationDecisionSnapshot,
  ActivationDecisionStatus,
  ActivationScope,
};

function main() {
  const snapshot = loadLocalActivationDecisionSnapshot(path.resolve(__dirname, '..', '..'));
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
