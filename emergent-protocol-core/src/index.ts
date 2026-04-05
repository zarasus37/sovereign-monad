import path from 'path';
import {
  buildEmergentProtocolSnapshot,
  loadExampleEmergentProtocolSnapshot,
  loadLocalEmergentProtocolSnapshot,
} from './protocol';
import {
  EmergentPatternDefinition,
  EmergentProtocolCandidate,
  EmergentProtocolInput,
  EmergentProtocolSnapshot,
} from './types';

export {
  buildEmergentProtocolSnapshot,
  loadExampleEmergentProtocolSnapshot,
  loadLocalEmergentProtocolSnapshot,
};
export type {
  EmergentPatternDefinition,
  EmergentProtocolCandidate,
  EmergentProtocolInput,
  EmergentProtocolSnapshot,
};

function main() {
  const snapshot = loadLocalEmergentProtocolSnapshot(path.resolve(__dirname, '..', '..'));
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
