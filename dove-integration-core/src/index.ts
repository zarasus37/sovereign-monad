import path from 'path';
import { buildDoveIntegrationSnapshot, loadLocalDoveIntegrationSnapshot } from './dove';
import { DoveIntegrationInput, DoveIntegrationSnapshot, DoveSignalRoute } from './types';

export { buildDoveIntegrationSnapshot, loadLocalDoveIntegrationSnapshot };
export type { DoveIntegrationInput, DoveIntegrationSnapshot, DoveSignalRoute };

function main() {
  const snapshot = loadLocalDoveIntegrationSnapshot(path.resolve(__dirname, '..', '..'));
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
