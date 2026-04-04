const assert = require('node:assert/strict');
const path = require('node:path');

const { buildEmergenceBaselineSnapshot } = require(
  path.resolve(__dirname, '..', 'dist', 'src', 'index.js'),
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

test('baseline stays seed with only a small window series', () => {
  const snapshot = buildEmergenceBaselineSnapshot([
    {
      windowId: 'a',
      timestampMs: 1,
      readiness: 'forming',
      markerLevels: { continuity: 'partial' },
    },
    {
      windowId: 'b',
      timestampMs: 2,
      readiness: 'forming',
      markerLevels: { continuity: 'partial' },
    },
  ]);

  assert.equal(snapshot.baselineStatus, 'seed');
  assert.equal(snapshot.continuityTrend, 'forming');
});

test('baseline becomes forming with longer stable windows', () => {
  const snapshot = buildEmergenceBaselineSnapshot([
    { windowId: 'a', timestampMs: 1, readiness: 'forming', markerLevels: { continuity: 'partial' } },
    { windowId: 'b', timestampMs: 2, readiness: 'forming', markerLevels: { continuity: 'partial' } },
    { windowId: 'c', timestampMs: 3, readiness: 'observable', markerLevels: { continuity: 'present' } },
  ]);

  assert.equal(snapshot.baselineStatus, 'forming');
  assert.equal(snapshot.readinessTrend, 'improving');
});
