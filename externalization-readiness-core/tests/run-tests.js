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
    rightsReview: { blockedCount: 1, manualReviewCount: 0, conditionalCount: 1 },
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
    rightsReview: { blockedCount: 0, manualReviewCount: 0, conditionalCount: 1 },
    gnosis: { integrityStatus: 'clear' },
    boundaryStress: { escalationTier: 'tier1', pauseSuggested: false },
    emergenceObservation: { readiness: 'forming' },
  });

  assert.equal(snapshot.status, 'conditional');
});
