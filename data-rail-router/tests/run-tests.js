const assert = require('node:assert/strict');
const path = require('node:path');

const { buildRoutingSnapshot, routeBehaviorEvent } = require(
  path.resolve(__dirname, '..', 'dist', 'src', 'router.js'),
);

function testEligibleEventRoutesInternally() {
  const decision = routeBehaviorEvent(
    {
      id: 'evt-1',
      actorId: 'native-synapse',
      surface: 'organ_runtime',
      outcome: 'accepted',
      rewardEligible: true,
      blockedReasons: [],
      tags: ['signal'],
    },
    { internalOnly: true, diversityThresholdsDefined: false },
  );

  assert.ok(decision.approvedDestinations.includes('internal_behavioral_archive'));
  assert.ok(decision.approvedDestinations.includes('oracle_memory'));
  assert.ok(decision.approvedDestinations.includes('internal_reward_ledger'));
  assert.ok(
    decision.blockedDestinations.some(
      (item) => item.destination === 'external_product_surface',
    ),
  );
}

function testBlockedEventFallsIntoReviewPaths() {
  const decision = routeBehaviorEvent(
    {
      id: 'evt-2',
      actorId: 'future-buyer',
      surface: 'keys',
      outcome: 'contained',
      rewardEligible: false,
      blockedReasons: ['event contains sensitive payload'],
      tags: ['identity', 'sensitive'],
    },
    { internalOnly: true, diversityThresholdsDefined: false },
  );

  assert.ok(decision.approvedDestinations.includes('gnosis_memory'));
  assert.ok(decision.approvedDestinations.includes('governance_review'));
  assert.ok(
    decision.blockedDestinations.some((item) => item.destination === 'internal_reward_ledger'),
  );
}

function testRoutingSnapshotCountsRoutes() {
  const snapshot = buildRoutingSnapshot(
    [
      {
        id: 'evt-1',
        actorId: 'native-synapse',
        surface: 'organ_runtime',
        outcome: 'accepted',
        rewardEligible: true,
        blockedReasons: [],
        tags: ['signal'],
      },
    ],
    { internalOnly: true, diversityThresholdsDefined: false },
  );

  assert.equal(snapshot.routeCount, 1);
  assert.equal(snapshot.externalProductizationBlocked, true);
}

testEligibleEventRoutesInternally();
testBlockedEventFallsIntoReviewPaths();
testRoutingSnapshotCountsRoutes();
console.log('data-rail-router tests passed');
