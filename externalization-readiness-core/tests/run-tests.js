const assert = require('node:assert/strict');
const path = require('node:path');

const { buildExternalizationReadinessSnapshot } = require(
  path.resolve(__dirname, '..', 'dist', 'index.js'),
);

function test(name, fn) {
  try {
    fn();
    process.stdout.write(`ok - ${name}\n`);
  } catch (error) {
    process.stderr.write(`not ok - ${name}\n`);
    throw error;
  }
}

test('readiness blocks when thresholds and integrity are not clear', () => {
  const snapshot = buildExternalizationReadinessSnapshot({
    governance: { thresholdsMet: false, externalizationAllowed: false },
    rightsReview: { blockedCount: 1, manualReviewCount: 0, conditionalCount: 1, openCaseCount: 2 },
    gnosis: { integrityStatus: 'review' },
    boundaryStress: { escalationTier: 'tier1', pauseSuggested: false },
    emergenceObservation: { readiness: 'forming' },
  });

  assert.equal(snapshot.status, 'blocked');
  assert.ok(snapshot.blockers.some((item) => item.includes('population diversity thresholds')));
});

test('readiness becomes conditional when hard blockers clear but caution remains', () => {
  const snapshot = buildExternalizationReadinessSnapshot({
    governance: { thresholdsMet: true, externalizationAllowed: true },
    rightsReview: { blockedCount: 0, manualReviewCount: 0, conditionalCount: 1, openCaseCount: 0 },
    gnosis: { integrityStatus: 'clear' },
    boundaryStress: { escalationTier: 'tier1', pauseSuggested: false },
    emergenceObservation: { readiness: 'forming' },
  });

  assert.equal(snapshot.status, 'conditional');
  assert.ok(snapshot.clearedGates.some((item) => item.includes('rights review queue is resolved')));
});

test('readiness becomes ready when all gates clear and observation is observable', () => {
  const snapshot = buildExternalizationReadinessSnapshot({
    governance: { thresholdsMet: true, externalizationAllowed: true },
    rightsReview: { blockedCount: 0, manualReviewCount: 0, conditionalCount: 0, openCaseCount: 0 },
    gnosis: { integrityStatus: 'clear' },
    boundaryStress: { escalationTier: 'tier0', pauseSuggested: false },
    emergenceObservation: { readiness: 'observable' },
  });

  assert.equal(snapshot.status, 'ready');
  assert.equal(snapshot.blockers.length, 0);
});
