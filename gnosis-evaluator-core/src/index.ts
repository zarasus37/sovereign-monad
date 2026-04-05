import path from 'path';
import { buildGnosisEvaluationSnapshot, loadLocalGnosisEvaluationSnapshot } from './evaluator';
import { GnosisEvaluationInput, GnosisEvaluationSnapshot, OrganIntegrityScore } from './types';

export { buildGnosisEvaluationSnapshot, loadLocalGnosisEvaluationSnapshot };
export type { GnosisEvaluationInput, GnosisEvaluationSnapshot, OrganIntegrityScore };

function main() {
  const snapshot = loadLocalGnosisEvaluationSnapshot(path.resolve(__dirname, '..', '..'));
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
