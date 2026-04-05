const assert = require('node:assert/strict');
const path = require('node:path');

const { buildPopulationExpansionSnapshot } = require(
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

const target = {
  schemaVersion: '1.0.0',
  targetEventCount: 16,
  targetDistinctActors: 12,
  targetActorClasses: 4,
  targetSurfaceCount: 6,
  targetOutcomeCount: 6,
  maximumSingleActorShare: 0.25,
  focusWindows: ['capture gnosis', 'capture rejected'],
};

test('population expansion snapshot defines the next wave once the threshold floor is met', () => {
  const snapshot = buildPopulationExpansionSnapshot(
    {
      totalEvents: 9,
      distinctActors: 9,
      actorClassCount: 4,
      surfaceCount: 5,
      outcomeCount: 5,
      ecosystemNativeShare: 0.55,
      nonNativeShare: 0.45,
      largestActorShare: 0.111,
    },
    target,
    [
      { actorId: 'a', surface: 'organ_runtime', outcome: 'accepted' },
      { actorId: 'b', surface: 'signal_layer', outcome: 'published' },
      { actorId: 'c', surface: 'oracle', outcome: 'qualified' },
      { actorId: 'd', surface: 'platform', outcome: 'contained' },
      { actorId: 'e', surface: 'keys', outcome: 'blocked' },
    ],
  );

  assert.equal(snapshot.status, 'ready_to_expand');
  assert.equal(snapshot.remainingEventCount, 7);
  assert.equal(snapshot.remainingActorCount, 3);
  assert.ok(snapshot.nextWaveTargets.some((item) => item.includes('gnosis')));
  assert.ok(snapshot.nextWaveTargets.some((item) => item.includes('rejected')));
});

test('population expansion snapshot clears once the next-wave target is met', () => {
  const snapshot = buildPopulationExpansionSnapshot(
    {
      totalEvents: 16,
      distinctActors: 12,
      actorClassCount: 4,
      surfaceCount: 6,
      outcomeCount: 6,
      ecosystemNativeShare: 0.5,
      nonNativeShare: 0.5,
      largestActorShare: 0.2,
    },
    target,
    [
      { actorId: 'a', surface: 'organ_runtime', outcome: 'accepted' },
      { actorId: 'b', surface: 'signal_layer', outcome: 'published' },
      { actorId: 'c', surface: 'oracle', outcome: 'qualified' },
      { actorId: 'd', surface: 'platform', outcome: 'contained' },
      { actorId: 'e', surface: 'keys', outcome: 'blocked' },
      { actorId: 'f', surface: 'gnosis', outcome: 'rejected' },
    ],
  );

  assert.equal(snapshot.status, 'target_met');
  assert.equal(snapshot.gapCount, 0);
  assert.equal(snapshot.remainingEventCount, 0);
});
