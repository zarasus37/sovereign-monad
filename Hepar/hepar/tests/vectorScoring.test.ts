/**
 * HEPAR - vectorScoring.test.ts
 * Tier: ADVISORY (fixture-verified only, not live-telemetry-verified)
 *
 * Verifies the two binding test vectors from the spec.
 *
 * Test 1: severity=9, consensus=1.0 (5/5), repro=1.0, proof=counterexample-found
 *   Expected: risk(v) = 9*0.55 + 1.0*0.25 + 1.0*0.20 + 1.0
 *                     = 4.95   + 0.25      + 0.20     + 1.00 = 6.40
 *   Expected convergence: CERTAIN
 *   Expected band: HARDBLOCK (CERTAIN CRITICAL override)
 *
 * Test 2: severity=4, consensus=0.4 (2/5), repro=0.5, proof=unknown/timeout
 *   Expected: risk(v) = 4*0.55 + 0.4*0.25 + 0.5*0.20 + 0.5
 *                     = 2.20   + 0.10      + 0.10     + 0.50 = 2.90
 *   Expected convergence: POSSIBLE
 */

import { scoreVector, proofterm } from '../lib/scoring/vectorScoring';
import { getConvergenceLabel, convergenceLabelFromRatio } from '../lib/scoring/convergenceLabels';
import { assignActionBand, bandFromScore } from '../lib/scoring/actionBand';
import type { FindingVector } from '../types/hepar.types';

// ---------------------------------------------------------------------------
// Minimal inline test harness (no external runner dependency)
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
// proofterm unit tests
// ---------------------------------------------------------------------------

console.log('\n-- proofterm() --');
check('counterexample-found -> 1.0', proofterm('counterexample-found'), 1.0);
check('unknown/timeout      -> 0.5', proofterm('unknown/timeout'),      0.5);
check('proved-safe          -> 0.0', proofterm('proved-safe'),          0.0);

// ---------------------------------------------------------------------------
// convergence label unit tests
// ---------------------------------------------------------------------------

console.log('\n-- getConvergenceLabel() --');
check('5/5 -> CERTAIN',   getConvergenceLabel(5, 5), 'CERTAIN');
check('4/5 -> HIGH',      getConvergenceLabel(4, 5), 'HIGH');
check('3/5 -> PROBABLE',  getConvergenceLabel(3, 5), 'PROBABLE');
check('2/5 -> POSSIBLE',  getConvergenceLabel(2, 5), 'POSSIBLE');
check('1/5 -> EDGE_CASE', getConvergenceLabel(1, 5), 'EDGE_CASE');
check('0/5 -> EDGE_CASE', getConvergenceLabel(0, 5), 'EDGE_CASE');

console.log('\n-- convergenceLabelFromRatio() --');
check('1.0 -> CERTAIN',   convergenceLabelFromRatio(1.0),  'CERTAIN');
check('0.8 -> HIGH',      convergenceLabelFromRatio(0.8),  'HIGH');
check('0.6 -> PROBABLE',  convergenceLabelFromRatio(0.6),  'PROBABLE');
check('0.4 -> POSSIBLE',  convergenceLabelFromRatio(0.4),  'POSSIBLE');
check('0.2 -> EDGE_CASE', convergenceLabelFromRatio(0.2),  'EDGE_CASE');
check('0.0 -> EDGE_CASE', convergenceLabelFromRatio(0.0),  'EDGE_CASE');

// ---------------------------------------------------------------------------
// bandFromScore unit tests
// ---------------------------------------------------------------------------

console.log('\n-- bandFromScore() --');
check('score=0   -> ALLOW',         bandFromScore(0),   'ALLOW');
check('score=19  -> ALLOW',         bandFromScore(19),  'ALLOW');
check('score=20  -> GUARDED_ALLOW', bandFromScore(20),  'GUARDED_ALLOW');
check('score=39  -> GUARDED_ALLOW', bandFromScore(39),  'GUARDED_ALLOW');
check('score=40  -> RESTRICTED',    bandFromScore(40),  'RESTRICTED');
check('score=59  -> RESTRICTED',    bandFromScore(59),  'RESTRICTED');
check('score=60  -> DENY',          bandFromScore(60),  'DENY');
check('score=79  -> DENY',          bandFromScore(79),  'DENY');
check('score=80  -> HARDBLOCK',     bandFromScore(80),  'HARDBLOCK');
check('score=100 -> HARDBLOCK',     bandFromScore(100), 'HARDBLOCK');

// ---------------------------------------------------------------------------
// SPEC TEST VECTOR 1
//   severity=9, consensus=1.0 (5/5), repro=1.0, proof=counterexample-found
//   risk(v) = 4.95 + 0.25 + 0.20 + 1.00 = 6.40
//   convergence: CERTAIN
//   band: HARDBLOCK (CERTAIN CRITICAL override)
// ---------------------------------------------------------------------------

console.log('\n== SPEC TEST VECTOR 1 ==');
console.log('   severity=9  consensus=1.0 (5/5)  repro=1.0  proof=counterexample-found');
console.log('   Expected risk(v) = 6.40   Expected band = HARDBLOCK');

const vec1: FindingVector = {
  vectorId: 'SPEC-TEST-001',
  severity:  9,
  consensus: 1.0,
  repro:     1.0,
  proofStatus: 'counterexample-found',
  estLoss: { low: 0, high: 0 },
  agentsFound: 5,
  totalAgents: 5,
  reproducibilityTraceIds: [],
};

const risk1 = scoreVector(vec1);
check('risk(v) = 6.40', risk1, 6.40, 1e-9);
check('convergenceLabel = CERTAIN', vec1.convergenceLabel, 'CERTAIN');

// Score band alone would be DENY (65); escalation must override to HARDBLOCK
const band1 = assignActionBand(65, [vec1]);
check('band = HARDBLOCK (override from DENY)', band1.band, 'HARDBLOCK');
check('scoreBand = DENY', band1.scoreBand, 'DENY');
check('escalated = true', band1.escalated, true);
check('rule CERTAIN_CRITICAL_HARDBLOCK fired',
  band1.reasons.some((r) => r.rule === 'CERTAIN_CRITICAL_HARDBLOCK'), true);
check('vec1 in triggeringVectors', band1.triggeringVectors.includes(vec1), true);

// Also verify HARDBLOCK is set even when score is in ALLOW range
const band1Low = assignActionBand(5, [vec1]);
check('band = HARDBLOCK even when score=5', band1Low.band, 'HARDBLOCK');

// ---------------------------------------------------------------------------
// SPEC TEST VECTOR 2
//   severity=4, consensus=0.4 (2/5), repro=0.5, proof=unknown/timeout
//   risk(v) = 2.20 + 0.10 + 0.10 + 0.50 = 2.90
//   convergence: POSSIBLE
// ---------------------------------------------------------------------------

console.log('\n== SPEC TEST VECTOR 2 ==');
console.log('   severity=4  consensus=0.4 (2/5)  repro=0.5  proof=unknown/timeout');
console.log('   Expected risk(v) = 2.90   Expected convergence = POSSIBLE');

const vec2: FindingVector = {
  vectorId: 'SPEC-TEST-002',
  severity:  4,
  consensus: 0.4,
  repro:     0.5,
  proofStatus: 'unknown/timeout',
  estLoss: { low: 0, high: 0 },
  agentsFound: 2,
  totalAgents: 5,
  reproducibilityTraceIds: [],
};

const risk2 = scoreVector(vec2);
check('risk(v) = 2.90', risk2, 2.90, 1e-9);
check('convergenceLabel = POSSIBLE', vec2.convergenceLabel, 'POSSIBLE');

// Single POSSIBLE vector with low score -> ALLOW, no escalation
const band2 = assignActionBand(10, [vec2]);
check('band = ALLOW (score 10, no escalation)', band2.band, 'ALLOW');
check('escalated = false', band2.escalated, false);
check('requiresCortexReview = false', band2.requiresCortexReview, false);

// ---------------------------------------------------------------------------
// Escalation: HIGH convergence + HIGH severity -> min RESTRICTED
// ---------------------------------------------------------------------------

console.log('\n-- Escalation: HIGH + HIGH-severity (4/5, sev=8) -> min RESTRICTED --');

const vecHighHigh: FindingVector = {
  vectorId: 'ESC-HH-001',
  severity:  8,
  consensus: 0.8,   // 4/5 -> HIGH
  repro:     0.7,
  proofStatus: 'unknown/timeout',
  estLoss: { low: 0, high: 0 },
  agentsFound: 4,
  totalAgents: 5,
  reproducibilityTraceIds: [],
};

const bandHH = assignActionBand(15, [vecHighHigh]);  // score -> ALLOW
check('band = RESTRICTED (HIGH+HIGH escalation over ALLOW)', bandHH.band, 'RESTRICTED');
check('escalated = true', bandHH.escalated, true);
check('rule HIGH_HIGH_RESTRICT fired',
  bandHH.reasons.some((r) => r.rule === 'HIGH_HIGH_RESTRICT'), true);

// ---------------------------------------------------------------------------
// Escalation: multiple PROBABLE -> Cortex review + min RESTRICTED
// ---------------------------------------------------------------------------

console.log('\n-- Escalation: 2x PROBABLE (3/5) -> Cortex + min RESTRICTED --');

function makeProbable(id: string): FindingVector {
  return {
    vectorId: id,
    severity: 5,
    consensus: 0.6,   // 3/5 -> PROBABLE
    repro: 0.5,
    proofStatus: 'unknown/timeout',
    estLoss: { low: 0, high: 0 },
    agentsFound: 3,
    totalAgents: 5,
    reproducibilityTraceIds: [],
  };
}

const bandProb = assignActionBand(25, [makeProbable('P1'), makeProbable('P2')]);
check('requiresCortexReview = true', bandProb.requiresCortexReview, true);
check('rule MULTIPLE_PROBABLE_CORTEX fired',
  bandProb.reasons.some((r) => r.rule === 'MULTIPLE_PROBABLE_CORTEX'), true);

// ---------------------------------------------------------------------------
// proofterm: proved-safe suppresses contribution
// ---------------------------------------------------------------------------

console.log('\n-- proofterm: proved-safe -> contribution = 0 --');

const vecSafe: FindingVector = {
  vectorId: 'SAFE-001',
  severity:  6,
  consensus: 0.6,
  repro:     0.8,
  proofStatus: 'proved-safe',
  estLoss: { low: 0, high: 0 },
  agentsFound: 3,
  totalAgents: 5,
  reproducibilityTraceIds: [],
};

const riskSafe = scoreVector(vecSafe);
// 6*0.55 + 0.6*0.25 + 0.8*0.20 + 0 = 3.30 + 0.15 + 0.16 + 0.00 = 3.61
check('risk(v) with proved-safe = 3.61', riskSafe, 3.61, 1e-9);

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('\n-------------------------------------------');
console.log(`  ${passed} passed    ${failed} failed`);
if (failed > 0) {
  console.error('\n  SPEC VECTORS DID NOT PASS - do not proceed to Stage A');
  process.exit(1);
} else {
  console.log('\n  All spec vectors verified. Ready to proceed to Stage A.');
}
