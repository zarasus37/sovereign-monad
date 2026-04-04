import path from 'path';
import { buildBuilderPlan, deriveCapabilityMap, evaluateRecipe, loadLocalBuilderPlan } from './planner';

export { buildBuilderPlan, deriveCapabilityMap, evaluateRecipe, loadLocalBuilderPlan };
export type {
  BuilderCapability,
  BuilderDecision,
  BuilderPlan,
  BuilderRecipe,
  BuilderSummaryInput,
  SharedStateSnapshot,
} from './types';

function main() {
  const snapshot = loadLocalBuilderPlan(path.resolve(__dirname, '..', '..'));
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
