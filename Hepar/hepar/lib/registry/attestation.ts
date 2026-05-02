// hepar/lib/registry/attestation.ts
// On-chain attestation payload builder and posting stub.
// Monad role: coordination and attestation path ONLY.
// ADVISORY tier: postedOnChain = false, transportStatus = 'STUB' always.
//
// evidenceMerkleRoot is computed identically to Stage D so the same root
// appears in both the off-chain StageDResult and the on-chain AttestationRecord.

import type { ActionBand, ConvergenceLabel } from '../../types/hepar.types';
import type { FullHeparRunResult, ScoredFindingVector } from '../stages/stageD-consensus';
import { getConvergenceLabel } from '../scoring/convergenceLabels';

// ---------------------------------------------------------------------------
// Public interfaces
// ---------------------------------------------------------------------------

export interface AttestationRecord {
  protocolId: string;
  codeHash: string;
  heparRunId: string;
  riskScore: number;
  actionBand: ActionBand;
  topVectorFingerprints: {
    vectorId: string;
    severity: number;
    consensusRate: number;
    convergenceLabel: ConvergenceLabel;
  }[];
  coverageRatio: number;
  unknownRatio: number;
  evidenceMerkleRoot: string;
  signerSet: string[];
  signerThreshold: number;
  postedOnChain: boolean;
  monadTxHash?: string;             // absent at Advisory tier
  attestedAt: number;
  transportStatus: 'STUB' | 'LIVE';
}

export interface AttestationPostResult {
  success: boolean;
  transportStatus: 'STUB' | 'LIVE';
  record: AttestationRecord;
  postedAt: number;
  monadTxHash?: string;             // absent at Advisory tier
}

// ---------------------------------------------------------------------------
// buildAttestationRecord
// ---------------------------------------------------------------------------

export function buildAttestationRecord(result: FullHeparRunResult): AttestationRecord {
  const { stageD, heparRunId, protocolId } = result;
  const { attestationPayload, scoredVectors, actionBand } = stageD;

  // Top 5 fingerprints sorted by severity descending.
  const top5: ScoredFindingVector[] = [...scoredVectors]
    .sort((a, b) => b.vector.severity - a.vector.severity)
    .slice(0, 5);

  return {
    protocolId,
    codeHash:   attestationPayload.codeHash,
    heparRunId,
    riskScore:  stageD.globalScore,
    actionBand,
    topVectorFingerprints: top5.map(sv => ({
      vectorId:        sv.vector.vectorId,
      severity:        sv.vector.severity,
      consensusRate:   sv.vector.consensus,
      convergenceLabel: sv.vector.convergenceLabel
        ?? getConvergenceLabel(sv.vector.agentsFound, sv.vector.totalAgents)
    })),
    // Use the attestationPayload ratios -- identical computation to Stage D.
    coverageRatio:     attestationPayload.coverageRatio,
    unknownRatio:      attestationPayload.unknownRatio,
    // evidenceMerkleRoot is taken directly from Stage D to guarantee identity.
    evidenceMerkleRoot: attestationPayload.evidenceMerkleRoot,
    signerSet:         ['ADVISORY_STUB'],
    signerThreshold:   1,
    postedOnChain:     false,
    // monadTxHash absent at Advisory tier
    attestedAt:        Date.now(),
    transportStatus:   'STUB'
  };
}

// ---------------------------------------------------------------------------
// postAttestation
// ---------------------------------------------------------------------------

export function postAttestation(record: AttestationRecord): AttestationPostResult {
  // Advisory tier: stub transport. No live Monad interaction.
  // The interface is written so that wiring live posting requires only
  // replacing this transport adapter -- all upstream code remains unchanged.
  return {
    success:         true,
    transportStatus: 'STUB',
    record:          { ...record, postedOnChain: false },
    postedAt:        Date.now()
    // monadTxHash: absent at Advisory tier
  };
}
