import { buildOracleSnapshot } from './oracle';
import { OracleInput, OracleSnapshot } from './types';

const SAMPLE_INPUT: OracleInput = {
  aggregate: {
    totalSignals: 4,
    byDomain: {
      capital: 1,
      research: 1,
      exchange: 1,
      integrity: 1,
      operations: 0,
      narrative: 0,
    },
    bySeverity: {
      low: 0,
      medium: 2,
      high: 2,
      critical: 0,
    },
    byLane: {
      fast: 2,
      slow: 2,
    },
    capitalSensitiveCount: 1,
    boundaryRelevantCount: 1,
  },
  interpretations: [
    { label: 'coordination_pressure', level: 'elevated' },
    { label: 'boundary_tension', level: 'elevated' },
    { label: 'exchange_readiness', level: 'elevated' },
    { label: 'capital_attention', level: 'elevated' },
    { label: 'operator_load', level: 'stable' },
  ],
  executionReadiness: 'bounded',
};

export { buildOracleSnapshot };
export type { OracleInput, OracleSnapshot };

function main() {
  const snapshot: OracleSnapshot = buildOracleSnapshot(SAMPLE_INPUT);
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
