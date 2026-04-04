import { buildBoundaryStressSnapshot } from './monitor';
import { BoundaryStressInput, BoundaryStressSnapshot } from './types';

const SAMPLE_INPUT: BoundaryStressInput = {
  signal: {
    coordinationPressure: 'elevated',
    boundaryTension: 'elevated',
    capitalAttention: 'elevated',
    operatorLoad: 'stable',
  },
  oracle: {
    regime: 'balanced',
    deploymentPosture: 'bounded',
  },
  gnosis: {
    integrityStatus: 'contain',
    hollowConvergenceRisk: 'elevated',
    boundaryStress: 'elevated',
  },
  mandate: {
    gateCheckCount: 2,
    participationBlockedCount: 1,
  },
};

export { buildBoundaryStressSnapshot };
export type { BoundaryStressInput, BoundaryStressSnapshot };

function main() {
  const snapshot: BoundaryStressSnapshot = buildBoundaryStressSnapshot(SAMPLE_INPUT);
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
