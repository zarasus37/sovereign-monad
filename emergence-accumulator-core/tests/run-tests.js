const assert = require('node:assert/strict');
const path = require('node:path');

const { buildEmergenceAccumulatorSnapshot } = require(
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

const policy = {
  schemaVersion: '1.0.0',
  minimumWindowCountForReview: 5,
  targetWindowCount: 8,
  minimumObservableWindowCount: 2,
  minimumFormingOrBetterStreak: 5,
  cadenceHours: 24,
};

test('emergence accumulator marks the current local baseline as review-ready but not complete', () => {
  const snapshot = buildEmergenceAccumulatorSnapshot(
    [
      { windowId: 'a', timestampMs: 1, readiness: 'forming', markerLevels: {} },
      { windowId: 'b', timestampMs: 2, readiness: 'forming', markerLevels: {} },
      { windowId: 'c', timestampMs: 3, readiness: 'forming', markerLevels: {} },
      { windowId: 'd', timestampMs: 4, readiness: 'forming', markerLevels: {} },
      { windowId: 'e', timestampMs: 5, readiness: 'observable', markerLevels: {} },
    ],
    policy,
    ['capture continuity'],
  );

  assert.equal(snapshot.status, 'review_ready');
  assert.equal(snapshot.remainingWindowCount, 3);
  assert.equal(snapshot.observableWindowCount, 1);
});

test('emergence accumulator clears once the target window count and observable requirement are met', () => {
  const snapshot = buildEmergenceAccumulatorSnapshot(
    [
      { windowId: 'a', timestampMs: 1, readiness: 'forming', markerLevels: {} },
      { windowId: 'b', timestampMs: 2, readiness: 'forming', markerLevels: {} },
      { windowId: 'c', timestampMs: 3, readiness: 'forming', markerLevels: {} },
      { windowId: 'd', timestampMs: 4, readiness: 'forming', markerLevels: {} },
      { windowId: 'e', timestampMs: 5, readiness: 'observable', markerLevels: {} },
      { windowId: 'f', timestampMs: 6, readiness: 'observable', markerLevels: {} },
      { windowId: 'g', timestampMs: 7, readiness: 'observable', markerLevels: {} },
      { windowId: 'h', timestampMs: 8, readiness: 'observable', markerLevels: {} },
    ],
    policy,
    ['capture continuity'],
  );

  assert.equal(snapshot.status, 'target_met');
  assert.equal(snapshot.remainingWindowCount, 0);
  assert.equal(snapshot.observableWindowCount, 4);
});
