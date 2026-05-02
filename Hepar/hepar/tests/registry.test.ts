// hepar/tests/registry.test.ts
// Tests for registryManager.ts (T1-T13) and correctionProtocol.ts (T20-T26).
// All tests are deterministic -- no stochastic Monte Carlo runs.

import { runStageA } from '../lib/stages/stageA-static';
import { runStageB, AdvisoryStubEngine } from '../lib/stages/stageB-symbolic';
import { runStageC } from '../lib/stages/stageC-montecarlo';
import { runHepar as assembleFourStages } from '../lib/stages/stageD-consensus';
import type { FullHeparRunResult } from '../lib/stages/stageD-consensus';
import type { ActionBand } from '../types/hepar.types';
import type { StageAFinding } from '../lib/stages/stageA-static';
import {
  createRegistryEntry,
  updateRegistryEntry,
  canPublishExternally,
  transitionStatus
} from '../lib/registry/registryManager';
import {
  initiateCorrectionProtocol,
  fileDispute,
  resolveDispute,
  applyCorrection
} from '../lib/registry/correctionProtocol';

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function assert(label: string, cond: boolean): void {
  if (cond) {
    console.log('  PASS  ' + label);
    passed++;
  } else {
    console.error('  FAIL  ' + label);
    failed++;
  }
}

function assertThrows(label: string, fn: () => void): void {
  try {
    fn();
    console.error('  FAIL  ' + label + ' (expected throw, got none)');
    failed++;
  } catch {
    console.log('  PASS  ' + label);
    passed++;
  }
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const BENIGN_FINDINGS: StageAFinding[] = [
  {
    surface: 'BYTECODE_PRIVILEGE',
    severity: 1,
    description: 'Benign owner function',
    evidence: [],
    hardBlock: false
  }
];

function makeFullResult(actionBandOverride?: ActionBand): FullHeparRunResult {
  const stageA = runStageA(BENIGN_FINDINGS);
  const stageB = runStageB({ engine: new AdvisoryStubEngine() });
  const stageC = runStageC({ masterSeed: 'TEST-REGISTRY-SEED', protocolId: 'TEST-PROTO' });
  const base   = assembleFourStages(stageA, stageB, stageC, 'TEST-PROTO', '0xABCD');

  if (!actionBandOverride) return base;

  const overriddenStageD = {
    ...base.stageD,
    actionBand:          actionBandOverride,
    hardBlockReasons:    actionBandOverride === 'HARDBLOCK' ? ['Forced HARDBLOCK for test'] : [],
    cortexReviewFlagged: actionBandOverride === 'RESTRICTED'
  };
  return { ...base, stageD: overriddenStageD };
}

// ---------------------------------------------------------------------------
// T1: createRegistryEntry from ALLOW -> GREEN
// ---------------------------------------------------------------------------

console.log('\nTest 1: createRegistryEntry from ALLOW result -> status = GREEN');
{
  const result = makeFullResult('ALLOW');
  const entry  = createRegistryEntry('proto-allow', result);
  assert('T1a currentStatus = GREEN',              entry.currentStatus === 'GREEN');
  assert('T1b monitoringActive = true',            entry.monitoringActive === true);
  assert('T1c statusHistory has 1 entry',          entry.statusHistory.length === 1);
  assert('T1d statusHistory[0].fromStatus = null', entry.statusHistory[0]!.fromStatus === null);
  assert('T1e riskScoreHistory has 1 entry',       entry.riskScoreHistory.length === 1);
}

// ---------------------------------------------------------------------------
// T2: createRegistryEntry from HARDBLOCK -> RED
// ---------------------------------------------------------------------------

console.log('\nTest 2: createRegistryEntry from HARDBLOCK result -> status = RED');
{
  const result = makeFullResult('HARDBLOCK');
  const entry  = createRegistryEntry('proto-hardblock', result);
  assert('T2a currentStatus = RED',                 entry.currentStatus === 'RED');
  assert('T2b externalPublicationCleared = false',  entry.externalPublicationCleared === false);
}

// ---------------------------------------------------------------------------
// T3: GREEN -> YELLOW with valid reason -> statusHistory appended
// ---------------------------------------------------------------------------

console.log('\nTest 3: GREEN -> YELLOW transition -> statusHistory appended');
{
  const result  = makeFullResult('ALLOW');
  const entry   = createRegistryEntry('proto-green', result);
  const updated = transitionStatus(entry, 'YELLOW', 'Admin key transferred', 'trig-001');
  assert('T3a currentStatus = YELLOW',                          updated.currentStatus === 'YELLOW');
  assert('T3b statusHistory has 2 entries',                     updated.statusHistory.length === 2);
  assert('T3c statusHistory[1].fromStatus = GREEN',             updated.statusHistory[1]!.fromStatus === 'GREEN');
  assert('T3d statusHistory[1].toStatus = YELLOW',              updated.statusHistory[1]!.toStatus   === 'YELLOW');
  assert('T3e original GREEN entry preserved',                   updated.statusHistory[0]!.toStatus   === 'GREEN');
}

// ---------------------------------------------------------------------------
// T4: YELLOW -> RED with reviewerSignOff -> externalPublicationCleared = false
// ---------------------------------------------------------------------------

console.log('\nTest 4: YELLOW -> RED with reviewerSignOff -> externalPublicationCleared = false');
{
  const result  = makeFullResult('RESTRICTED');
  const entry   = createRegistryEntry('proto-yellow', result);
  assert('T4 setup: initial YELLOW', entry.currentStatus === 'YELLOW');
  const updated = transitionStatus(
    entry, 'RED',
    'CERTAIN CRITICAL vulnerability found',
    'run-abc',
    'reviewer@hepar.xyz'
  );
  assert('T4a currentStatus = RED',                        updated.currentStatus === 'RED');
  assert('T4b externalPublicationCleared = false',         updated.externalPublicationCleared === false);
  assert('T4c reviewerSignOff recorded in statusHistory',  !!updated.statusHistory[1]!.reviewerSignOff);
}

// ---------------------------------------------------------------------------
// T5: RED -> BLACK without reviewerSignOff -> throws
// ---------------------------------------------------------------------------

console.log('\nTest 5: RED -> BLACK without reviewerSignOff -> throws');
{
  const result = makeFullResult('HARDBLOCK');
  const entry  = createRegistryEntry('proto-red', result);
  assert('T5 setup: RED entry', entry.currentStatus === 'RED');
  assertThrows(
    'T5 RED -> BLACK without reviewerSignOff throws',
    () => transitionStatus(entry, 'BLACK', 'Confirmed rug pull', 'run-xyz')
  );
}

// ---------------------------------------------------------------------------
// T6: RED -> BLACK with reviewerSignOff -> BLACK, cleared = false
// ---------------------------------------------------------------------------

console.log('\nTest 6: RED -> BLACK with reviewerSignOff -> BLACK, cleared = false');
{
  const result  = makeFullResult('HARDBLOCK');
  const entry   = createRegistryEntry('proto-red2', result);
  const updated = transitionStatus(
    entry, 'BLACK',
    'Confirmed rug pull - liquidity drained, team vanished',
    'run-xyz',
    'independent-reviewer@hepar.xyz'
  );
  assert('T6a currentStatus = BLACK',             updated.currentStatus === 'BLACK');
  assert('T6b externalPublicationCleared = false', updated.externalPublicationCleared === false);
  assert('T6c blacklistReason populated',          typeof updated.blacklistReason === 'string' && updated.blacklistReason!.length > 0);
}

// ---------------------------------------------------------------------------
// T7: BLACK -> GREEN -> throws (BLACK is permanent)
// ---------------------------------------------------------------------------

console.log('\nTest 7: BLACK -> GREEN attempt -> throws');
{
  const result  = makeFullResult('HARDBLOCK');
  const entry   = createRegistryEntry('proto-black', result);
  const blacked = transitionStatus(entry, 'BLACK', 'Confirmed exploit', 'run-001', 'reviewer@hepar.xyz');
  assertThrows(
    'T7 BLACK -> GREEN throws',
    () => transitionStatus(blacked, 'GREEN', 'Attempting to clear BLACK', 'run-002')
  );
}

// ---------------------------------------------------------------------------
// T8: GREEN -> BLACK directly -> throws (must go through RED)
// ---------------------------------------------------------------------------

console.log('\nTest 8: GREEN -> BLACK directly -> throws');
{
  const result = makeFullResult('ALLOW');
  const entry  = createRegistryEntry('proto-green2', result);
  assertThrows(
    'T8 GREEN -> BLACK directly throws',
    () => transitionStatus(entry, 'BLACK', 'Skip RED', 'run-003', 'reviewer@hepar.xyz')
  );
}

// ---------------------------------------------------------------------------
// T9: canPublishExternally = true for GREEN
// ---------------------------------------------------------------------------

console.log('\nTest 9: canPublishExternally = true for GREEN');
{
  const result = makeFullResult('ALLOW');
  const entry  = createRegistryEntry('proto-green3', result);
  assert('T9 GREEN -> canPublishExternally = true', canPublishExternally(entry) === true);
}

// ---------------------------------------------------------------------------
// T10: canPublishExternally = false for RED
// ---------------------------------------------------------------------------

console.log('\nTest 10: canPublishExternally = false for RED');
{
  const result = makeFullResult('HARDBLOCK');
  const entry  = createRegistryEntry('proto-red3', result);
  assert('T10 RED -> canPublishExternally = false', canPublishExternally(entry) === false);
}

// ---------------------------------------------------------------------------
// T11: canPublishExternally = false for BLACK
// ---------------------------------------------------------------------------

console.log('\nTest 11: canPublishExternally = false for BLACK');
{
  const result  = makeFullResult('HARDBLOCK');
  const entry   = createRegistryEntry('proto-black2', result);
  const blacked = transitionStatus(entry, 'BLACK', 'Confirmed scam', 'run-blk', 'rev@hepar.xyz');
  assert('T11 BLACK -> canPublishExternally = false', canPublishExternally(blacked) === false);
}

// ---------------------------------------------------------------------------
// T12: riskScoreHistory appends on every updateRegistryEntry call
// ---------------------------------------------------------------------------

console.log('\nTest 12: riskScoreHistory appends on every updateRegistryEntry call');
{
  const r1    = makeFullResult('ALLOW');
  const entry = createRegistryEntry('proto-hist', r1);
  assert('T12a initial length = 1', entry.riskScoreHistory.length === 1);

  const r2      = makeFullResult('ALLOW');
  const updated = updateRegistryEntry(entry, r2);
  assert('T12b after 1 update length = 2', updated.riskScoreHistory.length === 2);

  const r3       = makeFullResult('ALLOW');
  const updated2 = updateRegistryEntry(updated, r3);
  assert('T12c after 2 updates length = 3', updated2.riskScoreHistory.length === 3);
}

// ---------------------------------------------------------------------------
// T13: statusHistory only appends, never loses entries
// ---------------------------------------------------------------------------

console.log('\nTest 13: statusHistory only appends, never loses entries');
{
  const result = makeFullResult('ALLOW');
  const entry  = createRegistryEntry('proto-append', result);
  const t1     = transitionStatus(entry, 'YELLOW', 'LP unlock warning', 'ev-1');
  const t2     = transitionStatus(t1,    'RED',    'Critical vuln confirmed', 'ev-2', 'rev@h.xyz');
  assert('T13a length after 3 transitions = 3', t2.statusHistory.length === 3);
  assert('T13b statusHistory[0] = GREEN',        t2.statusHistory[0]!.toStatus === 'GREEN');
  assert('T13c statusHistory[1] = YELLOW',       t2.statusHistory[1]!.toStatus === 'YELLOW');
  assert('T13d statusHistory[2] = RED',          t2.statusHistory[2]!.toStatus === 'RED');
}

// ---------------------------------------------------------------------------
// T20: initiateCorrectionProtocol -> originalFindingPreserved = true always
// ---------------------------------------------------------------------------

console.log('\nTest 20: initiateCorrectionProtocol -> originalFindingPreserved = true');
{
  const corr = initiateCorrectionProtocol(
    'run-orig-001', 'proto-corr', ['VEC-001'],
    'False positive in privilege analysis', 'rev-A'
  );
  assert('T20a originalFindingPreserved = true', corr.originalFindingPreserved === true);
  assert('T20b correctionId populated',           typeof corr.correctionId === 'string' && corr.correctionId.length > 0);
  assert('T20c walletFlagsUnwound = true',        corr.walletFlagsUnwound === true);
}

// ---------------------------------------------------------------------------
// T21: fileDispute -> UNDER_REVIEW, publicStatusDuringReview = YELLOW
// ---------------------------------------------------------------------------

console.log('\nTest 21: fileDispute -> UNDER_REVIEW, publicStatusDuringReview = YELLOW');
{
  const dispute = fileDispute(
    'run-disp-001', 'proto-disp',
    ['VEC-002'], 'Reentrancy path requires privileged access we do not have', 'rev-B'
  );
  assert('T21a status = UNDER_REVIEW',              dispute.status === 'UNDER_REVIEW');
  assert('T21b publicStatusDuringReview = YELLOW',  dispute.publicStatusDuringReview === 'YELLOW');
  assert('T21c disputeId populated',                typeof dispute.disputeId === 'string' && dispute.disputeId.length > 0);
}

// ---------------------------------------------------------------------------
// T22: resolveDispute FINDING_OVERTURNED
// ---------------------------------------------------------------------------

console.log('\nTest 22: resolveDispute FINDING_OVERTURNED');
{
  const dispute  = fileDispute('run-d2', 'proto-d2', ['VEC-003'], 'Counter-arg', 'rev-C');
  const resolved = resolveDispute(dispute, 'FINDING_OVERTURNED', 'Independent review found no exploit path');
  assert('T22a status = FINDING_OVERTURNED', resolved.status === 'FINDING_OVERTURNED');
  assert('T22b resolvedAt populated',        typeof resolved.resolvedAt === 'number');
  assert('T22c resolution populated',        typeof resolved.resolution === 'string');
}

// ---------------------------------------------------------------------------
// T23: resolveDispute FINDING_UPHELD
// ---------------------------------------------------------------------------

console.log('\nTest 23: resolveDispute FINDING_UPHELD');
{
  const dispute  = fileDispute('run-d3', 'proto-d3', ['VEC-004'], 'Counter-arg B', 'rev-D');
  const resolved = resolveDispute(dispute, 'FINDING_UPHELD', 'Review confirmed exploit path is valid');
  assert('T23 status = FINDING_UPHELD', resolved.status === 'FINDING_UPHELD');
}

// ---------------------------------------------------------------------------
// T24: applyCorrection appends new RegistryStatusChange, does not remove original
// ---------------------------------------------------------------------------

console.log('\nTest 24: applyCorrection appends, does not remove original statusHistory');
{
  const result        = makeFullResult('HARDBLOCK');
  const entry         = createRegistryEntry('proto-corr2', result);
  const origHistLen   = entry.statusHistory.length;
  assert('T24 setup: RED entry', entry.currentStatus === 'RED');

  const corr = initiateCorrectionProtocol(
    entry.lastHeparRunId, 'proto-corr2',
    ['VEC-001'], 'False positive - privilege function is read-only', 'rev-indep'
  );
  const corrWithStatus = { ...corr, correctedStatus: 'GREEN' as const };
  const corrected      = applyCorrection(entry, corrWithStatus);

  assert('T24a statusHistory grew by 1',                    corrected.statusHistory.length === origHistLen + 1);
  assert('T24b original RED entry preserved',               corrected.statusHistory[0]!.toStatus === 'RED');
  assert('T24c new entry references correctionId',          corrected.statusHistory[corrected.statusHistory.length - 1]!.triggeredBy === corr.correctionId);
  assert('T24d correctionFlag set',                         corrected.correctionFlag === corr.correctionId);
  assert('T24e currentStatus updated to GREEN',             corrected.currentStatus === 'GREEN');
}

// ---------------------------------------------------------------------------
// T25: walletFlagsUnwound = true on correction
// ---------------------------------------------------------------------------

console.log('\nTest 25: walletFlagsUnwound = true on correction');
{
  const corr = initiateCorrectionProtocol(
    'run-wallet', 'proto-wallet', ['VEC-TGT'],
    'Wallet cluster incorrectly flagged', 'rev-wallet'
  );
  assert('T25 walletFlagsUnwound = true', corr.walletFlagsUnwound === true);
}

// ---------------------------------------------------------------------------
// T26: reviewerId field present and non-empty; empty reviewerId throws
// ---------------------------------------------------------------------------

console.log('\nTest 26: reviewerId present and non-empty in dispute');
{
  const dispute = fileDispute('run-rev', 'proto-rev', ['VEC-R'], 'Counter-arg', 'reviewer-distinct');
  assert('T26a reviewerId non-empty',          typeof dispute.reviewerId === 'string' && dispute.reviewerId.length > 0);
  assert('T26b reviewerId value preserved',    dispute.reviewerId === 'reviewer-distinct');
  assertThrows(
    'T26c empty reviewerId throws',
    () => fileDispute('run-r2', 'proto-r2', ['VEC-R'], 'Counter', '')
  );
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('\n---------------------------------------------------');
console.log('Registry Tests: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
