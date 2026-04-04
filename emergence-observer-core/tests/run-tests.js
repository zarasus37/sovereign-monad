const assert = require('node:assert/strict');
const path = require('node:path');

const { buildEmergenceObservationSnapshot } = require(
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

test('emergence snapshot stays observational and forming under seed-stage evidence', () => {
  const snapshot = buildEmergenceObservationSnapshot({
    runtime: {
      organCount: 6,
      orchestrationPhaseCount: 3,
      mandateSequenceCount: 4,
      participationActorCount: 3,
    },
    signal: {
      normalizedCount: 5,
      interpretationCount: 5,
    },
    oracle: {
      deploymentPosture: 'bounded',
      commercializationPosture: 'pilot_ready',
    },
    gnosis: {
      integrityStatus: 'review',
      hollowConvergenceRisk: 'elevated',
    },
    dataRail: {
      normalizedCount: 4,
      rewardEligibleCount: 2,
    },
    governance: {
      thresholdsDefined: true,
      thresholdsMet: false,
      externalizationAllowed: false,
    },
  });

  assert.equal(snapshot.observationOnly, true);
  assert.equal(snapshot.emergenceClaimed, false);
  assert.equal(snapshot.readiness, 'forming');
  assert.ok(snapshot.blockedBy.some((reason) => reason.includes('diversity thresholds are not met')));
});

test('emergence snapshot becomes observable only with stronger continuity and cleaner integrity', () => {
  const snapshot = buildEmergenceObservationSnapshot({
    runtime: {
      organCount: 6,
      orchestrationPhaseCount: 4,
      mandateSequenceCount: 5,
      participationActorCount: 6,
    },
    signal: {
      normalizedCount: 8,
      interpretationCount: 6,
    },
    oracle: {
      deploymentPosture: 'bounded',
      commercializationPosture: 'pilot_ready',
    },
    gnosis: {
      integrityStatus: 'clear',
      hollowConvergenceRisk: 'low',
    },
    dataRail: {
      normalizedCount: 12,
      rewardEligibleCount: 5,
    },
    governance: {
      thresholdsDefined: true,
      thresholdsMet: true,
      externalizationAllowed: true,
    },
  });

  assert.equal(snapshot.readiness, 'observable');
  assert.equal(snapshot.blockedBy.length, 0);
});
