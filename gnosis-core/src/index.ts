import { buildGnosisSnapshot } from './gnosis';
import { GnosisInput, GnosisSnapshot } from './types';

const SAMPLE_INPUT: GnosisInput = {
  signal: {
    byDomain: {
      capital: 1,
      research: 1,
      exchange: 1,
      integrity: 1,
      operations: 0,
      narrative: 0,
    },
    interpretations: [
      { label: 'coordination_pressure', level: 'elevated' },
      { label: 'boundary_tension', level: 'elevated' },
      { label: 'exchange_readiness', level: 'elevated' },
      { label: 'capital_attention', level: 'elevated' },
      { label: 'operator_load', level: 'stable' },
    ],
  },
  oracle: {
    regime: 'balanced',
    confidence: 'medium',
    deploymentPosture: 'bounded',
    commercializationPosture: 'pilot_ready',
  },
  participation: {
    actorCount: 3,
    blockedDecisionCount: 1,
    operatorOverrideCount: 1,
  },
  mandate: {
    title: 'Bounded research-to-exchange internal loop',
    gateCheckCount: 2,
  },
};

export { buildGnosisSnapshot };
export type { GnosisInput, GnosisSnapshot };

function main() {
  const snapshot: GnosisSnapshot = buildGnosisSnapshot(SAMPLE_INPUT);
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
