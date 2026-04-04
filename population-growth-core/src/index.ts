import path from 'path';
import { buildPopulationGrowthSnapshot, loadLocalPopulationGrowthSnapshot } from './growth';
import {
  PopulationGap,
  PopulationGrowthEvent,
  PopulationGrowthMetrics,
  PopulationGrowthRecommendation,
  PopulationGrowthSnapshot,
  PopulationGrowthThresholds,
} from './types';

export { buildPopulationGrowthSnapshot, loadLocalPopulationGrowthSnapshot };
export type {
  PopulationGap,
  PopulationGrowthEvent,
  PopulationGrowthMetrics,
  PopulationGrowthRecommendation,
  PopulationGrowthSnapshot,
  PopulationGrowthThresholds,
};

function main() {
  const snapshot = loadLocalPopulationGrowthSnapshot(path.resolve(__dirname, '..', '..'));
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
