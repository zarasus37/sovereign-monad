/**
 * HEPAR - convergenceLabels.ts
 * Tier: ADVISORY (fixture-verified only, not live-telemetry-verified)
 *
 * Maps agentsFound / totalAgents ratios to ConvergenceLabel.
 *
 * Thresholds:
 *   5/5 = 1.00 -> CERTAIN
 *   4/5 = 0.80 -> HIGH
 *   3/5 = 0.60 -> PROBABLE
 *   2/5 = 0.40 -> POSSIBLE
 *   1/5 = 0.20 -> EDGE_CASE
 *   0/5 = 0.00 -> EDGE_CASE (degenerate)
 */

import type { ConvergenceLabel } from '../../types/hepar.types';

export function getConvergenceLabel(
  agentsFound: number,
  totalAgents: number,
): ConvergenceLabel {
  if (totalAgents <= 0) {
    throw new RangeError(`totalAgents must be > 0, got ${totalAgents}`);
  }
  if (agentsFound < 0 || agentsFound > totalAgents) {
    throw new RangeError(
      `agentsFound (${agentsFound}) must be in [0, ${totalAgents}]`,
    );
  }

  const ratio = agentsFound / totalAgents;
  return convergenceLabelFromRatio(ratio);
}

export function convergenceLabelFromRatio(ratio: number): ConvergenceLabel {
  if (ratio >= 1.0) return 'CERTAIN';
  if (ratio >= 0.8) return 'HIGH';
  if (ratio >= 0.6) return 'PROBABLE';
  if (ratio >= 0.4) return 'POSSIBLE';
  return 'EDGE_CASE';
}
