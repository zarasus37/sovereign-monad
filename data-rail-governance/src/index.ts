import path from 'path';
import {
  buildGovernanceSnapshot,
  evaluateDiversityThresholds,
  evaluateExternalizationDecision,
  loadLocalGovernanceSnapshot,
} from './governance';
import {
  DataRailGovernanceSnapshot,
  DiversityThresholdEvaluation,
  DiversityThresholds,
  ExternalizationDecision,
  GovernedBehaviorEvent,
  RightsPolicy,
} from './types';

export {
  buildGovernanceSnapshot,
  evaluateDiversityThresholds,
  evaluateExternalizationDecision,
  loadLocalGovernanceSnapshot,
};
export type {
  DataRailGovernanceSnapshot,
  DiversityThresholdEvaluation,
  DiversityThresholds,
  ExternalizationDecision,
  GovernedBehaviorEvent,
  RightsPolicy,
};

function main() {
  const snapshot: DataRailGovernanceSnapshot = loadLocalGovernanceSnapshot(
    path.resolve(__dirname, '..', '..', '..'),
  );
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
