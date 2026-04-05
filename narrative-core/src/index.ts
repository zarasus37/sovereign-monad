import path from 'path';
import { buildNarrativeSnapshot, loadLocalNarrativeSnapshot } from './narrative';
import { NarrativeArtifact, NarrativeInput, NarrativeSnapshot } from './types';

export { buildNarrativeSnapshot, loadLocalNarrativeSnapshot };
export type { NarrativeArtifact, NarrativeInput, NarrativeSnapshot };

function main() {
  const snapshot = loadLocalNarrativeSnapshot(path.resolve(__dirname, '..', '..'));
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
