/**
 * HEPAR - stageB.test.ts
 * Tier: ADVISORY (fixture-verified only, not live-telemetry-verified)
 *
 * 10 specified test cases for Stage B symbolic proving.
 *
 * Test 1:  Default stub -> all 'unknown/timeout', proofterm=0.5 for all
 * Test 2:  Injected counterexample on AUTH -> counterexample-found, proofterm=1,
 *          hardBlockFromSymbolic=true
 * Test 3:  Injected counterexample on UPGRADE -> hardBlockFromSymbolic=true
 * Test 4:  Injected counterexample on ACCOUNTING -> hardBlockFromSymbolic=true
 *          (ACCOUNTING CEX is deterministic evidence, treated same as AUTH/UPGRADE)
 * Test 5:  Injected proved-safe on all four classes -> proofterm=0 for all,
 *          hardBlockFromSymbolic=false, summary.provedSafe=4
 * Test 6:  Mixed results: 2 proved-safe, 1 counterexample (REENTRANCY),
 *          1 unknown -> summary correct, hardBlockFromSymbolic=false
 * Test 7:  engineStatus is always 'STUB' in Advisory tier
 * Test 8:  proofterm mapping exact: counterexample=1, unknown=0.5, proved-safe=0
 *          No other values permitted.
 * Test 9:  counterexample field populated when result=counterexample-found,
 *          absent when proved-safe or unknown
 * Test 10: StageBResult shape is complete and TypeScript compiles clean
 */

import {
  runStageB,
  AdvisoryStubEngine,
  HalmosAdapter,
  symbolicProofterm,
  DEFAULT_INVARIANTS,
} from '../lib/stages/stageB-symbolic';
import type {
  StageBInput,
  InvariantDefinition,
} from '../lib/stages/stageB-symbolic';
import type { SymbolicResult } from '../types/hepar.types';

// ---------------------------------------------------------------------------
// Inline test harness
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
// symbolicProofterm unit tests (binding mapping check)
// ---------------------------------------------------------------------------

console.log('\n-- symbolicProofterm() binding mapping --');
check('counterexample-found -> 1',  symbolicProofterm('counterexample-found'), 1);
check('unknown/timeout      -> 0.5', symbolicProofterm('unknown/timeout'),      0.5);
check('proved-safe          -> 0',  symbolicProofterm('proved-safe'),           0);

// ---------------------------------------------------------------------------
// TEST 1: Default stub -> all 'unknown/timeout', proofterm=0.5 for all
// ---------------------------------------------------------------------------

console.log('\n== TEST 1: Default stub -> all unknown/timeout ==');

const result1 = runStageB({ runId: 'SPEC-B-001' });

check('all results unknown/timeout',
  result1.invariantResults.every((r) => r.result === 'unknown/timeout'), true);
check('all proofterms = 0.5',
  result1.invariantResults.every((r) => r.proofterm === 0.5), true);
check('summary.provedSafe = 0',          result1.summary.provedSafe,          0);
check('summary.counterexamplesFound = 0', result1.summary.counterexamplesFound, 0);
check('summary.unknownTimeout = totalChecked',
  result1.summary.unknownTimeout, result1.summary.totalChecked);
check('hardBlockFromSymbolic = false',   result1.hardBlockFromSymbolic,        false);
check('totalChecked = DEFAULT_INVARIANTS.length',
  result1.summary.totalChecked, DEFAULT_INVARIANTS.length);

// ---------------------------------------------------------------------------
// TEST 2: Injected counterexample on AUTH -> hardBlockFromSymbolic=true
// ---------------------------------------------------------------------------

console.log('\n== TEST 2: Injected AUTH counterexample -> hardBlockFromSymbolic=true ==');

const authCounterexample = [
  'attacker.call(target.privilegedDrain())',
  'msg.sender check: bypassed via delegatecall',
  'state: drained',
];

const engine2 = new AdvisoryStubEngine({
  knownCounterexamples: new Map([['AUTH-001', authCounterexample]]),
});
const result2 = runStageB({ engine: engine2, runId: 'SPEC-B-002' });

const auth001 = result2.invariantResults.find((r) => r.invariantId === 'AUTH-001')!;
check('AUTH-001 result = counterexample-found',
  auth001.result, 'counterexample-found');
check('AUTH-001 proofterm = 1',
  auth001.proofterm, 1);
check('AUTH-001 counterexample populated',
  Array.isArray(auth001.counterexample) && auth001.counterexample.length > 0, true);
check('AUTH-001 counterexample[0] matches injected',
  auth001.counterexample?.[0], authCounterexample[0]);
check('hardBlockFromSymbolic = true (AUTH counterexample)',
  result2.hardBlockFromSymbolic, true);
check('summary.counterexamplesFound = 1',
  result2.summary.counterexamplesFound, 1);

// ---------------------------------------------------------------------------
// TEST 3: Injected counterexample on UPGRADE -> hardBlockFromSymbolic=true
// ---------------------------------------------------------------------------

console.log('\n== TEST 3: Injected UPGRADE counterexample -> hardBlockFromSymbolic=true ==');

const upgradeCounterexample = [
  'attacker.call(proxy.upgradeTo(maliciousImpl))',
  'timelock check: skipped (timelock address = address(0))',
  'implementation: replaced',
];

const engine3 = new AdvisoryStubEngine({
  knownCounterexamples: new Map([['UPGRADE-003', upgradeCounterexample]]),
});
const result3 = runStageB({ engine: engine3, runId: 'SPEC-B-003' });

const upg003 = result3.invariantResults.find((r) => r.invariantId === 'UPGRADE-003')!;
check('UPGRADE-003 result = counterexample-found',
  upg003.result, 'counterexample-found');
check('UPGRADE-003 proofterm = 1',
  upg003.proofterm, 1);
check('hardBlockFromSymbolic = true (UPGRADE counterexample)',
  result3.hardBlockFromSymbolic, true);

// ---------------------------------------------------------------------------
// TEST 4: Injected counterexample on ACCOUNTING -> hardBlockFromSymbolic=true
// (ACCOUNTING CEX is deterministic evidence - triggers Stage B hard-block
//  same as AUTHORIZATION or UPGRADE)
// ---------------------------------------------------------------------------

console.log('\n== TEST 4: ACCOUNTING counterexample -> hardBlockFromSymbolic=true ==');

const acctCounterexample = [
  'attacker.flashloan(1e24)',
  'protocol.deposit(1e24)',
  'protocol.borrow(1e24 * leverageFactor)',
  'reserves: underflowed',
];

const engine4 = new AdvisoryStubEngine({
  knownCounterexamples: new Map([['ACCT-001', acctCounterexample]]),
});
const result4 = runStageB({ engine: engine4, runId: 'SPEC-B-004' });

const acct001 = result4.invariantResults.find((r) => r.invariantId === 'ACCT-001')!;
check('ACCT-001 result = counterexample-found',
  acct001.result, 'counterexample-found');
check('ACCT-001 proofterm = 1',
  acct001.proofterm, 1);
check('hardBlockFromSymbolic = true (ACCOUNTING counterexample triggers Stage B hard-block)',
  result4.hardBlockFromSymbolic, true);
check('summary.counterexamplesFound = 1',
  result4.summary.counterexamplesFound, 1);

// ---------------------------------------------------------------------------
// TEST 5: All four classes proved-safe -> proofterm=0, hardBlock=false, provedSafe=4
// ---------------------------------------------------------------------------

console.log('\n== TEST 5: All four classes proved-safe ==');

// Use one representative invariant per class
const onePerClass: InvariantDefinition[] = [
  { invariantId: 'AUTH-001',    invariantClass: 'AUTHORIZATION',    description: 'Auth repr'     },
  { invariantId: 'UPGRADE-001', invariantClass: 'UPGRADE',          description: 'Upgrade repr'  },
  { invariantId: 'ACCT-001',    invariantClass: 'ACCOUNTING',       description: 'Acct repr'     },
  { invariantId: 'REENT-001',   invariantClass: 'REENTRANCY_STATE',  description: 'Reent repr'    },
];

const engine5 = new AdvisoryStubEngine({
  knownProvedSafe: new Set(['AUTH-001', 'UPGRADE-001', 'ACCT-001', 'REENT-001']),
});
const result5 = runStageB({ invariants: onePerClass, engine: engine5, runId: 'SPEC-B-005' });

check('all proofterms = 0 (proved-safe)',
  result5.invariantResults.every((r) => r.proofterm === 0), true);
check('all results = proved-safe',
  result5.invariantResults.every((r) => r.result === 'proved-safe'), true);
check('hardBlockFromSymbolic = false',
  result5.hardBlockFromSymbolic, false);
check('summary.provedSafe = 4',
  result5.summary.provedSafe, 4);
check('summary.counterexamplesFound = 0',
  result5.summary.counterexamplesFound, 0);
check('summary.unknownTimeout = 0',
  result5.summary.unknownTimeout, 0);
check('totalChecked = 4',
  result5.summary.totalChecked, 4);

// ---------------------------------------------------------------------------
// TEST 6: Mixed results (2 proved-safe, 1 counterexample on REENTRANCY, 1 unknown)
//         hardBlockFromSymbolic=false (REENTRANCY counterexample does not auto-hardblock)
// ---------------------------------------------------------------------------

console.log('\n== TEST 6: Mixed results, REENTRANCY counterexample -> hardBlock=false ==');

const mixedInvariants: InvariantDefinition[] = [
  { invariantId: 'AUTH-001',  invariantClass: 'AUTHORIZATION',   description: 'Auth proved' },
  { invariantId: 'ACCT-001',  invariantClass: 'ACCOUNTING',      description: 'Acct proved' },
  { invariantId: 'REENT-001', invariantClass: 'REENTRANCY_STATE', description: 'Reent cex'  },
  { invariantId: 'REENT-002', invariantClass: 'REENTRANCY_STATE', description: 'Reent unk'  },
];

const reentCounterexample = [
  'attacker.reenter()',
  'balance check not yet updated',
  'double-withdrawal achieved',
];

const engine6 = new AdvisoryStubEngine({
  knownProvedSafe:      new Set(['AUTH-001', 'ACCT-001']),
  knownCounterexamples: new Map([['REENT-001', reentCounterexample]]),
  // REENT-002 gets default unknown/timeout
});
const result6 = runStageB({ invariants: mixedInvariants, engine: engine6, runId: 'SPEC-B-006' });

check('summary.provedSafe = 2',
  result6.summary.provedSafe, 2);
check('summary.counterexamplesFound = 1',
  result6.summary.counterexamplesFound, 1);
check('summary.unknownTimeout = 1',
  result6.summary.unknownTimeout, 1);
check('summary.totalChecked = 4',
  result6.summary.totalChecked, 4);
check('hardBlockFromSymbolic = false (REENTRANCY counterexample, not AUTH/UPGRADE)',
  result6.hardBlockFromSymbolic, false);

const reent001 = result6.invariantResults.find((r) => r.invariantId === 'REENT-001')!;
check('REENT-001 proofterm = 1 (counterexample-found feeds Stage D)',
  reent001.proofterm, 1);

// ---------------------------------------------------------------------------
// TEST 7: engineStatus is always 'STUB' in Advisory tier
// ---------------------------------------------------------------------------

console.log('\n== TEST 7: engineStatus = STUB in Advisory tier ==');

const result7 = runStageB({ runId: 'SPEC-B-007' });
check('StageBResult.engineStatus = STUB',
  result7.engineStatus, 'STUB');
check('all SymbolicInvariantResult engineStatus = STUB',
  result7.invariantResults.every((r) => r.engineStatus === 'STUB'), true);

// Also verify with injected counterexample - still STUB
const engine7b = new AdvisoryStubEngine({
  knownCounterexamples: new Map([['AUTH-001', ['call1', 'call2']]]),
});
const result7b = runStageB({ engine: engine7b, runId: 'SPEC-B-007b' });
check('engineStatus = STUB even with injected counterexamples',
  result7b.engineStatus, 'STUB');

// ---------------------------------------------------------------------------
// TEST 8: proofterm mapping exact - no other values permitted
// ---------------------------------------------------------------------------

console.log('\n== TEST 8: proofterm mapping exact ==');

const allThreeInvariants: InvariantDefinition[] = [
  { invariantId: 'CEX',  invariantClass: 'ACCOUNTING',      description: 'counterexample' },
  { invariantId: 'UNK',  invariantClass: 'REENTRANCY_STATE', description: 'unknown'        },
  { invariantId: 'SAFE', invariantClass: 'AUTHORIZATION',   description: 'proved-safe'    },
];

const engine8 = new AdvisoryStubEngine({
  knownCounterexamples: new Map([['CEX',  ['violating-call']]]),
  knownProvedSafe:      new Set(['SAFE']),
  // UNK gets default unknown/timeout
});
const result8 = runStageB({ invariants: allThreeInvariants, engine: engine8, runId: 'SPEC-B-008' });

const cexR  = result8.invariantResults.find((r) => r.invariantId === 'CEX')!;
const unkR  = result8.invariantResults.find((r) => r.invariantId === 'UNK')!;
const safeR = result8.invariantResults.find((r) => r.invariantId === 'SAFE')!;

check('counterexample-found -> proofterm = 1 (exact)',   cexR.proofterm,  1);
check('unknown/timeout      -> proofterm = 0.5 (exact)', unkR.proofterm,  0.5);
check('proved-safe          -> proofterm = 0 (exact)',   safeR.proofterm, 0);

// Confirm no other proofterm values exist in any result
const allProofterms = result8.invariantResults.map((r) => r.proofterm);
const validProofterms = new Set<number>([0, 0.5, 1]);
check('no out-of-spec proofterm values anywhere',
  allProofterms.every((p) => validProofterms.has(p)), true);

// ---------------------------------------------------------------------------
// TEST 9: counterexample field populated iff result=counterexample-found
// ---------------------------------------------------------------------------

console.log('\n== TEST 9: counterexample field population ==');

check('counterexample populated on counterexample-found',
  Array.isArray(cexR.counterexample) && cexR.counterexample.length > 0, true);
check('counterexample absent on proved-safe',
  safeR.counterexample === undefined, true);
check('counterexample absent on unknown/timeout',
  unkR.counterexample === undefined, true);

// timeoutMs populated on unknown/timeout
check('timeoutMs populated on unknown/timeout',
  typeof unkR.timeoutMs === 'number' && unkR.timeoutMs > 0, true);
check('timeoutMs absent on counterexample-found',
  cexR.timeoutMs === undefined, true);
check('timeoutMs absent on proved-safe',
  safeR.timeoutMs === undefined, true);

// ---------------------------------------------------------------------------
// TEST 10: StageBResult shape complete + structural checks
// ---------------------------------------------------------------------------

console.log('\n== TEST 10: StageBResult shape complete ==');

const result10 = runStageB({ runId: 'SPEC-B-010' });

check('stageBRunId is string',
  typeof result10.stageBRunId === 'string', true);
check('completedAt is number > 0',
  typeof result10.completedAt === 'number' && result10.completedAt > 0, true);
check('invariantResults is array',
  Array.isArray(result10.invariantResults), true);
check('invariantResults non-empty (default invariants)',
  result10.invariantResults.length > 0, true);
check('summary.totalChecked === invariantResults.length',
  result10.summary.totalChecked, result10.invariantResults.length);
check('summary.provedSafe + counterexamplesFound + unknownTimeout === totalChecked',
  result10.summary.provedSafe +
  result10.summary.counterexamplesFound +
  result10.summary.unknownTimeout,
  result10.summary.totalChecked);
check('hardBlockFromSymbolic is boolean',
  typeof result10.hardBlockFromSymbolic === 'boolean', true);
check('engineStatus is string',
  typeof result10.engineStatus === 'string', true);

// Each SymbolicInvariantResult has all required fields
const firstResult = result10.invariantResults[0];
check('invariantResult has invariantClass',
  typeof firstResult.invariantClass === 'string', true);
check('invariantResult has invariantId',
  typeof firstResult.invariantId === 'string', true);
check('invariantResult has description',
  typeof firstResult.description === 'string', true);
check('invariantResult has result',
  typeof firstResult.result === 'string', true);
check('invariantResult has proofterm',
  typeof firstResult.proofterm === 'number', true);
check('invariantResult has engineStatus',
  typeof firstResult.engineStatus === 'string', true);

// All four invariant classes represented in default run
const classes = new Set(result10.invariantResults.map((r) => r.invariantClass));
check('AUTHORIZATION class present',   classes.has('AUTHORIZATION'),   true);
check('UPGRADE class present',         classes.has('UPGRADE'),         true);
check('ACCOUNTING class present',      classes.has('ACCOUNTING'),      true);
check('REENTRANCY_STATE class present', classes.has('REENTRANCY_STATE'), true);

// knownCounterexamples priority over knownProvedSafe (same id in both)
console.log('\n-- Injection priority: counterexample > proved-safe --');
const priorityEngine = new AdvisoryStubEngine({
  knownCounterexamples: new Map([['AUTH-001', ['cex-call']]]),
  knownProvedSafe:      new Set(['AUTH-001']),  // same id - counterexample must win
});
const prioResult = runStageB({
  invariants: [{ invariantId: 'AUTH-001', invariantClass: 'AUTHORIZATION', description: 'prio' }],
  engine: priorityEngine,
  runId: 'SPEC-B-PRIO',
});
check('counterexample takes priority over proved-safe for same id',
  prioResult.invariantResults[0].result, 'counterexample-found');

// ---------------------------------------------------------------------------
// TEST 11: HalmosAdapter — HALMOS_UNAVAILABLE when halmos not installed
// Halmos is not installed in this environment (pip install halmos required).
// HalmosAdapter must return 'HALMOS_UNAVAILABLE' for AUTH/UPGRADE invariants,
// and must NOT produce false positives (hardBlock stays false).
// ---------------------------------------------------------------------------

console.log('\n== TEST 11: HalmosAdapter returns HALMOS_UNAVAILABLE when halmos not installed ==');

const halmosAdapter = new HalmosAdapter({ loopBound: 3 });

const authInv: InvariantDefinition = {
  invariantId: 'AUTH-001',
  invariantClass: 'AUTHORIZATION',
  description: 'AUTH-001 halmos test',
};
const upgradeInv: InvariantDefinition = {
  invariantId: 'UPGRADE-001',
  invariantClass: 'UPGRADE',
  description: 'UPGRADE-001 halmos test',
};

const authResult11  = halmosAdapter.check(authInv);
const upgradeResult11 = halmosAdapter.check(upgradeInv);

check('T11a: AUTH-001 with HalmosAdapter → result = unknown/timeout (halmos unavailable)',
  authResult11.result, 'unknown/timeout');
check('T11b: AUTH-001 engineStatus = HALMOS_UNAVAILABLE',
  authResult11.engineStatus, 'HALMOS_UNAVAILABLE');
check('T11c: UPGRADE-001 with HalmosAdapter → result = unknown/timeout',
  upgradeResult11.result, 'unknown/timeout');
check('T11d: UPGRADE-001 engineStatus = HALMOS_UNAVAILABLE',
  upgradeResult11.engineStatus, 'HALMOS_UNAVAILABLE');
check('T11e: no counterexample from unavailable halmos (no false positives)',
  authResult11.counterexample === undefined, true);

// ---------------------------------------------------------------------------
// TEST 12: HalmosAdapter scope restriction — ACCOUNTING and REENTRANCY_STATE
// are outside Halmos scope. They must fall through to stub behavior (STUB
// engineStatus, not HALMOS_UNAVAILABLE) regardless of halmos availability.
// ---------------------------------------------------------------------------

console.log('\n== TEST 12: HalmosAdapter scope restriction — ACCOUNTING/REENTRANCY uses STUB path ==');

const acctInv12: InvariantDefinition = {
  invariantId: 'ACCT-001',
  invariantClass: 'ACCOUNTING',
  description: 'ACCT-001 halmos scope test',
};
const reentInv12: InvariantDefinition = {
  invariantId: 'REENT-001',
  invariantClass: 'REENTRANCY_STATE',
  description: 'REENT-001 halmos scope test',
};

const acctResult12  = halmosAdapter.check(acctInv12);
const reentResult12 = halmosAdapter.check(reentInv12);

check('T12a: ACCOUNTING invariant → engineStatus = STUB (not HALMOS_UNAVAILABLE)',
  acctResult12.engineStatus, 'STUB');
check('T12b: REENTRANCY_STATE invariant → engineStatus = STUB (not HALMOS_UNAVAILABLE)',
  reentResult12.engineStatus, 'STUB');
check('T12c: ACCOUNTING result = unknown/timeout (stub default)',
  acctResult12.result, 'unknown/timeout');
check('T12d: REENTRANCY_STATE result = unknown/timeout (stub default)',
  reentResult12.result, 'unknown/timeout');

// ---------------------------------------------------------------------------
// TEST 13: runStageB with HalmosAdapter → StageBResult.engineStatus = HALMOS_UNAVAILABLE
// When HalmosAdapter is used but halmos is absent, the overall StageBResult must
// carry HALMOS_UNAVAILABLE so callers know the live engine was not actually reached.
// ---------------------------------------------------------------------------

console.log('\n== TEST 13: runStageB with HalmosAdapter → engineStatus = HALMOS_UNAVAILABLE ==');

const result13 = runStageB({
  engine: halmosAdapter,
  runId:  'SPEC-B-013',
});

check('T13a: StageBResult.engineStatus = HALMOS_UNAVAILABLE',
  result13.engineStatus, 'HALMOS_UNAVAILABLE');
check('T13b: AUTH invariant results carry HALMOS_UNAVAILABLE',
  result13.invariantResults
    .filter(r => r.invariantClass === 'AUTHORIZATION')
    .every(r => r.engineStatus === 'HALMOS_UNAVAILABLE'),
  true);
check('T13c: ACCOUNTING/REENTRANCY results carry STUB (scope exclusion preserved)',
  result13.invariantResults
    .filter(r => r.invariantClass === 'ACCOUNTING' || r.invariantClass === 'REENTRANCY_STATE')
    .every(r => r.engineStatus === 'STUB'),
  true);

// ---------------------------------------------------------------------------
// TEST 14: HalmosAdapter unavailability must NOT set hardBlockFromSymbolic=true
// Unknown/timeout from HALMOS_UNAVAILABLE is honest uncertainty, not evidence.
// Hard-block escalation requires counterexample-found — unknown is not enough.
// ---------------------------------------------------------------------------

console.log('\n== TEST 14: HALMOS_UNAVAILABLE does not trigger hardBlockFromSymbolic ==');

check('T14a: hardBlockFromSymbolic = false when HalmosAdapter returns HALMOS_UNAVAILABLE',
  result13.hardBlockFromSymbolic, false);
check('T14b: summary.counterexamplesFound = 0 (HALMOS_UNAVAILABLE contributes no counterexamples)',
  result13.summary.counterexamplesFound, 0);
check('T14c: engineStatus = HALMOS_UNAVAILABLE (caller can detect and warn)',
  result13.engineStatus, 'HALMOS_UNAVAILABLE');

// ---------------------------------------------------------------------------
// TEST 15: boundedProofDepth and proofScope fields — interface contract test
// These fields are set by HalmosAdapter when halmos IS available and returns
// proved-safe. Since halmos is not installed here, we verify the fields are
// present on SymbolicInvariantResult type (compile-time) and that the stub
// can carry them when injected. Tests the forward-compatible interface.
// ---------------------------------------------------------------------------

console.log('\n== TEST 15: boundedProofDepth / proofScope fields — interface contract ==');

// Verify the AdvisoryStubEngine result does NOT carry boundedProofDepth (only Halmos sets it).
const stubProvedSafe = new AdvisoryStubEngine({ knownProvedSafe: new Set(['AUTH-001']) });
const result15 = runStageB({
  invariants: [authInv],
  engine: stubProvedSafe,
  runId:  'SPEC-B-015',
});
const auth15 = result15.invariantResults[0];

check('T15a: AdvisoryStubEngine proved-safe does NOT set boundedProofDepth (only Halmos sets this)',
  auth15.boundedProofDepth === undefined, true);
check('T15b: AdvisoryStubEngine proved-safe does NOT set proofScope (only Halmos sets this)',
  auth15.proofScope === undefined, true);
check('T15c: result is proved-safe (sanity check)',
  auth15.result, 'proved-safe');

// Verify that the EngineAdapterResult interface accepts boundedProofDepth and proofScope.
// This is a compile-time check — if these fields were missing from the interface, TypeScript
// would have already failed. We confirm at runtime that an object with these fields is valid.
const mockBoundedResult: import('../lib/stages/stageB-symbolic').EngineAdapterResult = {
  result:            'proved-safe',
  engineStatus:      'LIVE',
  boundedProofDepth: 3,
  proofScope:        'BOUNDED',
};
check('T15d: EngineAdapterResult can carry boundedProofDepth=3',
  mockBoundedResult.boundedProofDepth, 3);
check('T15e: EngineAdapterResult proofScope=BOUNDED (not ABSOLUTE — halmos gives bounded proof only)',
  mockBoundedResult.proofScope, 'BOUNDED');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('\n-------------------------------------------');
console.log(`  ${passed} passed    ${failed} failed`);
if (failed > 0) {
  console.error('\n  STAGE B TESTS DID NOT PASS - do not proceed to Stage C');
  process.exit(1);
} else {
  console.log('\n  All Stage B tests verified. Report to operator before proceeding to Stage C.');
}
