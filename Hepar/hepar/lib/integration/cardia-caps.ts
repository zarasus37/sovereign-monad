/**
 * HEPAR - cardia-caps.ts
 * Tier: ADVISORY (fixture-verified only, not live-telemetry-verified)
 *
 * Routes allocation caps derived from Hepar's action band to Cardia organ.
 *
 * Key rules (NON-NEGOTIABLE):
 *   - No capital deployed to any protocol without Hepar clearance.
 *   - HARDBLOCK = zero allocation, protocol blacklisted from all capital.
 *   - Only Hepar sets HARDBLOCK. Cardia CANNOT override it upward.
 *   - requiresOperatorConfirmation = true for ALL bands at Advisory tier.
 *     No automated capital action is permitted at Advisory tier regardless of band.
 *
 * Transport: INTEGRATION_STUB at Advisory tier.
 */

import type { ActionBand } from '../../types/hepar.types';
import type { FullHeparRunResult } from '../stages/stageD-consensus';

// ---------------------------------------------------------------------------
// CardiaAllocationCap
// ---------------------------------------------------------------------------

export interface CardiaAllocationCap {
  heparRunId:                  string;
  protocolId:                  string;
  actionBand:                  ActionBand;
  /** Maximum allocation in basis points of total deployable capital. */
  maxAllocationBps:            number;
  hardBlocked:                 boolean;
  /** Populated when hardBlocked = true. */
  blacklistReason?:            string;
  /**
   * Always true at Advisory tier.
   * No automated capital action is permitted without operator confirmation.
   */
  requiresOperatorConfirmation: boolean;
  tierLabel:                   'ADVISORY';
  timestamp:                   number;
}

export interface CardiaDeliveryResult {
  delivered:       boolean;
  transportStatus: 'STUB' | 'LIVE';
  cap:             CardiaAllocationCap;
  sentAt:          number;
}

// ---------------------------------------------------------------------------
// Allocation cap mapping
// ---------------------------------------------------------------------------

interface CapSpec {
  bps:         number;
  hardBlocked: boolean;
}

function capFromBand(band: ActionBand): CapSpec {
  switch (band) {
    case 'HARDBLOCK':     return { bps: 0,    hardBlocked: true };
    case 'DENY':          return { bps: 0,    hardBlocked: false }; // pending remediation, not permanent
    case 'RESTRICTED':    return { bps: 100,  hardBlocked: false }; // 1% max
    case 'GUARDED_ALLOW': return { bps: 500,  hardBlocked: false }; // 5% max
    case 'ALLOW':         return { bps: 2000, hardBlocked: false }; // 20% max
    default: {
      const _exhaustive: never = band;
      throw new Error(`Unhandled ActionBand: ${_exhaustive}`);
    }
  }
}

// ---------------------------------------------------------------------------
// buildCardiaAllocationCap
// ---------------------------------------------------------------------------

export function buildCardiaAllocationCap(result: FullHeparRunResult): CardiaAllocationCap {
  const { stageD, heparRunId, protocolId } = result;
  const { bps, hardBlocked } = capFromBand(stageD.actionBand);

  const cap: CardiaAllocationCap = {
    heparRunId,
    protocolId,
    actionBand:                  stageD.actionBand,
    maxAllocationBps:            bps,
    hardBlocked,
    requiresOperatorConfirmation: true,   // ALWAYS true at Advisory tier
    tierLabel:                   'ADVISORY',
    timestamp:                   Date.now()
  };

  if (hardBlocked) {
    const reasons = stageD.hardBlockReasons;
    cap.blacklistReason = reasons.length > 0
      ? reasons.join('; ')
      : 'HARDBLOCK issued by Hepar (reason details in run record)';
  }

  return cap;
}

// ---------------------------------------------------------------------------
// sendToCardia — Advisory tier stub transport
// ---------------------------------------------------------------------------

export function sendToCardia(cap: CardiaAllocationCap): CardiaDeliveryResult {
  // INTEGRATION_STUB: no live Cardia runtime connected at Advisory tier.
  // Replace this adapter with the live capital routing transport when ready.
  return {
    delivered:       true,
    transportStatus: 'STUB',
    cap,
    sentAt:          Date.now()
  };
}
