/**
 * HEPAR - cortex-escalation.ts
 * Tier: ADVISORY (fixture-verified only, not live-telemetry-verified)
 *
 * Routes full forensic data to Cortex organ for RESTRICTED-band protocols.
 *
 * Key rules (NON-NEGOTIABLE):
 *   - Cortex can override RESTRICTED to GUARDED_ALLOW or DENY.
 *   - Cortex can NEVER override to HARDBLOCK — only Hepar sets HARDBLOCK.
 *   - Cortex only receives data when actionBand = RESTRICTED OR
 *     cortexReviewFlagged = true.
 *   - HARDBLOCK routes to Cardia/Synapse, not Cortex.
 *   - requiresOperatorConfirmation = true always at Advisory tier.
 *
 * Transport: INTEGRATION_STUB at Advisory tier.
 */

import type { ActionBand, FindingVector } from '../../types/hepar.types';
import type { FullHeparRunResult, StageDResult } from '../stages/stageD-consensus';
import type { StageBResult } from '../stages/stageB-symbolic';

// ---------------------------------------------------------------------------
// CortexEscalationPackage
// ---------------------------------------------------------------------------

export type CortexEscalationReason =
  | 'RESTRICTED_BAND'
  | 'PROBABLE_VECTORS_FLAGGED'
  | 'BOTH';

export interface CortexEscalationPackage {
  heparRunId:                string;
  protocolId:                string;
  actionBand:                ActionBand;
  escalationReason:          CortexEscalationReason;
  /** All finding vectors, not just top 5. */
  fullFindingVectors:        FindingVector[];
  dimensionScores:           StageDResult['dimensionScores'];
  stageBSymbolicSummary:     StageBResult['summary'];
  hardBlockReasons:          string[];
  /**
   * Valid override options for Cortex.
   * HARDBLOCK is NEVER included — only Hepar sets HARDBLOCK.
   */
  recommendedOverrideOptions: ('GUARDED_ALLOW' | 'DENY')[];
  requiresOperatorConfirmation: boolean;   // always true at Advisory tier
  tierLabel:                 'ADVISORY';
  timestamp:                 number;
}

export interface CortexDeliveryResult {
  delivered:       boolean;
  transportStatus: 'STUB' | 'LIVE';
  package:         CortexEscalationPackage;
  sentAt:          number;
}

// ---------------------------------------------------------------------------
// shouldEscalateToCortex
// ---------------------------------------------------------------------------

/**
 * Returns true when Cortex escalation is warranted.
 *   - actionBand = RESTRICTED → always escalate
 *   - cortexReviewFlagged = true → always escalate (multiple PROBABLE vectors)
 *   - HARDBLOCK → FALSE (goes to Cardia/Synapse, not Cortex)
 *   - All other bands with no flag → false
 */
export function shouldEscalateToCortex(result: FullHeparRunResult): boolean {
  const { actionBand, cortexReviewFlagged } = result.stageD;
  if (actionBand === 'RESTRICTED') return true;
  if (cortexReviewFlagged) return true;
  return false;
}

// ---------------------------------------------------------------------------
// buildCortexEscalationPackage
// ---------------------------------------------------------------------------

export function buildCortexEscalationPackage(
  result: FullHeparRunResult
): CortexEscalationPackage {
  const { stageD, stageB, heparRunId, protocolId } = result;

  const isRestricted         = stageD.actionBand === 'RESTRICTED';
  const isProbableFlagged    = stageD.cortexReviewFlagged;

  let escalationReason: CortexEscalationReason;
  if (isRestricted && isProbableFlagged) {
    escalationReason = 'BOTH';
  } else if (isRestricted) {
    escalationReason = 'RESTRICTED_BAND';
  } else {
    escalationReason = 'PROBABLE_VECTORS_FLAGGED';
  }

  return {
    heparRunId,
    protocolId,
    actionBand:               stageD.actionBand,
    escalationReason,
    fullFindingVectors:       stageD.findingVectors,
    dimensionScores:          stageD.dimensionScores,
    stageBSymbolicSummary:    stageB.summary,
    hardBlockReasons:         stageD.hardBlockReasons,
    // Cortex can only override to GUARDED_ALLOW or DENY — NEVER HARDBLOCK
    recommendedOverrideOptions: ['GUARDED_ALLOW', 'DENY'],
    requiresOperatorConfirmation: true,   // always true at Advisory tier
    tierLabel:                'ADVISORY',
    timestamp:                Date.now()
  };
}

// ---------------------------------------------------------------------------
// sendToCortex — Advisory tier stub transport
// ---------------------------------------------------------------------------

export function sendToCortex(pkg: CortexEscalationPackage): CortexDeliveryResult {
  // INTEGRATION_STUB: no live Cortex runtime connected at Advisory tier.
  // Replace this adapter with the live forensic routing transport when ready.
  return {
    delivered:       true,
    transportStatus: 'STUB',
    package:         pkg,
    sentAt:          Date.now()
  };
}
