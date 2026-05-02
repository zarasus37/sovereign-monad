// hepar/lib/registry/correctionProtocol.ts
// s15.4 correction workflow and dispute protocol.
//
// INVARIANT: History is NEVER rewritten. Original findings are preserved.
// A correction appends a new RegistryStatusChange referencing the correctionId.
// The original RegistryStatusChange is never removed or modified.

import type { RegistryStatus } from '../../types/hepar.types';
import type { RegistryEntry, RegistryStatusChange } from './registryManager';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface CorrectionRecord {
  correctionId: string;
  originalHeparRunId: string;
  protocolId: string;
  incorrectVectorIds: string[];
  correctionReason: string;
  correctedStatus?: RegistryStatus;         // what the status should now be
  originalFindingPreserved: boolean;        // always true -- history is never deleted
  correctionNoticePublished: boolean;       // must match prominence of original finding
  affectedProtocolNotified: boolean;
  walletFlagsUnwound: boolean;             // wallet-cluster flags derived from wrong finding
  reviewerId: string;                       // independent reviewer, different from original analyst
  correctedAt: number;
}

export interface DisputeRecord {
  disputeId: string;
  heparRunId: string;
  protocolId: string;
  disputeFiledAt: number;
  disputedVectorIds: string[];
  protocolCounterArgument: string;
  status: 'UNDER_REVIEW' | 'FINDING_UPHELD' | 'FINDING_OVERTURNED' | 'INCONCLUSIVE';
  reviewerId: string;                       // different reviewer from original sign-off
  publicStatusDuringReview: 'YELLOW';      // always YELLOW during dispute
  resolvedAt?: number;
  resolution?: string;
}

// ---------------------------------------------------------------------------
// ID generators
// ---------------------------------------------------------------------------

function generateCorrectionId(): string {
  return `CORR-${Date.now()}-${Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0')}`;
}

function generateDisputeId(): string {
  return `DISP-${Date.now()}-${Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0')}`;
}

// ---------------------------------------------------------------------------
// initiateCorrectionProtocol
// ---------------------------------------------------------------------------

export function initiateCorrectionProtocol(
  originalRunId: string,
  protocolId: string,
  incorrectVectorIds: string[],
  correctionReason: string,
  reviewerId: string
): CorrectionRecord {
  if (!reviewerId || reviewerId.trim() === '') {
    throw new Error('Correction protocol requires a non-empty reviewerId (independent reviewer).');
  }
  if (!correctionReason || correctionReason.trim() === '') {
    throw new Error('Correction protocol requires a non-empty correctionReason.');
  }
  if (!incorrectVectorIds || incorrectVectorIds.length === 0) {
    throw new Error('Correction protocol requires at least one incorrectVectorId.');
  }

  return {
    correctionId:               generateCorrectionId(),
    originalHeparRunId:         originalRunId,
    protocolId,
    incorrectVectorIds:         [...incorrectVectorIds],
    correctionReason,
    originalFindingPreserved:   true,   // INVARIANT: always true
    correctionNoticePublished:  false,  // operator sets this when notice goes live
    affectedProtocolNotified:   false,  // operator sets this after notifying protocol team
    walletFlagsUnwound:         true,   // wallet-cluster flags derived from wrong finding are unwound
    reviewerId,
    correctedAt:                Date.now()
  };
}

// ---------------------------------------------------------------------------
// fileDispute
// ---------------------------------------------------------------------------

export function fileDispute(
  heparRunId: string,
  protocolId: string,
  disputedVectorIds: string[],
  counterArgument: string,
  reviewerId: string
): DisputeRecord {
  if (!reviewerId || reviewerId.trim() === '') {
    throw new Error('Dispute filing requires a non-empty reviewerId.');
  }
  if (!counterArgument || counterArgument.trim() === '') {
    throw new Error('Dispute filing requires a non-empty counterArgument.');
  }

  return {
    disputeId:                 generateDisputeId(),
    heparRunId,
    protocolId,
    disputeFiledAt:            Date.now(),
    disputedVectorIds:         [...disputedVectorIds],
    protocolCounterArgument:   counterArgument,
    status:                    'UNDER_REVIEW',
    reviewerId,
    publicStatusDuringReview:  'YELLOW'   // always YELLOW during dispute
  };
}

// ---------------------------------------------------------------------------
// resolveDispute
// ---------------------------------------------------------------------------

export function resolveDispute(
  dispute: DisputeRecord,
  resolution: 'FINDING_UPHELD' | 'FINDING_OVERTURNED' | 'INCONCLUSIVE',
  resolutionNotes: string
): DisputeRecord {
  if (dispute.status !== 'UNDER_REVIEW') {
    throw new Error(
      `Dispute ${dispute.disputeId} is not UNDER_REVIEW (current status: ${dispute.status}). ` +
      `Cannot resolve a dispute that has already been resolved.`
    );
  }
  if (!resolutionNotes || resolutionNotes.trim() === '') {
    throw new Error('Dispute resolution requires non-empty resolutionNotes.');
  }

  return {
    ...dispute,
    status:     resolution,
    resolvedAt: Date.now(),
    resolution: resolutionNotes
  };
}

// ---------------------------------------------------------------------------
// applyCorrection
// ---------------------------------------------------------------------------

export function applyCorrection(
  entry: RegistryEntry,
  correction: CorrectionRecord
): RegistryEntry {
  // INVARIANT: original findings are never deleted -- only a new change is appended.
  // The correctionFlag identifies the pending correction.

  // Build the new RegistryStatusChange referencing the correctionId.
  const correctionChange: RegistryStatusChange = {
    fromStatus:  entry.currentStatus,
    toStatus:    correction.correctedStatus ?? entry.currentStatus,
    reason:      `Correction applied: ${correction.correctionReason} [correctionId=${correction.correctionId}]`,
    triggeredBy: correction.correctionId,
    timestamp:   correction.correctedAt,
    reviewerSignOff: correction.reviewerId
  };

  const newStatus = correction.correctedStatus ?? entry.currentStatus;
  const externalPublicationCleared = newStatus === 'GREEN' || newStatus === 'YELLOW';

  return {
    ...entry,
    currentStatus:              newStatus,
    externalPublicationCleared,
    // Append -- never remove the original statusHistory entries.
    statusHistory:              [...entry.statusHistory, correctionChange],
    correctionFlag:             correction.correctionId,
    // Remove from activeFindings the vectors that were incorrect.
    activeFindings:             entry.activeFindings.filter(
      vid => !correction.incorrectVectorIds.includes(vid)
    )
  };
}
