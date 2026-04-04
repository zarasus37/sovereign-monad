const assert = require('node:assert/strict');
const path = require('node:path');

const { buildRightsReviewSnapshot } = require(path.resolve(__dirname, '..', 'dist', 'index.js'));

function test(name, fn) {
  try {
    fn();
    process.stdout.write(`ok - ${name}\n`);
  } catch (error) {
    process.stderr.write(`not ok - ${name}\n`);
    throw error;
  }
}

test('rights review classifies threshold-only blockers as conditional', () => {
  const snapshot = buildRightsReviewSnapshot([
    {
      eventId: 'evt-1',
      allowed: false,
      reasons: ['diversity thresholds are defined but not met'],
    },
  ]);

  assert.equal(snapshot.conditionalCount, 1);
  assert.equal(snapshot.cases[0].disposition, 'eligible_if_thresholds_met');
});

test('rights review classifies blocked tags as deny', () => {
  const snapshot = buildRightsReviewSnapshot([
    {
      eventId: 'evt-2',
      allowed: false,
      reasons: ['event contains blocked tags: sensitive'],
    },
  ]);

  assert.equal(snapshot.blockedCount, 1);
  assert.equal(snapshot.cases[0].disposition, 'deny');
});

test('rights review classifies sensitive payload as redact and retain internal', () => {
  const snapshot = buildRightsReviewSnapshot([
    {
      eventId: 'evt-3',
      allowed: false,
      reasons: ['event contains sensitive payload'],
    },
  ]);

  assert.equal(snapshot.cases[0].disposition, 'redact_and_retain_internal');
});
