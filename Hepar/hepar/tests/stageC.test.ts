// hepar/tests/stageC.test.ts
// Stage C Monte Carlo -- 14 test cases.
// Run: node dist/hepar/tests/stageC.test.js

import { runStageC, StageCResult } from '../lib/stages/stageC-montecarlo';
import { AgentFinding, AgentId, SeededLCG, hashToNumber, deriveAgentSeed } from '../lib/stages/stageC-utils';

// ---------------------------------------------------------------------------
// Minimal test harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;
const failures: string[] = [];

function assert(condition: boolean, msg: string): void {
  if (condition) {
    passed++;
    console.log(`  PASS: ${msg}`);
  } else {
    failed++;
    failures.push(msg);
    console.log(`  FAIL: ${msg}`);
  }
}

function assertEq<T>(actual: T, expected: T, msg: string): void {
  if (actual === expected) {
    passed++;
    console.log(`  PASS: ${msg}`);
  } else {
    failed++;
    failures.push(`${msg} -- expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    console.log(`  FAIL: ${msg} -- expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function header(n: number, title: string): void {
  console.log(`\nTest ${n}: ${title}`);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

// Test 1: runStageC() returns a StageCResult with all required fields.
header(1, 'runStageC returns StageCResult with all required fields');
{
  const result = runStageC({ masterSeed: 'SEED-T1', protocolId: 'PROTO-T1' });
  assert(typeof result === 'object' && result !== null, 'result is object');
  assert(Array.isArray(result.agentResults), 'agentResults is array');
  assert(Array.isArray(result.allFindings), 'allFindings is array');
  assert(typeof result.masterSeed === 'string', 'masterSeed is string');
  assert(Array.isArray(result.corpusExchangeLog), 'corpusExchangeLog is array');
  assert(typeof result.stageCRunId === 'string', 'stageCRunId is string');
  assert(typeof result.completedAt === 'number', 'completedAt is number');
  assert(typeof result.executionStatus === 'string', 'executionStatus is string');
  assert(typeof result.totalPathsExecuted === 'number', 'totalPathsExecuted is number');
  assertEq(result.tierLabel, 'ADVISORY', 'tierLabel is ADVISORY');
}

// Test 2: Exactly 5 agents run; agent IDs match expected set.
header(2, 'Exactly 5 agents run with correct IDs');
{
  const result = runStageC({ masterSeed: 'SEED-T2', protocolId: 'PROTO-T2' });
  assertEq(result.agentResults.length, 5, 'agentResults.length === 5');
  const ids = result.agentResults.map((r) => r.agentId);
  const expected: AgentId[] = ['PRIVILEGE', 'ARITHMETIC', 'REENTRANCY', 'ECONOMIC', 'STATE'];
  for (const id of expected) {
    assert(ids.includes(id), `agentResults contains ${id}`);
  }
}

// Test 3: Determinism -- same masterSeed + protocolId produces same finding vectorIds.
header(3, 'Same masterSeed + protocolId produces identical vectorIds (determinism)');
{
  const r1 = runStageC({ masterSeed: 'SEED-DETERM', protocolId: 'PROTO-DETERM' });
  const r2 = runStageC({ masterSeed: 'SEED-DETERM', protocolId: 'PROTO-DETERM' });
  const ids1 = r1.allFindings.map((f) => f.vectorId).sort();
  const ids2 = r2.allFindings.map((f) => f.vectorId).sort();
  assertEq(JSON.stringify(ids1), JSON.stringify(ids2), 'vectorIds are identical across two runs');
  const counts1 = r1.agentResults.map((r) => r.pathsExecuted);
  const counts2 = r2.agentResults.map((r) => r.pathsExecuted);
  assertEq(JSON.stringify(counts1), JSON.stringify(counts2), 'pathsExecuted counts are identical');
}

// Test 4: Different masterSeeds produce different findings.
header(4, 'Different masterSeeds produce different vectorIds');
{
  const r1 = runStageC({ masterSeed: 'SEED-A', protocolId: 'PROTO-X' });
  const r2 = runStageC({ masterSeed: 'SEED-B', protocolId: 'PROTO-X' });
  const ids1 = r1.allFindings.map((f) => f.vectorId).sort().join(',');
  const ids2 = r2.allFindings.map((f) => f.vectorId).sort().join(',');
  assert(ids1 !== ids2, 'vectorIds differ between different master seeds');
}

// Test 5: All five agents have disjoint RNG seeds (no two agents share a seed).
header(5, 'All five agent seeds are disjoint');
{
  const masterSeed = 'SEED-T5';
  const protocolId = 'PROTO-T5';
  const agentOrder: AgentId[] = ['PRIVILEGE', 'ARITHMETIC', 'REENTRANCY', 'ECONOMIC', 'STATE'];
  const seeds = agentOrder.map((_, i) => deriveAgentSeed(masterSeed, i, protocolId));
  const seedSet = new Set(seeds);
  assertEq(seedSet.size, 5, 'all 5 derived seeds are unique');
  for (let i = 0; i < seeds.length; i++) {
    assert(seeds[i]!.includes(`agent${i}`), `seed[${i}] encodes agent index`);
    assert(seeds[i]!.includes(protocolId), `seed[${i}] encodes protocolId`);
  }
}

// Test 6: All agent findings have executionStatus 'STUB'.
header(6, 'All agent results report executionStatus STUB');
{
  const result = runStageC({ masterSeed: 'SEED-T6', protocolId: 'PROTO-T6' });
  for (const ar of result.agentResults) {
    assertEq(ar.executionStatus, 'STUB', `${ar.agentId} executionStatus === STUB`);
  }
  assertEq(result.executionStatus, 'STUB', 'StageCResult.executionStatus === STUB');
}

// Test 7: corpusExchangeLog is non-empty array.
header(7, 'corpusExchangeLog is non-empty');
{
  const result = runStageC({ masterSeed: 'SEED-T7', protocolId: 'PROTO-T7' });
  assert(result.corpusExchangeLog.length > 0, 'corpusExchangeLog.length > 0');
  assert(
    result.corpusExchangeLog.every((entry) => typeof entry === 'string' && entry.length > 0),
    'all corpusExchangeLog entries are non-empty strings'
  );
}

// Test 8: allFindings sorted descending by severity.
header(8, 'allFindings sorted descending by severity');
{
  const result = runStageC({ masterSeed: 'SEED-T8', protocolId: 'PROTO-T8' });
  const sevs = result.allFindings.map((f) => f.severity);
  let sorted = true;
  for (let i = 0; i < sevs.length - 1; i++) {
    if (sevs[i]! < sevs[i + 1]!) {
      sorted = false;
      break;
    }
  }
  assert(sorted, 'allFindings are sorted descending by severity');
}

// Test 9: Each finding has required fields with correct types.
header(9, 'Each finding has all required fields with correct types');
{
  const result = runStageC({ masterSeed: 'SEED-T9', protocolId: 'PROTO-T9' });
  let allValid = true;
  for (const f of result.allFindings) {
    if (
      typeof f.vectorId !== 'string' ||
      typeof f.agentId !== 'string' ||
      typeof f.severity !== 'number' ||
      typeof f.description !== 'string' ||
      !Array.isArray(f.exploitPreconditions) ||
      typeof f.estLoss !== 'object' ||
      typeof f.estLoss.low !== 'number' ||
      typeof f.estLoss.high !== 'number' ||
      typeof f.reproducibilitySeed !== 'string' ||
      typeof f.traceId !== 'string' ||
      typeof f.reproScore !== 'number'
    ) {
      allValid = false;
      console.log(`    BAD FINDING: ${JSON.stringify(f)}`);
    }
  }
  assert(allValid, 'all findings have correct field types');
}

// Test 10: totalPathsExecuted >= 200000 (5 agents x 40000 minimum each).
header(10, 'totalPathsExecuted >= 200000');
{
  const result = runStageC({ masterSeed: 'SEED-T10', protocolId: 'PROTO-T10' });
  assert(result.totalPathsExecuted >= 200000, `totalPathsExecuted=${result.totalPathsExecuted} >= 200000`);
}

// Test 11: forcedFindings injection -- forced severity=10 finding appears in allFindings at index 0.
header(11, 'forcedFindings injected correctly and sorted to top');
{
  const forcedFinding: AgentFinding = {
    vectorId: 'FORCED-T11',
    agentId: 'PRIVILEGE',
    severity: 10,
    description: 'Forced critical finding for test',
    exploitPreconditions: ['test precondition'],
    estLoss: { low: 0, high: 9_999_999 },
    reproducibilitySeed: 'forced-seed',
    traceId: 'forced-trace-001',
    reproScore: 1.0
  };
  const result = runStageC({
    masterSeed: 'SEED-T11',
    protocolId: 'PROTO-T11',
    forcedFindings: { PRIVILEGE: [forcedFinding] }
  });
  assert(result.allFindings.length > 0, 'allFindings non-empty with forced finding');
  assertEq(result.allFindings[0]!.vectorId, 'FORCED-T11', 'forced sev=10 finding is at index 0');
  assertEq(result.allFindings[0]!.severity, 10, 'forced finding severity === 10');
}

// Test 12: SeededLCG is deterministic -- same seed string produces same sequence.
header(12, 'SeededLCG deterministic: same seed produces same sequence');
{
  const rng1 = new SeededLCG('test-seed-12');
  const rng2 = new SeededLCG('test-seed-12');
  const seq1 = [rng1.next(), rng1.next(), rng1.next(), rng1.next(), rng1.next()];
  const seq2 = [rng2.next(), rng2.next(), rng2.next(), rng2.next(), rng2.next()];
  assertEq(JSON.stringify(seq1), JSON.stringify(seq2), 'same seed produces same 5-step sequence');
}

// Test 13: SeededLCG.nextInt stays within [min, max].
header(13, 'SeededLCG.nextInt stays within bounds');
{
  const rng = new SeededLCG('bounds-test-seed');
  let allInRange = true;
  for (let i = 0; i < 200; i++) {
    const v = rng.nextInt(2, 4);
    if (v < 2 || v > 4) {
      allInRange = false;
      console.log(`    Out of range: ${v}`);
    }
  }
  assert(allInRange, 'nextInt(2,4) always returns 2, 3, or 4 over 200 iterations');
}

// Test 14: hashToNumber returns different values for different inputs; same value for same input.
header(14, 'hashToNumber is deterministic and produces distinct values for distinct inputs');
{
  const h1 = hashToNumber('SEED-PROTO-A');
  const h2 = hashToNumber('SEED-PROTO-B');
  const h3 = hashToNumber('SEED-PROTO-A');
  assert(h1 !== h2, 'hashToNumber returns different values for different strings');
  assertEq(h1, h3, 'hashToNumber returns same value for same string');
  assert(typeof h1 === 'number' && Number.isInteger(h1) && h1 >= 0, 'hash is non-negative integer');
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log(`\n${'='.repeat(60)}`);
console.log(`Stage C Tests: ${passed} passed, ${failed} failed`);
if (failures.length > 0) {
  console.log('\nFailed assertions:');
  for (const f of failures) {
    console.log(`  - ${f}`);
  }
  process.exit(1);
} else {
  console.log('All Stage C tests PASSED.');
  process.exit(0);
}
