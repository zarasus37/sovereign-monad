/**
 * HEPAR - actionBand.ts
 * Tier: ADVISORY (fixture-verified only, not live-telemetry-verified)
 *
 * Assigns an ActionBand from the global risk score PLUS mandatory top-vector
 * escalation checks.
 *
 * SINGLE-SCALAR PROHIBITION (binding):
 * Never return an ActionBand based solely on the composite score.
 * Every call MUST evaluate top vectors and apply escalation rules.
 * Violating this is a False Validation flag and a tier-discipline violation.
 *
 * Escalation rules (priority order - highest wins):
 *   1. CERTAIN-confidence CRITICAL vector (severity >= 9) -> HARDBLOCK (overrides all)
 *   2. HIGH-confidence HIGH-severity vector (severity >= 7) -> minimum RESTRICTED
 *   2b. PROBABLE-confidence CRITICAL vector (severity >= 9) -> minimum RESTRICTED (PROBABLE_CRITICAL_RESTRICT)
 *   3. Multiple PROBABLE findings (>1) -> Cortex review, minimum RESTRICTED
 *   4. EDGE_CASE findings -> logged only, not action-blocking
 *
 * Score-to-band (applied after escalation floor):
 *   0-19   -> ALLOW
 *   20-39  -> GUARDED_ALLOW
 *   40-59  -> RESTRICTED
 *   60-79  -> DENY
 *   80-100 -> HARDBLOCK
 */

import type { ActionBand, FindingVector } from '../../types/hepar.types';
import { getConvergenceLabel } from './convergenceLabels';

const SEVERITY_CRITICAL = 9;
const SEVERITY_HIGH     = 7;

export interface EscalationReason {
  rule: 'CERTAIN_CRITICAL_HARDBLOCK'
       | 'HIGH_HIGH_RESTRICT'
       | 'PROBABLE_CRITICAL_RESTRICT'
       | 'MULTIPLE_PROBABLE_CORTEX'
       | 'SCORE_BAND';
  detail: string;
}

export interface ActionBandResult {
  /** Final action band after all escalation checks */
  band: ActionBand;
  /** Raw score-derived band before escalation overrides */
  scoreBand: ActionBand;
  /** Whether a top-vector escalation overrode the score band */
  escalated: boolean;
  /** Whether this result requires Cortex review */
  requiresCortexReview: boolean;
  /** Ordered list of reasons that determined the final band */
  reasons: EscalationReason[];
  /** Vectors that triggered escalation (for SINGLE-SCALAR PROHIBITION compliance) */
  triggeringVectors: FindingVector[];
}

/** bandFromScore - pure score-to-band mapping, no escalation applied */
export function bandFromScore(score: number): ActionBand {
  if (score < 0 || score > 100) {
    throw new RangeError(`Score must be in [0, 100], got ${score}`);
  }
  if (score < 20) return 'ALLOW';
  if (score < 40) return 'GUARDED_ALLOW';
  if (score < 60) return 'RESTRICTED';
  if (score < 80) return 'DENY';
  return 'HARDBLOCK';
}

const BAND_RANK: Record<ActionBand, number> = {
  ALLOW:         0,
  GUARDED_ALLOW: 1,
  RESTRICTED:    2,
  DENY:          3,
  HARDBLOCK:     4,
};

function maxBand(a: ActionBand, b: ActionBand): ActionBand {
  return BAND_RANK[a] >= BAND_RANK[b] ? a : b;
}

/**
 * assignActionBand - the authoritative entry point.
 *
 * SINGLE-SCALAR PROHIBITION: callers must surface triggeringVectors alongside
 * the returned band. Do not use band alone for go/no-go decisions.
 */
export function assignActionBand(
  globalRiskScore: number,
  vectors: FindingVector[],
): ActionBandResult {
  if (globalRiskScore < 0 || globalRiskScore > 100) {
    throw new RangeError(
      `globalRiskScore must be in [0, 100], got ${globalRiskScore}`,
    );
  }

  const scoreBand = bandFromScore(globalRiskScore);
  let finalBand: ActionBand = scoreBand;
  let escalated = false;
  let requiresCortexReview = false;
  const reasons: EscalationReason[] = [];
  const triggeringVectors: FindingVector[] = [];

  // Rule 1: CERTAIN + CRITICAL -> HARDBLOCK (highest priority, overrides all)
  const certainCritical = vectors.filter((v) => {
    const label = getConvergenceLabel(v.agentsFound, v.totalAgents);
    return label === 'CERTAIN' && v.severity >= SEVERITY_CRITICAL;
  });

  if (certainCritical.length > 0) {
    finalBand = 'HARDBLOCK';
    escalated = true;
    triggeringVectors.push(...certainCritical);
    reasons.push({
      rule: 'CERTAIN_CRITICAL_HARDBLOCK',
      detail:
        `${certainCritical.length} CERTAIN-confidence CRITICAL vector(s) ` +
        `found - automatic HARDBLOCK regardless of composite score`,
    });
  }

  // Rule 2: HIGH convergence + HIGH severity -> minimum RESTRICTED
  const highHigh = vectors.filter((v) => {
    const label = getConvergenceLabel(v.agentsFound, v.totalAgents);
    return label === 'HIGH' && v.severity >= SEVERITY_HIGH;
  });

  if (highHigh.length > 0) {
    const newBand = maxBand(finalBand, 'RESTRICTED');
    if (BAND_RANK[newBand] > BAND_RANK[finalBand]) {
      finalBand = newBand;
    }
    escalated = true;
    for (const v of highHigh) {
      if (!triggeringVectors.includes(v)) triggeringVectors.push(v);
    }
    reasons.push({
      rule: 'HIGH_HIGH_RESTRICT',
      detail:
        `${highHigh.length} HIGH-confidence HIGH-severity vector(s) ` +
        `found - minimum RESTRICTED`,
    });
  }

  // Rule 2b: PROBABLE + CRITICAL (3/5 agents, severity >= 9) -> minimum RESTRICTED
  // PROBABLE_CRITICAL_RESTRICT: high-severity partial-consensus exploits (flash-loan
  // oracle manipulation class) must not clear as ALLOW regardless of global score.
  const probableCritical = vectors.filter((v) => {
    const label = getConvergenceLabel(v.agentsFound, v.totalAgents);
    return label === 'PROBABLE' && v.severity >= SEVERITY_CRITICAL;
  });

  if (probableCritical.length > 0) {
    const newBand = maxBand(finalBand, 'RESTRICTED');
    if (BAND_RANK[newBand] > BAND_RANK[finalBand]) {
      finalBand = newBand;
    }
    escalated = true;
    for (const v of probableCritical) {
      if (!triggeringVectors.includes(v)) triggeringVectors.push(v);
    }
    reasons.push({
      rule: 'PROBABLE_CRITICAL_RESTRICT',
      detail:
        `${probableCritical.length} PROBABLE-confidence CRITICAL vector(s) ` +
        `(severity >= 9) found - minimum RESTRICTED`,
    });
  }

  // Rule 3: Multiple PROBABLE -> Cortex escalation, minimum RESTRICTED
  const probable = vectors.filter((v) => {
    const label = getConvergenceLabel(v.agentsFound, v.totalAgents);
    return label === 'PROBABLE';
  });

  if (probable.length > 1) {
    requiresCortexReview = true;
    const newBand = maxBand(finalBand, 'RESTRICTED');
    if (BAND_RANK[newBand] > BAND_RANK[finalBand]) {
      finalBand = newBand;
      escalated = true;
    }
    for (const v of probable) {
      if (!triggeringVectors.includes(v)) triggeringVectors.push(v);
    }
    reasons.push({
      rule: 'MULTIPLE_PROBABLE_CORTEX',
      detail:
        `${probable.length} PROBABLE finding(s) - escalating to Cortex for review`,
    });
  }

  // Always record the baseline score band reason
  reasons.push({
    rule: 'SCORE_BAND',
    detail: `Global risk score ${globalRiskScore.toFixed(2)} -> score band ${scoreBand}`,
  });

  // Rule 4: EDGE_CASE findings - logged only via vector list, no band change

  return {
    band: finalBand,
    scoreBand,
    escalated,
    requiresCortexReview,
    reasons,
    triggeringVectors,
  };
}
