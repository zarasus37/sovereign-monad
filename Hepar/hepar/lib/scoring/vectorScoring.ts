/**
 * HEPAR - vectorScoring.ts
 * Tier: ADVISORY (fixture-verified only, not live-telemetry-verified)
 *
 * Implements the per-vector risk contribution formula (binding):
 *
 *   risk(v) = severity(v) * 0.55
 *           + consensus(v) * 0.25
 *           + repro(v)     * 0.20
 *           + proofterm(v)
 *
 * proofterm(v):
 *   'counterexample-found' -> 1.0
 *   'unknown/timeout'      -> 0.5
 *   'proved-safe'          -> 0.0
 *
 * All three proofterm states are required.
 * Dropping any state is a tier-discipline violation per Stage B spec.
 */

import type { FindingVector, SymbolicResult } from '../../types/hepar.types';
import { convergenceLabelFromRatio } from './convergenceLabels';

export const WEIGHT_SEVERITY  = 0.55;
export const WEIGHT_CONSENSUS = 0.25;
export const WEIGHT_REPRO     = 0.20;

/**
 * proofterm - maps SymbolicResult to its numeric contribution.
 * All three states must remain handled; the exhaustive check is intentional.
 */
export function proofterm(status: SymbolicResult): number {
  switch (status) {
    case 'counterexample-found': return 1.0;
    case 'unknown/timeout':      return 0.5;
    case 'proved-safe':          return 0.0;
    default: {
      const _exhaustive: never = status;
      throw new Error(`Unhandled SymbolicResult: ${_exhaustive}`);
    }
  }
}

/**
 * scoreVector - computes risk(v) for a single FindingVector.
 * Also attaches the convergence label to the vector for downstream consumers.
 */
export function scoreVector(v: FindingVector): number {
  if (v.severity < 0 || v.severity > 10) {
    throw new RangeError(
      `severity must be in [0, 10], got ${v.severity} for vector ${v.vectorId}`,
    );
  }
  if (v.consensus < 0 || v.consensus > 1) {
    throw new RangeError(
      `consensus must be in [0, 1], got ${v.consensus} for vector ${v.vectorId}`,
    );
  }
  if (v.repro < 0 || v.repro > 1) {
    throw new RangeError(
      `repro must be in [0, 1], got ${v.repro} for vector ${v.vectorId}`,
    );
  }

  const severityTerm  = v.severity  * WEIGHT_SEVERITY;
  const consensusTerm = v.consensus * WEIGHT_CONSENSUS;
  const reproTerm     = v.repro     * WEIGHT_REPRO;
  const prooftermVal  = proofterm(v.proofStatus);

  const risk = severityTerm + consensusTerm + reproTerm + prooftermVal;

  // Attach convergence label so downstream callers don't need to recompute
  v.convergenceLabel = convergenceLabelFromRatio(v.consensus);

  return risk;
}

export interface ScoredVector {
  vector: FindingVector;
  riskScore: number;
}

/**
 * scoreVectors - scores a batch; returns sorted descending by riskScore.
 */
export function scoreVectors(vectors: FindingVector[]): ScoredVector[] {
  return vectors
    .map((v) => ({ vector: v, riskScore: scoreVector(v) }))
    .sort((a, b) => b.riskScore - a.riskScore);
}
