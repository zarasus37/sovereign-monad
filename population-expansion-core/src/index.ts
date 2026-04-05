import path from 'path';
import { buildPopulationExpansionSnapshot, loadLocalPopulationExpansionSnapshot } from './expansion';
import { PopulationExpansionGap, PopulationExpansionSnapshot, PopulationExpansionTarget } from './types';

export { buildPopulationExpansionSnapshot, loadLocalPopulationExpansionSnapshot };
export type { PopulationExpansionGap, PopulationExpansionSnapshot, PopulationExpansionTarget };

function main() {
  const snapshot = loadLocalPopulationExpansionSnapshot(path.resolve(__dirname, '..', '..'));
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
