// hepar/tests/disclosure.test.ts
// Tests for disclosureTimer.ts (T1-T15) and disclosureNotifier.ts (T16-T25).
// Advisory Tier: fixture-verified only. All tests are deterministic.

import {
  openDisclosureWindow,
  updateDisclosureStatus,
  grantExtension,
  checkAndEscalate,
  isOverdue,
  daysRemaining,
  severityToWindowDays,
  type DisclosureWindow,
} from '../lib/disclosure/disclosureTimer';

import {
  buildPrivateNotification,
  recordOutcome,
  isReadyForPublication,
  formatPublicDisclosure,
} from '../lib/disclosure/disclosureNotifier';

import type { FindingVector } from '../types/hepar.types';

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
// Fixtures
// ---------------------------------------------------------------------------

const BASE_OPENED_AT = 1_700_000_000_000; // fixed epoch for determinism
const ONE_DAY_MS = 86_400_000;

const SAMPLE_VECTOR: FindingVector = {
  vectorId: 'VEC-001',
  severity: 8,
  consensus: 1.0,
  repro: 1.0,
  proofStatus: 'counterexample-found',
  estLoss: { low: 500_000, high: 2_000_000 },
  agentsFound: 5,
  totalAgents: 5,
  reproducibilityTraceIds: ['trace-001'],
  description: 'Unrestricted mint function',
  exploitPreconditions: ['Attacker must hold any token balance to trigger mint path.'],
};

function makeWindow(
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'CRITICAL',
  openedAt: number = BASE_OPENED_AT
): DisclosureWindow {
  return openDisclosureWindow('RUN-001', 'PROTO-001', 'VEC-001', severity, openedAt);
}

// ---------------------------------------------------------------------------
// T1-T4: Severity window days
// ---------------------------------------------------------------------------

console.log('\nTest 1: CRITICAL severity -> 90 day window');
assert('T1 CRITICAL = 90 days', severityToWindowDays('CRITICAL') === 90);

console.log('\nTest 2: HIGH severity -> 60 day window');
assert('T2 HIGH = 60 days', severityToWindowDays('HIGH') === 60);

console.log('\nTest 3: MEDIUM severity -> 30 day window');
assert('T3 MEDIUM = 30 days', severityToWindowDays('MEDIUM') === 30);

console.log('\nTest 4: LOW severity -> 14 day window');
assert('T4 LOW = 14 days', severityToWindowDays('LOW') === 14);

// ---------------------------------------------------------------------------
// T5: deadlineAt = openedAt + windowDays * 86400000
// ---------------------------------------------------------------------------

console.log('\nTest 5: deadlineAt = openedAt + windowDays * 86400000');
{
  const w = makeWindow('CRITICAL', BASE_OPENED_AT);
  assert('T5 deadlineAt correct', w.deadlineAt === BASE_OPENED_AT + 90 * ONE_DAY_MS);
}

// ---------------------------------------------------------------------------
// T6-T8: isOverdue
// ---------------------------------------------------------------------------

console.log('\nTest 6: isOverdue false before deadline');
{
  const w = makeWindow('CRITICAL', BASE_OPENED_AT);
  assert('T6 not overdue before deadline', isOverdue(w, BASE_OPENED_AT + 50 * ONE_DAY_MS) === false);
}

console.log('\nTest 7: isOverdue true after deadline with OPEN status');
{
  const w = makeWindow('CRITICAL', BASE_OPENED_AT);
  assert('T7 overdue after deadline', isOverdue(w, BASE_OPENED_AT + 91 * ONE_DAY_MS) === true);
}

console.log('\nTest 8: isOverdue false after deadline when FIX_DEPLOYED');
{
  const base = makeWindow('CRITICAL', BASE_OPENED_AT);
  const fixed = updateDisclosureStatus(base, 'FIX_DEPLOYED', BASE_OPENED_AT + 30 * ONE_DAY_MS);
  assert('T8 FIX_DEPLOYED not overdue', isOverdue(fixed, BASE_OPENED_AT + 91 * ONE_DAY_MS) === false);
}

// ---------------------------------------------------------------------------
// T9-T10: grantExtension
// ---------------------------------------------------------------------------

console.log('\nTest 9: grantExtension populates extension fields correctly');
{
  const w = makeWindow('CRITICAL', BASE_OPENED_AT);
  const extended = grantExtension(w, 30, BASE_OPENED_AT + 80 * ONE_DAY_MS);
  assert('T9a extensionGranted=true',       extended.extensionGranted === true);
  assert('T9b extensionDays=30',            extended.extensionDays === 30);
  assert('T9c extensionGrantedAt correct',  extended.extensionGrantedAt === BASE_OPENED_AT + 80 * ONE_DAY_MS);
  assert('T9d extendedDeadlineAt correct',  extended.extendedDeadlineAt === w.deadlineAt + 30 * ONE_DAY_MS);
  assert('T9e status=EXTENDED',             extended.status === 'EXTENDED');
}

console.log('\nTest 10: grantExtension throws on second extension');
{
  const w = makeWindow('CRITICAL', BASE_OPENED_AT);
  const extended = grantExtension(w, 30, BASE_OPENED_AT + 80 * ONE_DAY_MS);
  assertThrows('T10 double extension throws', () => grantExtension(extended, 10, BASE_OPENED_AT + 85 * ONE_DAY_MS));
}

// ---------------------------------------------------------------------------
// T11-T13: checkAndEscalate
// ---------------------------------------------------------------------------

console.log('\nTest 11: checkAndEscalate OPEN overdue -> IGNORED');
{
  const w = makeWindow('CRITICAL', BASE_OPENED_AT);
  const result = checkAndEscalate(w, BASE_OPENED_AT + 91 * ONE_DAY_MS);
  assert('T11a status=IGNORED',           result.status === 'IGNORED');
  assert('T11b outcome=PROTOCOL_IGNORED', result.outcome === 'PROTOCOL_IGNORED');
}

console.log('\nTest 12: checkAndEscalate ACKNOWLEDGED overdue -> IGNORED');
{
  const base = makeWindow('CRITICAL', BASE_OPENED_AT);
  const acked = updateDisclosureStatus(base, 'ACKNOWLEDGED', BASE_OPENED_AT + 5 * ONE_DAY_MS);
  const result = checkAndEscalate(acked, BASE_OPENED_AT + 91 * ONE_DAY_MS);
  assert('T12 ACKNOWLEDGED -> IGNORED', result.status === 'IGNORED');
}

console.log('\nTest 13: checkAndEscalate non-overdue window unchanged');
{
  const w = makeWindow('CRITICAL', BASE_OPENED_AT);
  const result = checkAndEscalate(w, BASE_OPENED_AT + 50 * ONE_DAY_MS);
  assert('T13a status unchanged=OPEN', result.status === 'OPEN');
  assert('T13b no outcome set',        result.outcome === undefined);
}

// ---------------------------------------------------------------------------
// T14: daysRemaining
// ---------------------------------------------------------------------------

console.log('\nTest 14: daysRemaining positive before deadline, negative after');
{
  const w = makeWindow('CRITICAL', BASE_OPENED_AT);
  const before = daysRemaining(w, BASE_OPENED_AT + 50 * ONE_DAY_MS);
  const after  = daysRemaining(w, BASE_OPENED_AT + 91 * ONE_DAY_MS);
  assert('T14a positive before deadline', before > 0);
  assert('T14b negative after deadline',  after < 0);
}

// ---------------------------------------------------------------------------
// T15: isOverdue uses extendedDeadlineAt when extension granted
// ---------------------------------------------------------------------------

console.log('\nTest 15: isOverdue uses extendedDeadlineAt after extension');
{
  const w = makeWindow('CRITICAL', BASE_OPENED_AT);
  const extended = grantExtension(w, 30, BASE_OPENED_AT + 80 * ONE_DAY_MS);
  // original deadline: openedAt + 90d; extended: openedAt + 120d
  const afterOriginal = BASE_OPENED_AT + 91 * ONE_DAY_MS;
  const afterExtended = BASE_OPENED_AT + 121 * ONE_DAY_MS;
  assert('T15a not overdue between original and extended deadline', isOverdue(extended, afterOriginal) === false);
  assert('T15b overdue after extended deadline',                    isOverdue(extended, afterExtended) === true);
}

// ---------------------------------------------------------------------------
// T16-T17: exploitCodeIncluded constraint
// ---------------------------------------------------------------------------

console.log('\nTest 16: buildPrivateNotification always sets exploitCodeIncluded=false');
{
  const w = makeWindow('CRITICAL', BASE_OPENED_AT);
  const n = buildPrivateNotification(w, SAMPLE_VECTOR, 'security@protocol.io', BASE_OPENED_AT + 1000);
  assert('T16 exploitCodeIncluded=false', n.exploitCodeIncluded === false);
}

console.log('\nTest 17: buildPrivateNotification throws when opts.exploitCodeIncluded=true');
{
  const w = makeWindow('CRITICAL', BASE_OPENED_AT);
  assertThrows(
    'T17 exploitCodeIncluded=true throws',
    () => buildPrivateNotification(w, SAMPLE_VECTOR, 'security@protocol.io', BASE_OPENED_AT + 1000, { exploitCodeIncluded: true })
  );
}

// ---------------------------------------------------------------------------
// T18-T20: recordOutcome
// ---------------------------------------------------------------------------

console.log('\nTest 18: PROTOCOL_FIXED credibilityNote contains "accuracy"');
{
  const w = makeWindow('CRITICAL', BASE_OPENED_AT);
  const outcome = recordOutcome(w, 'PROTOCOL_FIXED', 'GREEN', BASE_OPENED_AT + 30 * ONE_DAY_MS);
  assert('T18 credibilityNote has accuracy', outcome.credibilityNote.includes('accuracy'));
}

console.log('\nTest 19: PROTOCOL_IGNORED + RED/BLACK -> legalReviewRequired=true');
{
  const w = makeWindow('CRITICAL', BASE_OPENED_AT);
  const red   = recordOutcome(w, 'PROTOCOL_IGNORED', 'RED',   BASE_OPENED_AT + 91 * ONE_DAY_MS);
  const black = recordOutcome(w, 'PROTOCOL_IGNORED', 'BLACK', BASE_OPENED_AT + 91 * ONE_DAY_MS);
  assert('T19a RED -> legalReviewRequired=true',   red.legalReviewRequired === true);
  assert('T19b BLACK -> legalReviewRequired=true', black.legalReviewRequired === true);
}

console.log('\nTest 20: PROTOCOL_IGNORED + GREEN/YELLOW -> legalReviewRequired=false');
{
  const w = makeWindow('HIGH', BASE_OPENED_AT);
  const green  = recordOutcome(w, 'PROTOCOL_IGNORED', 'GREEN',  BASE_OPENED_AT + 61 * ONE_DAY_MS);
  const yellow = recordOutcome(w, 'PROTOCOL_IGNORED', 'YELLOW', BASE_OPENED_AT + 61 * ONE_DAY_MS);
  assert('T20a GREEN -> legalReviewRequired=false',  green.legalReviewRequired === false);
  assert('T20b YELLOW -> legalReviewRequired=false', yellow.legalReviewRequired === false);
}

// ---------------------------------------------------------------------------
// T21-T22: isReadyForPublication
// ---------------------------------------------------------------------------

console.log('\nTest 21: isReadyForPublication true for PROTOCOL_FIXED + GREEN');
{
  const w = makeWindow('CRITICAL', BASE_OPENED_AT);
  const outcome = recordOutcome(w, 'PROTOCOL_FIXED', 'GREEN', BASE_OPENED_AT + 30 * ONE_DAY_MS);
  assert('T21 PROTOCOL_FIXED + GREEN -> ready', isReadyForPublication(outcome) === true);
}

console.log('\nTest 22: isReadyForPublication false for PROTOCOL_IGNORED + RED');
{
  const w = makeWindow('CRITICAL', BASE_OPENED_AT);
  const outcome = recordOutcome(w, 'PROTOCOL_IGNORED', 'RED', BASE_OPENED_AT + 91 * ONE_DAY_MS);
  assert('T22 PROTOCOL_IGNORED + RED -> not ready', isReadyForPublication(outcome) === false);
}

// ---------------------------------------------------------------------------
// T23-T25: formatPublicDisclosure
// ---------------------------------------------------------------------------

console.log('\nTest 23: formatPublicDisclosure returns well-formed package');
{
  const w = makeWindow('CRITICAL', BASE_OPENED_AT);
  const n = buildPrivateNotification(w, SAMPLE_VECTOR, 'security@protocol.io', BASE_OPENED_AT + 1000);
  const outcome = recordOutcome(w, 'PROTOCOL_FIXED', 'GREEN', BASE_OPENED_AT + 30 * ONE_DAY_MS);
  const pkg = formatPublicDisclosure(n, outcome);
  assert('T23a packageId truthy',         typeof pkg.packageId === 'string' && pkg.packageId.length > 0);
  assert('T23b protocolId correct',       pkg.protocolId === 'PROTO-001');
  assert('T23c vectorId correct',         pkg.vectorId === 'VEC-001');
  assert('T23d outcomePath correct',      pkg.outcomePath === 'PROTOCOL_FIXED');
  assert('T23e correctionApplied=false',  pkg.correctionApplied === false);
  assert('T23f advisoryTierLabel correct',pkg.advisoryTierLabel === 'ADVISORY');
  assert('T23g timelineMs is number',     typeof pkg.timelineMs === 'number');
}

console.log('\nTest 24: evidenceSummary in public package matches notification exactly');
{
  const w = makeWindow('CRITICAL', BASE_OPENED_AT);
  const n = buildPrivateNotification(w, SAMPLE_VECTOR, 'security@protocol.io', BASE_OPENED_AT + 1000);
  const outcome = recordOutcome(w, 'PROTOCOL_FIXED', 'GREEN', BASE_OPENED_AT + 30 * ONE_DAY_MS);
  const pkg = formatPublicDisclosure(n, outcome);
  assert('T24 evidenceSummary unchanged', pkg.evidenceSummary === n.evidenceSummary);
}

console.log('\nTest 25: timelineMs = outcome.recordedAt - notification.openedAt');
{
  const w = makeWindow('CRITICAL', BASE_OPENED_AT);
  const n = buildPrivateNotification(w, SAMPLE_VECTOR, 'security@protocol.io', BASE_OPENED_AT + 1000);
  const recordedAt = BASE_OPENED_AT + 30 * ONE_DAY_MS;
  const outcome = recordOutcome(w, 'PROTOCOL_FIXED', 'GREEN', recordedAt);
  const pkg = formatPublicDisclosure(n, outcome);
  assert('T25 timelineMs correct', pkg.timelineMs === recordedAt - n.openedAt);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------

console.log('\n---------------------------------------------------');
console.log('Disclosure Tests: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
