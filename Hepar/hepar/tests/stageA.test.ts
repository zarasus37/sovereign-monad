/**
 * HEPAR - stageA.test.ts
 * Tier: ADVISORY (fixture-verified only, not live-telemetry-verified)
 *
 * 9 specified test cases for Stage A static forensics.
 *
 * Test 1: No findings -> all surface scores = 100
 * Test 2: Single CRITICAL (sev=9) BYTECODE_PRIVILEGE -> score = 70, hardBlock populated
 * Test 3: Single HIGH (sev=7) PROXY_ADMIN -> score = 85
 * Test 4: Single MEDIUM (sev=5) LP_UNLOCK -> score = 85
 * Test 5: Multiple findings across surfaces -> correct aggregate deductions
 * Test 6: WALLET_TAINT always returns PIPELINE_REQUIRED (Advisory tier invariant)
 * Test 7: hardBlock flag set when severity >= 8
 * Test 8: ACCOUNTING_INVARIANT surface scores and hard-block
 * Test 9: INPUT_VALIDATION surface scores and hard-block
 */

import {
  runStageA,
  deductForSeverity,
  computeSurfaceScore,
  walletTaintAdvisoryStub,
} from '../lib/stages/stageA-static';
import type { StageAFinding } from '../lib/stages/stageA-static';

// ---------------------------------------------------------------------------
// Minimal inline test harness (matches vectorScoring.test.ts pattern)
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function check(label: string, actual: unknown, expected: unknown, tol = 0): void {
  let ok: boolean;
  if (typeof actual === 'number' && typeof expected === 'number') {
    ok = Math.abs(actual - expected) <= tol;
  } else {
    ok = actual === expected;
  }
  if (ok) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.error(`  FAIL  ${label}`);
    console.error(`        expected: ${JSON.stringify(expected)}`);
    console.error(`        actual:   ${JSON.stringify(actual)}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// deductForSeverity unit tests
// ---------------------------------------------------------------------------

console.log('\n-- deductForSeverity() --');
check('sev=0  -> 0  (informational)',  deductForSeverity(0),  0);
check('sev=1  -> 5  (LOW)',            deductForSeverity(1),  5);
check('sev=4  -> 5  (LOW ceiling)',    deductForSeverity(4),  5);
check('sev=5  -> 15 (MEDIUM floor)',   deductForSeverity(5),  15);
check('sev=7  -> 15 (MEDIUM ceiling)', deductForSeverity(7),  15);
check('sev=8  -> 30 (HIGH floor)',     deductForSeverity(8),  30);
check('sev=9  -> 30 (CRITICAL)',       deductForSeverity(9),  30);
check('sev=10 -> 30 (CRITICAL max)',   deductForSeverity(10), 30);

// ---------------------------------------------------------------------------
// TEST 1: No findings -> all surface scores = 100
// ---------------------------------------------------------------------------

console.log('\n== TEST 1: No findings -> all scores = 100 ==');

const result1 = runStageA([], 'SPEC-A-001');

check('byteCodePrivilege = 100',    result1.dimensionScores.byteCodePrivilege,    100);
check('proxyAdmin = 100',           result1.dimensionScores.proxyAdmin,           100);
check('lpUnlock = 100',             result1.dimensionScores.lpUnlock,             100);
check('accountingInvariant = 100',  result1.dimensionScores.accountingInvariant,  100);
check('inputValidation = 100',      result1.dimensionScores.inputValidation,      100);
check('hardBlockCandidates empty (excl wallet stub)',
  result1.hardBlockCandidates.filter((f) => f.surface !== 'WALLET_TAINT').length, 0);
check('weightedFindings has only wallet stub entry',
  result1.weightedFindings.every((f) => f.surface === 'WALLET_TAINT'), true);
// WALLET_TAINT advisory stub always present
check('walletTaint dataSourceStatus = PIPELINE_REQUIRED',
  result1.dataSourceStatus.walletTaint, 'PIPELINE_REQUIRED');
check('walletTaint score = 50 (provisional)',
  result1.dimensionScores.walletTaint, 50);

// ---------------------------------------------------------------------------
// TEST 2: Single CRITICAL (sev=9) BYTECODE_PRIVILEGE -> score = 70, hardBlock
// ---------------------------------------------------------------------------

console.log('\n== TEST 2: Single CRITICAL sev=9 BYTECODE_PRIVILEGE -> score=70 ==');

const criticalPrivFinding: StageAFinding = {
  surface: 'BYTECODE_PRIVILEGE',
  severity: 9,
  description: 'Unrestricted onlyOwner drain() function - no timelock',
  evidence: ['function drain() public onlyOwner', 'no TimelockController reference'],
  hardBlock: false,   // set by severity threshold, not manual flag
};

const result2 = runStageA([criticalPrivFinding], 'SPEC-A-002');

check('byteCodePrivilege = 70 (100 - 30)',
  result2.dimensionScores.byteCodePrivilege, 70);
check('proxyAdmin = 100 (unaffected)',
  result2.dimensionScores.proxyAdmin, 100);
check('lpUnlock = 100 (unaffected)',
  result2.dimensionScores.lpUnlock, 100);
check('hardBlockCandidates contains the critical finding',
  result2.hardBlockCandidates.some((f) => f.description === criticalPrivFinding.description), true);
check('hardBlockCandidates count for non-wallet surfaces = 1',
  result2.hardBlockCandidates.filter((f) => f.surface !== 'WALLET_TAINT').length, 1);

// ---------------------------------------------------------------------------
// TEST 3: Single HIGH (sev=7) PROXY_ADMIN -> score = 85
// ---------------------------------------------------------------------------

console.log('\n== TEST 3: Single HIGH sev=7 PROXY_ADMIN -> score=85 ==');

const highProxyFinding: StageAFinding = {
  surface: 'PROXY_ADMIN',
  severity: 7,
  description: 'ProxyAdmin controlled by single EOA with no timelock',
  evidence: ['ProxyAdmin.owner() = 0xdeadbeef', 'no TimelockController'],
  hardBlock: false,
};

const result3 = runStageA([highProxyFinding], 'SPEC-A-003');

check('proxyAdmin = 85 (100 - 15)',
  result3.dimensionScores.proxyAdmin, 85);
check('byteCodePrivilege = 100 (unaffected)',
  result3.dimensionScores.byteCodePrivilege, 100);
check('lpUnlock = 100 (unaffected)',
  result3.dimensionScores.lpUnlock, 100);
check('hardBlockCandidates empty for non-wallet (sev=7 < 8)',
  result3.hardBlockCandidates.filter((f) => f.surface !== 'WALLET_TAINT').length, 0);

// ---------------------------------------------------------------------------
// TEST 4: Single MEDIUM (sev=5) LP_UNLOCK -> score = 85
// ---------------------------------------------------------------------------

console.log('\n== TEST 4: Single MEDIUM sev=5 LP_UNLOCK -> score=85 ==');

const medLpFinding: StageAFinding = {
  surface: 'LP_UNLOCK',
  severity: 5,
  description: 'Top 3 LPs hold 72% of supply with unlock in 30 days',
  evidence: ['Gini=0.71', 'unlock block 18,450,000 (~28 days)'],
  hardBlock: false,
};

const result4 = runStageA([medLpFinding], 'SPEC-A-004');

check('lpUnlock = 85 (100 - 15)',
  result4.dimensionScores.lpUnlock, 85);
check('byteCodePrivilege = 100 (unaffected)',
  result4.dimensionScores.byteCodePrivilege, 100);
check('proxyAdmin = 100 (unaffected)',
  result4.dimensionScores.proxyAdmin, 100);

// ---------------------------------------------------------------------------
// TEST 5: Multiple findings across surfaces -> correct aggregate deductions
// ---------------------------------------------------------------------------

console.log('\n== TEST 5: Multiple findings -> aggregate deductions ==');

// BYTECODE_PRIVILEGE: sev=9 (-30) + sev=6 (-15) = -45 -> score=55
// PROXY_ADMIN:        sev=4 (-5)                  = -5  -> score=95
// LP_UNLOCK:          sev=8 (-30) + sev=3 (-5)   = -35 -> score=65

const multiFindings: StageAFinding[] = [
  {
    surface: 'BYTECODE_PRIVILEGE',
    severity: 9,
    description: 'Critical: unrestricted drain',
    evidence: ['drain()'],
    hardBlock: false,
  },
  {
    surface: 'BYTECODE_PRIVILEGE',
    severity: 6,
    description: 'Medium: pauser role transferable by owner',
    evidence: ['transferPauser()'],
    hardBlock: false,
  },
  {
    surface: 'PROXY_ADMIN',
    severity: 4,
    description: 'Low: implementation not frozen post-audit',
    evidence: ['upgradeToAndCall not locked'],
    hardBlock: false,
  },
  {
    surface: 'LP_UNLOCK',
    severity: 8,
    description: 'High: 95% LP unlock in 7 days, single wallet',
    evidence: ['Gini=0.95', 'unlock block 18,400,000'],
    hardBlock: false,
  },
  {
    surface: 'LP_UNLOCK',
    severity: 3,
    description: 'Low: secondary LP with 6-month unlock',
    evidence: ['secondary LP 5%'],
    hardBlock: false,
  },
];

const result5 = runStageA(multiFindings, 'SPEC-A-005');

check('byteCodePrivilege = 55 (100-30-15)',
  result5.dimensionScores.byteCodePrivilege, 55);
check('proxyAdmin = 95 (100-5)',
  result5.dimensionScores.proxyAdmin, 95);
check('lpUnlock = 65 (100-30-5)',
  result5.dimensionScores.lpUnlock, 65);

// hardBlock candidates: sev=9 (BYTECODE), sev=8 (LP_UNLOCK) = 2
check('hardBlockCandidates count (non-wallet) = 2',
  result5.hardBlockCandidates.filter((f) => f.surface !== 'WALLET_TAINT').length, 2);

// weightedFindings ordered desc by severity
const nonWalletWeighted = result5.weightedFindings.filter((f) => f.surface !== 'WALLET_TAINT');
check('weightedFindings[0].severity = 9 (highest first)',
  nonWalletWeighted[0].severity, 9);
check('weightedFindings[1].severity = 8',
  nonWalletWeighted[1].severity, 8);
check('weightedFindings last severity = 3 (lowest last)',
  nonWalletWeighted[nonWalletWeighted.length - 1].severity, 3);

// ---------------------------------------------------------------------------
// TEST 6: WALLET_TAINT always returns PIPELINE_REQUIRED (Advisory tier invariant)
// ---------------------------------------------------------------------------

console.log('\n== TEST 6: WALLET_TAINT always PIPELINE_REQUIRED ==');

// Stub direct
const stubResult = walletTaintAdvisoryStub();
check('stub.status = PIPELINE_REQUIRED',
  stubResult.status, 'PIPELINE_REQUIRED');
check('stub.score = 50 (neutral provisional)',
  stubResult.score, 50);
check('stub.findings[0].surface = WALLET_TAINT',
  stubResult.findings[0].surface, 'WALLET_TAINT');
check('stub.findings[0].dataSourceStatus = PIPELINE_REQUIRED',
  stubResult.findings[0].dataSourceStatus, 'PIPELINE_REQUIRED');
check('stub.findings[0].hardBlock = false',
  stubResult.findings[0].hardBlock, false);

// Via runStageA - even if caller passes WALLET_TAINT finding, stub wins
const callerWalletFinding: StageAFinding = {
  surface: 'WALLET_TAINT',
  severity: 8,
  description: 'Caller-supplied wallet taint - should be ignored by Advisory stub',
  evidence: ['should be dropped'],
  hardBlock: true,
  dataSourceStatus: 'LIVE',  // caller claims LIVE - Advisory should override
};

const result6 = runStageA([callerWalletFinding], 'SPEC-A-006');
check('walletTaint dataSourceStatus still PIPELINE_REQUIRED (stub wins)',
  result6.dataSourceStatus.walletTaint, 'PIPELINE_REQUIRED');
check('walletTaint score still 50 (stub wins)',
  result6.dimensionScores.walletTaint, 50);
// The caller-supplied finding's hardBlock=true should NOT appear
// Only the stub finding should be in weightedFindings for WALLET_TAINT
const walletFindings = result6.weightedFindings.filter((f) => f.surface === 'WALLET_TAINT');
check('only stub wallet finding present (caller dropped)',
  walletFindings.every((f) => f.description.includes('dedicated chain analytics')), true);

// ---------------------------------------------------------------------------
// TEST 7: hardBlock flag set when severity >= 8
// ---------------------------------------------------------------------------

console.log('\n== TEST 7: hardBlock flag behavior ==');

// Severity exactly 8 -> hard block
const sev8Finding: StageAFinding = {
  surface: 'PROXY_ADMIN',
  severity: 8,
  description: 'Sev=8 boundary test',
  evidence: [],
  hardBlock: false,
};

const result7a = runStageA([sev8Finding], 'SPEC-A-007a');
check('sev=8 -> appears in hardBlockCandidates',
  result7a.hardBlockCandidates.some((f) => f.severity === 8 && f.surface === 'PROXY_ADMIN'), true);

// Severity 7 -> NOT a hard block (below threshold)
const sev7Finding: StageAFinding = {
  surface: 'PROXY_ADMIN',
  severity: 7,
  description: 'Sev=7 boundary test',
  evidence: [],
  hardBlock: false,
};

const result7b = runStageA([sev7Finding], 'SPEC-A-007b');
check('sev=7 -> NOT in hardBlockCandidates (threshold is 8)',
  result7b.hardBlockCandidates.filter(
    (f) => f.surface === 'PROXY_ADMIN' && f.severity === 7,
  ).length, 0);

// Explicit hardBlock=true with low severity -> still hard block
const lowSevHardBlock: StageAFinding = {
  surface: 'BYTECODE_PRIVILEGE',
  severity: 3,
  description: 'Manually flagged hard block despite low severity',
  evidence: ['manual override'],
  hardBlock: true,
};

const result7c = runStageA([lowSevHardBlock], 'SPEC-A-007c');
check('hardBlock=true on sev=3 -> appears in hardBlockCandidates',
  result7c.hardBlockCandidates.some(
    (f) => f.hardBlock === true && f.surface === 'BYTECODE_PRIVILEGE',
  ), true);
check('byteCodePrivilege = 95 (deduction for sev=3 = 5)',
  result7c.dimensionScores.byteCodePrivilege, 95);

// ---------------------------------------------------------------------------
// TEST 8: ACCOUNTING_INVARIANT surface scores and hard-block
// ---------------------------------------------------------------------------

console.log('\n== TEST 8: ACCOUNTING_INVARIANT surface scoring and hard-block ==');

const criticalAcctFinding: StageAFinding = {
  surface: 'ACCOUNTING_INVARIANT',
  severity: 9,
  description: 'Balance-modifying function reachable without solvency check',
  evidence: ['withdraw() -> _updateReserves() skips solvency guard'],
  hardBlock: false,
};

const result8 = runStageA([criticalAcctFinding], 'SPEC-A-008');

check('accountingInvariant = 70 (100 - 30)',
  result8.dimensionScores.accountingInvariant, 70);
check('byteCodePrivilege = 100 (unaffected)',
  result8.dimensionScores.byteCodePrivilege, 100);
check('inputValidation = 100 (unaffected)',
  result8.dimensionScores.inputValidation, 100);
check('hardBlockCandidates contains accounting finding',
  result8.hardBlockCandidates.some((f) => f.surface === 'ACCOUNTING_INVARIANT'), true);
check('hardBlockCandidates count (non-wallet) = 1',
  result8.hardBlockCandidates.filter((f) => f.surface !== 'WALLET_TAINT').length, 1);

// Medium accounting finding (sev=5) -> score=85, not a hard block
const medAcctFinding: StageAFinding = {
  surface: 'ACCOUNTING_INVARIANT',
  severity: 5,
  description: 'Unchecked transfer return value in balance-critical path',
  evidence: ['token.transfer(user, amount) — return not checked'],
  hardBlock: false,
};
const result8b = runStageA([medAcctFinding], 'SPEC-A-008b');
check('accountingInvariant = 85 (100 - 15) for sev=5',
  result8b.dimensionScores.accountingInvariant, 85);
check('sev=5 ACCOUNTING not in hardBlockCandidates',
  result8b.hardBlockCandidates.filter(
    (f) => f.surface === 'ACCOUNTING_INVARIANT',
  ).length, 0);

// ---------------------------------------------------------------------------
// TEST 9: INPUT_VALIDATION surface scores and hard-block
// ---------------------------------------------------------------------------

console.log('\n== TEST 9: INPUT_VALIDATION surface scoring and hard-block ==');

const criticalInputFinding: StageAFinding = {
  surface: 'INPUT_VALIDATION',
  severity: 8,
  description: 'Zero-value accepted on deposit() controlling fund movement',
  evidence: ['deposit(0) succeeds — no require(amount > 0)'],
  hardBlock: false,
};

const result9 = runStageA([criticalInputFinding], 'SPEC-A-009');

check('inputValidation = 70 (100 - 30)',
  result9.dimensionScores.inputValidation, 70);
check('accountingInvariant = 100 (unaffected)',
  result9.dimensionScores.accountingInvariant, 100);
check('byteCodePrivilege = 100 (unaffected)',
  result9.dimensionScores.byteCodePrivilege, 100);
check('hardBlockCandidates contains input-validation finding',
  result9.hardBlockCandidates.some((f) => f.surface === 'INPUT_VALIDATION'), true);
check('hardBlockCandidates count (non-wallet) = 1',
  result9.hardBlockCandidates.filter((f) => f.surface !== 'WALLET_TAINT').length, 1);

// Low severity input-validation (sev=3) -> score=95, not hard block
const lowInputFinding: StageAFinding = {
  surface: 'INPUT_VALIDATION',
  severity: 3,
  description: 'Missing boundary check on non-critical parameter',
  evidence: ['setFee(bps) accepts bps > 10000'],
  hardBlock: false,
};
const result9b = runStageA([lowInputFinding], 'SPEC-A-009b');
check('inputValidation = 95 (100 - 5) for sev=3',
  result9b.dimensionScores.inputValidation, 95);
check('sev=3 INPUT_VALIDATION not in hardBlockCandidates',
  result9b.hardBlockCandidates.filter(
    (f) => f.surface === 'INPUT_VALIDATION',
  ).length, 0);

// ---------------------------------------------------------------------------
// StageAResult structural checks
// ---------------------------------------------------------------------------

console.log('\n-- StageAResult structural checks --');

const structResult = runStageA([], 'STRUCT-CHECK');
check('stageARunId set', typeof structResult.stageARunId === 'string', true);
check('completedAt is a number (Unix ms)', typeof structResult.completedAt === 'number', true);
check('completedAt > 0', structResult.completedAt > 0, true);
check('hardBlockCandidates is array', Array.isArray(structResult.hardBlockCandidates), true);
check('weightedFindings is array',     Array.isArray(structResult.weightedFindings),    true);
check('dataSourceStatus.walletTaint defined',
  structResult.dataSourceStatus.walletTaint !== undefined, true);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('\n-------------------------------------------');
console.log(`  ${passed} passed    ${failed} failed`);
if (failed > 0) {
  console.error('\n  STAGE A TESTS DID NOT PASS - do not proceed to Stage B');
  process.exit(1);
} else {
  console.log('\n  All Stage A tests verified. Report to operator before proceeding to Stage B.');
}
