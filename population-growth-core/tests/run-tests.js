const assert = require('node:assert/strict');
const path = require('node:path');

const { buildPopulationGrowthSnapshot } = require(path.resolve(__dirname, '..', 'dist', 'index.js'));

function test(name, fn) {
  try {
    fn();
    process.stdout.write(`ok - ${name}\n`);
  } catch (error) {
    process.stderr.write(`not ok - ${name}\n`);
    throw error;
  }
}

test('population growth snapshot identifies sample deficits', () => {
  const snapshot = buildPopulationGrowthSnapshot(
    {
      totalEvents: 4,
      distinctActors: 4,
      actorClassCount: 3,
      surfaceCount: 3,
      outcomeCount: 4,
      ecosystemNativeShare: 0.5,
      nonNativeShare: 0.5,
      largestActorShare: 0.25,
    },
    {
      minimumEventCount: 8,
      minimumDistinctActors: 5,
      minimumActorClasses: 3,
      minimumSurfaces: 3,
      minimumOutcomes: 4,
      maximumSingleActorShare: 0.4,
      requireEcosystemNativeAndNonNativeMix: true,
    },
    [],
  );

  assert.equal(snapshot.thresholdsMet, false);
  assert.ok(snapshot.gaps.some((gap) => gap.dimension === 'event_count'));
  assert.ok(snapshot.gaps.some((gap) => gap.dimension === 'distinct_actors'));
});

test('population growth snapshot clears once thresholds are met', () => {
  const snapshot = buildPopulationGrowthSnapshot(
    {
      totalEvents: 10,
      distinctActors: 6,
      actorClassCount: 3,
      surfaceCount: 4,
      outcomeCount: 4,
      ecosystemNativeShare: 0.5,
      nonNativeShare: 0.5,
      largestActorShare: 0.3,
    },
    {
      minimumEventCount: 8,
      minimumDistinctActors: 5,
      minimumActorClasses: 3,
      minimumSurfaces: 3,
      minimumOutcomes: 4,
      maximumSingleActorShare: 0.4,
      requireEcosystemNativeAndNonNativeMix: true,
    },
    [],
  );

  assert.equal(snapshot.thresholdsMet, true);
  assert.equal(snapshot.gapCount, 0);
  assert.equal(snapshot.metrics.totalEvents, 10);
  assert.ok(snapshot.executedActions.some((item) => item.includes('10 attributable events')));
});
