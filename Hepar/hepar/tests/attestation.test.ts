// hepar/tests/attestation.test.ts
// Tests for attestation.ts (T14-T19).
// Verifies determinism, merkle root identity with Stage D, and Advisory-tier stubs.

import { runStageA } from '../lib/stages/stageA-static';
import { runStageB, AdvisoryStubEngine } from '../lib/stages/stageB-symbolic';
import { runStageC } from '../lib/stages/stageC-montecarlo';
import { runHepar as assembleFourStages } from '../lib/stages/stageD-consensus';
import type { FullHeparRunResult } from '../lib/stages/stageD-consensus';
import type { StageAFinding } from '../lib/stages/stageA-static';
import { buildAttestationRecord, postAttestation } from '../lib/registry/attestation';

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(label: string, cond: boolean): void {
  if (cond) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Shared test helper
// ---------------------------------------------------------------------------

const BENIGN_FINDINGS: StageAFinding[] = [
  {
    surface: 'BYTECODE_PRIVILEGE',
    severity: 3,
    description: 'Owner function with timelock',
    evidence: [],
    hardBlock: false
  }
];

/** Build a deterministic FullHeparRunResult with a fixed master seed.
 *  All four runIds are pinned to the seed so the evidenceMerkleRoot is
 *  identical across two calls with the same seed (T15 determinism). */
function makeFullResult(seed: string = 'ATTEST-SEED-001'): FullHeparRunResult {
  const stageA = runStageA(BENIGN_FINDINGS, `stageA-${seed}`);
  const stageB = runStageB({ engine: new AdvisoryStubEngine(), runId: `stageB-${seed}` });
  const stageC = runStageC({ masterSeed: seed, protocolId: 'ATTEST-PROTO', runId: `stageC-${seed}` });
  return assembleFourStages(stageA, stageB, stageC, 'ATTEST-PROTO', '0xCODEHASH001', `stageD-${seed}`);
}

// ---------------------------------------------------------------------------
// Test 14: buildAttestationRecord produces correct shape from FullHeparRunResult
// ---------------------------------------------------------------------------

console.log('\nTest 14: buildAttestationRecord produces correct shape');
{
  const result = makeFullResult();
  const record = buildAttestationRecord(result);

  assert('T14a protocolId matches', record.protocolId === result.protocolId);
  assert('T14b heparRunId matches', record.heparRunId === result.heparRunId);
  assert('T14c riskScore is number', typeof record.riskScore === 'number');
  assert('T14d actionBand matches',  record.actionBand === result.stageD.actionBand);
  assert('T14e codeHash present',    typeof record.codeHash === 'string' && record.codeHash.length > 0);
  assert('T14f coverageRatio in [0,1]', record.coverageRatio >= 0 && record.coverageRatio <= 1);
  assert('T14g unknownRatio in [0,1]',  record.unknownRatio  >= 0 && record.unknownRatio  <= 1);
  assert('T14h evidenceMerkleRoot string', typeof record.evidenceMerkleRoot === 'string' && record.evidenceMerkleRoot.length > 0);
  assert('T14i signerSet is array',        Array.isArray(record.signerSet));
  assert('T14j signerThreshold is number', typeof record.signerThreshold === 'number');
  assert('T14k attestedAt is number',      typeof record.attestedAt === 'number');
}

// ---------------------------------------------------------------------------
// Test 15: evidenceMerkleRoot is deterministic -- same input = same root
// ---------------------------------------------------------------------------

console.log('\nTest 15: evidenceMerkleRoot is deterministic');
{
  // Two builds with the SAME master seed -> same vectors -> same merkle root.
  const r1 = makeFullResult('DETERMINISM-TEST-SEED');
  const r2 = makeFullResult('DETERMINISM-TEST-SEED');

  const rec1 = buildAttestationRecord(r1);
  const rec2 = buildAttestationRecord(r2);

  assert(
    'T15 same seed -> identical evidenceMerkleRoot',
    rec1.evidenceMerkleRoot === rec2.evidenceMerkleRoot
  );
}

// ---------------------------------------------------------------------------
// Test 16: evidenceMerkleRoot matches Stage D attestationPayload.evidenceMerkleRoot
// ---------------------------------------------------------------------------

console.log('\nTest 16: evidenceMerkleRoot matches Stage D attestationPayload');
{
  const result = makeFullResult('MERKLE-MATCH-SEED');
  const record = buildAttestationRecord(result);

  assert(
    'T16 evidenceMerkleRoot identical to stageD attestationPayload.evidenceMerkleRoot',
    record.evidenceMerkleRoot === result.stageD.attestationPayload.evidenceMerkleRoot
  );
}

// ---------------------------------------------------------------------------
// Test 17: postedOnChain = false at Advisory tier
// ---------------------------------------------------------------------------

console.log('\nTest 17: postedOnChain = false at Advisory tier');
{
  const result = makeFullResult();
  const record = buildAttestationRecord(result);
  assert('T17a buildAttestationRecord: postedOnChain = false', record.postedOnChain === false);

  const posted = postAttestation(record);
  assert('T17b postAttestation: record.postedOnChain = false', posted.record.postedOnChain === false);
  assert('T17c postAttestation: success = true', posted.success === true);
}

// ---------------------------------------------------------------------------
// Test 18: transportStatus = 'STUB' always
// ---------------------------------------------------------------------------

console.log('\nTest 18: transportStatus = STUB always');
{
  const result = makeFullResult();
  const record = buildAttestationRecord(result);
  assert('T18a record.transportStatus = STUB', record.transportStatus === 'STUB');

  const posted = postAttestation(record);
  assert('T18b postAttestation.transportStatus = STUB', posted.transportStatus === 'STUB');
}

// ---------------------------------------------------------------------------
// Test 19: topVectorFingerprints <= 5 entries, sorted by severity desc
// ---------------------------------------------------------------------------

console.log('\nTest 19: topVectorFingerprints <= 5 and severity desc');
{
  const result = makeFullResult('TOP-VEC-SEED');
  const record = buildAttestationRecord(result);

  assert('T19a topVectorFingerprints is Array',     Array.isArray(record.topVectorFingerprints));
  assert('T19b topVectorFingerprints.length <= 5',  record.topVectorFingerprints.length <= 5);

  // Verify severity descending order
  let severityDesc = true;
  for (let i = 1; i < record.topVectorFingerprints.length; i++) {
    if (record.topVectorFingerprints[i]!.severity > record.topVectorFingerprints[i - 1]!.severity) {
      severityDesc = false;
      break;
    }
  }
  assert('T19c topVectorFingerprints sorted severity desc', severityDesc);

  // Each fingerprint has required fields
  const allHaveFields = record.topVectorFingerprints.every((f: { vectorId: string; severity: number; consensusRate: number; convergenceLabel: string }) =>
    typeof f.vectorId        === 'string' &&
    typeof f.severity        === 'number' &&
    typeof f.consensusRate   === 'number' &&
    typeof f.convergenceLabel === 'string'
  );
  assert('T19d each fingerprint has required fields', allHaveFields);

  // monadTxHash absent at Advisory tier
  assert('T19e monadTxHash absent', record.monadTxHash === undefined);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('\n---------------------------------------------------');
console.log(`Attestation Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
