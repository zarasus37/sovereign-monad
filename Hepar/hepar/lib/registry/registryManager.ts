// hepar/lib/registry/registryManager.ts
// Registry status management, status transitions, and query interface.
// The registry is an append-only ledger -- history is never removed.
//
// ADVISORY tier: all assessments are fixture-verified only.
// BLACK is permanent. RED/BLACK require full sign-off before external publication.

import type { RegistryStatus, ActionBand } from '../../types/hepar.types';
import type { FullHeparRunResult } from '../stages/stageD-consensus';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface RegistryStatusChange {
  fromStatus: RegistryStatus | null;    // null for initial entry
  toStatus: RegistryStatus;
  reason: string;
  triggeredBy: string;                  // heparRunId or correctionId
  timestamp: number;
  reviewerSignOff?: string;            // required for RED -> BLACK
}

export interface RegistryEntry {
  protocolId: string;
  currentStatus: RegistryStatus;
  lastAssessedAt: number;
  lastHeparRunId: string;
  riskScoreHistory: { score: number; runId: string; timestamp: number }[];
  statusHistory: RegistryStatusChange[];
  activeFindings: string[];             // vectorIds of current active findings
  monitoringActive: boolean;
  externalPublicationCleared: boolean;  // false until s15 review complete for RED/BLACK
  blacklistReason?: string;             // populated if BLACK
  correctionFlag?: string;             // populated if a correction is pending
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Map initial action band to registry status on first entry. */
function initialStatusFromBand(band: ActionBand): RegistryStatus {
  switch (band) {
    case 'ALLOW':
    case 'GUARDED_ALLOW':
      return 'GREEN';
    case 'RESTRICTED':
      return 'YELLOW';
    case 'DENY':
    case 'HARDBLOCK':
      return 'RED';
  }
}

/** Compute externalPublicationCleared from current status.
 * RED and BLACK always require full s15 posture -- never auto-cleared.
 * GREEN and YELLOW are cleared for publication. */
function computePublicationCleared(status: RegistryStatus): boolean {
  return status === 'GREEN' || status === 'YELLOW';
}

// ---------------------------------------------------------------------------
// createRegistryEntry
// ---------------------------------------------------------------------------

export function createRegistryEntry(
  protocolId: string,
  initialResult: FullHeparRunResult
): RegistryEntry {
  const { stageD, heparRunId, completedAt } = initialResult;
  const initialStatus = initialStatusFromBand(stageD.actionBand);

  const initialChange: RegistryStatusChange = {
    fromStatus:  null,
    toStatus:    initialStatus,
    reason:      `Initial registry entry from Hepar run ${heparRunId}. ActionBand=${stageD.actionBand}.`,
    triggeredBy: heparRunId,
    timestamp:   completedAt
  };

  const activeFindings = stageD.findingVectors
    .filter(v => v.severity >= 7)
    .map(v => v.vectorId);

  return {
    protocolId,
    currentStatus:              initialStatus,
    lastAssessedAt:             completedAt,
    lastHeparRunId:             heparRunId,
    riskScoreHistory:           [{ score: stageD.globalScore, runId: heparRunId, timestamp: completedAt }],
    statusHistory:              [initialChange],
    activeFindings,
    monitoringActive:           true,
    externalPublicationCleared: computePublicationCleared(initialStatus),
    ...(initialStatus === 'BLACK'
      ? { blacklistReason: stageD.hardBlockReasons[0] ?? 'Confirmed scam/exploit' }
      : {})
  };
}

// ---------------------------------------------------------------------------
// transitionStatus
// ---------------------------------------------------------------------------

export function transitionStatus(
  entry: RegistryEntry,
  toStatus: RegistryStatus,
  reason: string,
  triggeredBy: string,
  reviewerSignOff?: string
): RegistryEntry {
  const fromStatus = entry.currentStatus;

  // Guard: reason is required
  if (!reason || reason.trim() === '') {
    throw new Error(
      `Registry transition from ${fromStatus} to ${toStatus} requires a non-empty reason.`
    );
  }

  // Guard: BLACK is permanent -- no transitions out
  if (fromStatus === 'BLACK') {
    throw new Error(
      `Registry status BLACK is permanent. Protocol ${entry.protocolId} cannot be transitioned ` +
      `out of BLACK. Use correctionProtocol.ts if a correction is warranted.`
    );
  }

  // Guard: GREEN -> BLACK is invalid (must go through RED first)
  if (fromStatus === 'GREEN' && toStatus === 'BLACK') {
    throw new Error(
      `Invalid transition: GREEN -> BLACK for protocol ${entry.protocolId}. ` +
      `A protocol must reach RED before it can be transitioned to BLACK.`
    );
  }

  // Guard: RED -> BLACK requires reviewerSignOff
  if (fromStatus === 'RED' && toStatus === 'BLACK') {
    if (!reviewerSignOff || reviewerSignOff.trim() === '') {
      throw new Error(
        `Transition RED -> BLACK for protocol ${entry.protocolId} requires a non-empty ` +
        `reviewerSignOff. This transition cannot proceed without independent reviewer approval.`
      );
    }
  }

  const change: RegistryStatusChange = {
    fromStatus,
    toStatus,
    reason,
    triggeredBy,
    timestamp: Date.now(),
    ...(reviewerSignOff ? { reviewerSignOff } : {})
  };

  return {
    ...entry,
    currentStatus:              toStatus,
    externalPublicationCleared: computePublicationCleared(toStatus),
    statusHistory:              [...entry.statusHistory, change],
    ...(toStatus === 'BLACK'
      ? { blacklistReason: reason }
      : {})
  };
}

// ---------------------------------------------------------------------------
// updateRegistryEntry
// ---------------------------------------------------------------------------

export function updateRegistryEntry(
  entry: RegistryEntry,
  newResult: FullHeparRunResult,
  reviewerSignOff?: string
): RegistryEntry {
  const { stageD, heparRunId, completedAt } = newResult;

  const newRiskEntry = { score: stageD.globalScore, runId: heparRunId, timestamp: completedAt };

  let updated: RegistryEntry = {
    ...entry,
    lastAssessedAt:   completedAt,
    lastHeparRunId:   heparRunId,
    riskScoreHistory: [...entry.riskScoreHistory, newRiskEntry],
    activeFindings:   stageD.findingVectors.filter(v => v.severity >= 7).map(v => v.vectorId)
  };

  // Only escalate -- downward transitions require explicit clearing.
  const STATUS_RANK: Record<RegistryStatus, number> = { GREEN: 0, YELLOW: 1, RED: 2, BLACK: 3 };
  const newImpliedStatus = initialStatusFromBand(stageD.actionBand);
  if (STATUS_RANK[newImpliedStatus] > STATUS_RANK[entry.currentStatus]) {
    try {
      updated = transitionStatus(
        updated,
        newImpliedStatus,
        `Automatic status escalation from Hepar run ${heparRunId}. ActionBand=${stageD.actionBand}.`,
        heparRunId,
        reviewerSignOff
      );
    } catch {
      // Preserve current status if transition guard throws (e.g., already BLACK).
    }
  }

  return updated;
}

// ---------------------------------------------------------------------------
// getRegistryStatus / canPublishExternally
// ---------------------------------------------------------------------------

export function getRegistryStatus(entry: RegistryEntry): RegistryStatus {
  return entry.currentStatus;
}

export function canPublishExternally(entry: RegistryEntry): boolean {
  return entry.externalPublicationCleared;
}
