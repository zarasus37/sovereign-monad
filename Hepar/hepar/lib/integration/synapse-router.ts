/**
 * HEPAR - synapse-router.ts
 * Tier: ADVISORY (fixture-verified only, not live-telemetry-verified)
 *
 * Routes Hepar risk verdict to Synapse organ.
 * Synapse receives: risk score + decision band + top vectors + urgency signal.
 * Synapse's job: route signal and urgency downstream without conflict.
 *
 * Transport: INTEGRATION_STUB at Advisory tier.
 * Replace the transport adapter to wire live Synapse runtime.
 */

import type { ActionBand, FindingVector } from '../../types/hepar.types';
import type { FullHeparRunResult } from '../stages/stageD-consensus';
import { scoreVector } from '../scoring/vectorScoring';

// ---------------------------------------------------------------------------
// SynapsePayload
// ---------------------------------------------------------------------------

export interface SynapsePayload {
  heparRunId:         string;
  protocolId:         string;
  riskScore:          number;
  actionBand:         ActionBand;
  urgency:            'IMMEDIATE' | 'ELEVATED' | 'STANDARD' | 'MONITOR';
  topVectors:         FindingVector[];   // top 5 by risk(v) descending
  hardBlockReasons:   string[];
  cortexReviewFlagged: boolean;
  tierLabel:          'ADVISORY';
  timestamp:          number;
}

export interface SynapseRoutingResult {
  delivered:       boolean;
  transportStatus: 'STUB' | 'LIVE';
  payload:         SynapsePayload;
  routedAt:        number;
}

// ---------------------------------------------------------------------------
// Urgency mapping
// ---------------------------------------------------------------------------

function urgencyFromBand(band: ActionBand): SynapsePayload['urgency'] {
  switch (band) {
    case 'HARDBLOCK':    return 'IMMEDIATE';
    case 'DENY':         return 'IMMEDIATE';
    case 'RESTRICTED':   return 'ELEVATED';
    case 'GUARDED_ALLOW': return 'STANDARD';
    case 'ALLOW':        return 'MONITOR';
    default: {
      const _exhaustive: never = band;
      throw new Error(`Unhandled ActionBand: ${_exhaustive}`);
    }
  }
}

// ---------------------------------------------------------------------------
// buildSynapsePayload
// ---------------------------------------------------------------------------

export function buildSynapsePayload(result: FullHeparRunResult): SynapsePayload {
  const { stageD, heparRunId, protocolId } = result;

  // Top 5 vectors by risk(v) descending
  const topVectors: FindingVector[] = [...stageD.scoredVectors]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5)
    .map(sv => sv.vector);

  return {
    heparRunId,
    protocolId,
    riskScore:          stageD.globalScore,
    actionBand:         stageD.actionBand,
    urgency:            urgencyFromBand(stageD.actionBand),
    topVectors,
    hardBlockReasons:   stageD.hardBlockReasons,
    cortexReviewFlagged: stageD.cortexReviewFlagged,
    tierLabel:          'ADVISORY',
    timestamp:          Date.now()
  };
}

// ---------------------------------------------------------------------------
// routeToSynapse — Advisory tier stub transport
// ---------------------------------------------------------------------------

export function routeToSynapse(payload: SynapsePayload): SynapseRoutingResult {
  // INTEGRATION_STUB: no live Synapse runtime connected at Advisory tier.
  // Replace this adapter with the live message bus transport when ready.
  return {
    delivered:       true,       // stub always acknowledges delivery
    transportStatus: 'STUB',
    payload,
    routedAt:        Date.now()
  };
}
