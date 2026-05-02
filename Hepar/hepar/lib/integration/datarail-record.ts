/**
 * HEPAR - datarail-record.ts
 * Tier: ADVISORY (fixture-verified only, not live-telemetry-verified)
 *
 * Writes every assessment, every finding, every decision as a permanent
 * timestamped forensic record to Data Rail.
 *
 * Key rules (NON-NEGOTIABLE):
 *   - APPEND-ONLY. Records MUST NOT be overwritten.
 *   - Duplicate heparRunId submissions are rejected:
 *     written: false, reason: 'DUPLICATE_RUN_ID'
 *   - postedOnChain = false at Advisory tier.
 *   - monadTxHash is populated only when postedOnChain = true (not at Advisory tier).
 *
 * Transport: INTEGRATION_STUB at Advisory tier (in-process Map store).
 * Replace the transport adapter to wire live Data Rail persistence layer.
 */

import type { ActionBand, AttestationPayload } from '../../types/hepar.types';
import type { FullHeparRunResult, StageDResult } from '../stages/stageD-consensus';

// ---------------------------------------------------------------------------
// DataRailRecord
// ---------------------------------------------------------------------------

export interface DataRailRecord {
  heparRunId:          string;
  protocolId:          string;
  codeHash:            string;
  riskScore:           number;
  actionBand:          ActionBand;
  dimensionScores:     StageDResult['dimensionScores'];
  findingVectorCount:  number;
  hardBlockReasons:    string[];
  attestationPayload:  AttestationPayload;
  stageRunIds: {
    stageA: string;
    stageB: string;
    stageC: string;
    stageD: string;
  };
  evidenceMerkleRoot:  string;   // from attestationPayload
  postedOnChain:       boolean;  // false at Advisory tier
  monadTxHash?:        string;   // populated only when postedOnChain = true
  tierLabel:           'ADVISORY';
  recordedAt:          number;
}

export interface DataRailWriteResult {
  written:         boolean;
  transportStatus: 'STUB' | 'LIVE';
  record:          DataRailRecord;
  writtenAt:       number;
  reason?:         'DUPLICATE_RUN_ID';  // populated when written = false
}

// ---------------------------------------------------------------------------
// APPEND-ONLY in-process store (Advisory tier stub)
// In production this is replaced by an immutable ledger / append-only DB.
// ---------------------------------------------------------------------------

const _advisoryStore = new Map<string, DataRailRecord>();

/**
 * Exposed for testing only — resets the in-process store.
 * DO NOT call in production code.
 */
export function _resetDataRailStoreForTesting(): void {
  _advisoryStore.clear();
}

// ---------------------------------------------------------------------------
// buildDataRailRecord
// ---------------------------------------------------------------------------

export function buildDataRailRecord(result: FullHeparRunResult): DataRailRecord {
  const { stageA, stageB, stageC, stageD, heparRunId, protocolId } = result;

  return {
    heparRunId,
    protocolId,
    codeHash:           stageD.attestationPayload.codeHash,
    riskScore:          stageD.globalScore,
    actionBand:         stageD.actionBand,
    dimensionScores:    stageD.dimensionScores,
    findingVectorCount: stageD.findingVectors.length,
    hardBlockReasons:   stageD.hardBlockReasons,
    attestationPayload: stageD.attestationPayload,
    stageRunIds: {
      stageA: stageA.stageARunId,
      stageB: stageB.stageBRunId,
      stageC: stageC.stageCRunId,
      stageD: stageD.stageDRunId
    },
    evidenceMerkleRoot: stageD.attestationPayload.evidenceMerkleRoot,
    postedOnChain:      false,     // always false at Advisory tier
    tierLabel:          'ADVISORY',
    recordedAt:         Date.now()
  };
}

// ---------------------------------------------------------------------------
// writeToDataRail — Advisory tier stub (append-only in-process Map)
// ---------------------------------------------------------------------------

/**
 * Writes a record to Data Rail.
 * APPEND-ONLY: rejects duplicate heparRunId with written=false.
 */
export function writeToDataRail(record: DataRailRecord): DataRailWriteResult {
  const now = Date.now();

  // APPEND-ONLY invariant: reject duplicate heparRunId
  if (_advisoryStore.has(record.heparRunId)) {
    return {
      written:         false,
      transportStatus: 'STUB',
      record,
      writtenAt:       now,
      reason:          'DUPLICATE_RUN_ID'
    };
  }

  // Write to append-only store
  _advisoryStore.set(record.heparRunId, record);

  return {
    written:         true,
    transportStatus: 'STUB',
    record,
    writtenAt:       now
  };
}
