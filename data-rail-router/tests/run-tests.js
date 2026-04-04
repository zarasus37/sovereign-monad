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
      actorClass: 'ecosystem_native',
      surface: 'organ_runtime',
      outcome: 'accepted',
      attributable: true,
      containsSensitivePayload: false,
      rewardEligible: true,
      blockedReasons: [],
      tags: ['signal'],
    },
    { internalOnly: true, diversityThresholdsDefined: true, externalizationAllowed: false },
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
      actorClass: 'user_linked',
      surface: 'keys',
      outcome: 'contained',
      attributable: true,
      containsSensitivePayload: true,
      rewardEligible: false,
      blockedReasons: ['event contains sensitive payload'],
      tags: ['identity', 'sensitive'],
    },
    { internalOnly: true, diversityThresholdsDefined: true, externalizationAllowed: false },
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
        actorClass: 'ecosystem_native',
        surface: 'organ_runtime',
        outcome: 'accepted',
        attributable: true,
        containsSensitivePayload: false,
        rewardEligible: true,
        blockedReasons: [],
        tags: ['signal'],
      },
    ],
    { internalOnly: true, diversityThresholdsDefined: true, externalizationAllowed: false },
  );

  assert.equal(snapshot.routeCount, 1);
  assert.equal(snapshot.externalProductizationBlocked, true);
  assert.equal(snapshot.thresholdsDefined, true);
  assert.equal(snapshot.externalizationAllowed, false);
}

testEligibleEventRoutesInternally();
testBlockedEventFallsIntoReviewPaths();
testRoutingSnapshotCountsRoutes();
console.log('data-rail-router tests passed');
