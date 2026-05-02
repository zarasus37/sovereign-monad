// hepar/tests/actionBand.test.ts
// assignActionBand() unit tests — 8 test cases, 20 assertions.
// Run: node dist/hepar/tests/actionBand.test.js

import { assignActionBand, bandFromScore } from '../lib/scoring/actionBand';
import type { FindingVector } from '../types/hepar.types';

// ---------------------------------------------------------------------------
// Test harness
// ---------------------------------------------------------------------------

let passed = 0;
let failed = 0;

function check(label: string, condition: boolean): void {
  if (condition) {
    passed++;
    process.stdout.write(`  PASS  ${label}\n`);
  } else {
    failed++;
    process.stderr.write(`  FAIL  ${label}\n`);
  }
}

// ---------------------------------------------------------------------------
// Minimal FindingVector factory
// agentsFound / totalAgents drive getConvergenceLabel() inside assignActionBand.
// ---------------------------------------------------------------------------

function makeVector(
  vectorId: string,
  agentsFound: number,
  totalAgents: number,
  severity: number,
): FindingVector {
  return {
    vectorId,
    severity,
    consensus: agentsFound / totalAgents,
    repro: 0.80,
    proofStatus: 'unknown/timeout',
    estLoss: { low: 0, high: 100_000 },
    agentsFound,
    totalAgents,
    reproducibilityTraceIds: [`TRACE-${vectorId}`],
  };
}

// ---------------------------------------------------------------------------
// T1: consensus=0.60 (3/5), severity=9, score=10
//     PROBABLE_CRITICAL_RESTRICT fires -> RESTRICTED minimum
// ---------------------------------------------------------------------------
console.log('\nT1: PROBABLE+CRITICAL (3/5, sev=9) -> RESTRICTED');
{
  const vectors = [makeVector('PROB-CRIT', 3, 5, 9)];
  const result = assignActionBand(10, vectors);

  check('T1a: band = RESTRICTED',
    result.band === 'RESTRICTED');
  check('T1b: escalated = true',
    result.escalated === true);
  check('T1c: PROBABLE_CRITICAL_RESTRICT in reasons',
    result.reasons.some(r => r.rule === 'PROBABLE_CRITICAL_RESTRICT'));
}

// ---------------------------------------------------------------------------
// T2: consensus=0.60 (3/5), severity=8, score=10
//     Rule requires sev>=9; band follows score (ALLOW)
// ---------------------------------------------------------------------------
console.log('\nT2: PROBABLE (3/5) + sev=8 -> score-driven (rule does not fire)');
{
  const vectors = [makeVector('PROB-HIGH', 3, 5, 8)];
  const result = assignActionBand(10, vectors);

  check('T2a: band = ALLOW (score=10, no escalation rule fires)',
    result.band === 'ALLOW');
  check('T2b: PROBABLE_CRITICAL_RESTRICT absent from reasons',
    result.reasons.every(r => r.rule !== 'PROBABLE_CRITICAL_RESTRICT'));
}

// ---------------------------------------------------------------------------
// T3: agentsFound=2 (POSSIBLE, ratio=0.40 < 0.60), severity=9, score=10
//     Rule requires cons>=0.60; band follows score
// ---------------------------------------------------------------------------
console.log('\nT3: POSSIBLE (2/5, ratio=0.40) + sev=9 -> score-driven (rule does not fire)');
{
  const vectors = [makeVector('POSS-CRIT', 2, 5, 9)];
  const result = assignActionBand(10, vectors);

  check('T3a: band = ALLOW (POSSIBLE not PROBABLE, rule does not fire)',
    result.band === 'ALLOW');
  check('T3b: PROBABLE_CRITICAL_RESTRICT absent from reasons',
    result.reasons.every(r => r.rule !== 'PROBABLE_CRITICAL_RESTRICT'));
}

// ---------------------------------------------------------------------------
// T4: consensus=0.60 (3/5), severity=9, score=15 (ALLOW from score)
//     Rule overrides ALLOW floor to RESTRICTED
// ---------------------------------------------------------------------------
console.log('\nT4: PROBABLE+CRITICAL, score=15 (ALLOW) -> RESTRICTED (rule overrides)');
{
  const vectors = [makeVector('PROB-CRIT-OVERRIDE', 3, 5, 9)];
  const result = assignActionBand(15, vectors);

  check('T4a: band = RESTRICTED (overrides score-band ALLOW)',
    result.band === 'RESTRICTED');
  check('T4b: scoreBand = ALLOW',
    result.scoreBand === 'ALLOW');
}

// ---------------------------------------------------------------------------
// T5: consensus=0.60 (3/5), severity=9, score=65 (DENY from score)
//     Rule sets minimum RESTRICTED, does not cap at RESTRICTED; DENY wins
// ---------------------------------------------------------------------------
console.log('\nT5: PROBABLE+CRITICAL, score=65 (DENY) -> DENY unchanged (rule is floor only)');
{
  const vectors = [makeVector('PROB-CRIT-NOCAP', 3, 5, 9)];
  const result = assignActionBand(65, vectors);

  check('T5a: band = DENY (score-band is higher than RESTRICTED floor)',
    result.band === 'DENY');
  check('T5b: PROBABLE_CRITICAL_RESTRICT still fires (qualifying vector found)',
    result.reasons.some(r => r.rule === 'PROBABLE_CRITICAL_RESTRICT'));
}

// ---------------------------------------------------------------------------
// T6: consensus=1.0 (5/5 CERTAIN), severity=9 -> HARDBLOCK
//     CERTAIN_CRITICAL_HARDBLOCK fires; PROBABLE_CRITICAL_RESTRICT does not apply
//     (CERTAIN is not PROBABLE; rule uses exact getConvergenceLabel check)
// ---------------------------------------------------------------------------
console.log('\nT6: CERTAIN+CRITICAL (5/5, sev=9) -> HARDBLOCK (CERTAIN_CRITICAL wins)');
{
  const vectors = [makeVector('CERTAIN-CRIT', 5, 5, 9)];
  const result = assignActionBand(10, vectors);

  check('T6a: band = HARDBLOCK',
    result.band === 'HARDBLOCK');
  check('T6b: CERTAIN_CRITICAL_HARDBLOCK in reasons',
    result.reasons.some(r => r.rule === 'CERTAIN_CRITICAL_HARDBLOCK'));
  check('T6c: PROBABLE_CRITICAL_RESTRICT absent (CERTAIN != PROBABLE)',
    result.reasons.every(r => r.rule !== 'PROBABLE_CRITICAL_RESTRICT'));
}

// ---------------------------------------------------------------------------
// T7: Two vectors — one PROBABLE+sev=9 (qualifying), one EDGE_CASE+sev=4
//     RESTRICTED fires; triggeringVectors contains only the qualifying vector
// ---------------------------------------------------------------------------
console.log('\nT7: Mixed vectors: PROBABLE+sev=9 + EDGE_CASE+sev=4 -> RESTRICTED, correct triggeringVectors');
{
  const qualifying = makeVector('PROB-CRIT-VEC', 3, 5, 9);
  const low        = makeVector('LOW-VEC', 1, 5, 4);
  const result = assignActionBand(10, [qualifying, low]);

  check('T7a: band = RESTRICTED',
    result.band === 'RESTRICTED');
  check('T7b: PROBABLE_CRITICAL_RESTRICT in reasons',
    result.reasons.some(r => r.rule === 'PROBABLE_CRITICAL_RESTRICT'));
  check('T7c: triggeringVectors contains the qualifying vector',
    result.triggeringVectors.some(v => v.vectorId === 'PROB-CRIT-VEC'));
  check('T7d: triggeringVectors does not contain the low-severity vector',
    result.triggeringVectors.every(v => v.vectorId !== 'LOW-VEC'));
}

// ---------------------------------------------------------------------------
// T8: No qualifying vector (PROBABLE but sev=8 only) -> rule does not fire
// ---------------------------------------------------------------------------
console.log('\nT8: No PROBABLE+CRITICAL vector -> PROBABLE_CRITICAL_RESTRICT does not fire');
{
  const vectors = [
    makeVector('PROB-HIGH-ONLY', 3, 5, 8),
    makeVector('EDGE-LOW', 1, 5, 3),
  ];
  const result = assignActionBand(10, vectors);

  check('T8a: PROBABLE_CRITICAL_RESTRICT absent from reasons',
    result.reasons.every(r => r.rule !== 'PROBABLE_CRITICAL_RESTRICT'));
  check('T8b: triggeringVectors empty (no escalation rule fired)',
    result.triggeringVectors.length === 0);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log('\n---------------------------------------------------');
console.log(`ActionBand Tests: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
