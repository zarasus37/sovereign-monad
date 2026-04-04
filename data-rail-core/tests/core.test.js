const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const {
  buildDataRailSnapshot,
  buildRewardPreview,
  normalizeBehaviorEvent,
} = require(path.resolve(__dirname, '..', 'dist', 'src', 'core.js'));

test('normalizeBehaviorEvent blocks sensitive payloads from reward eligibility', () => {
  const event = normalizeBehaviorEvent({
    id: 'sensitive',
    timestampMs: 1,
    actorId: 'future-buyer',
    actorClass: 'user_linked',
    surface: 'platform',
    action: 'submit_identity_payload',
    outcome: 'published',
    attributable: true,
    containsSensitivePayload: true,
    contributionScore: 90,
    tags: [],
  });

  assert.equal(event.rewardEligible, false);
  assert.ok(event.blockedReasons.includes('event contains sensitive payload'));
});

test('buildRewardPreview marks attributable accepted events as reward-eligible while remaining internal-only', () => {
  const event = normalizeBehaviorEvent({
    id: 'native',
    timestampMs: 1,
    actorId: 'native-synapse',
    actorClass: 'ecosystem_native',
    surface: 'organ_runtime',
    action: 'route_signal',
    outcome: 'accepted',
    attributable: true,
    containsSensitivePayload: false,
    contributionScore: 82,
    tags: [],
  });

  const preview = buildRewardPreview(event);
  assert.equal(preview.rewardEligible, true);
  assert.equal(preview.rewardBand, 'acknowledge');
  assert.ok(
    preview.reasons.includes(
      'Data Rail remains internal-only until diversity thresholds are met and rights gates are satisfied',
    ),
  );
});

test('buildDataRailSnapshot stays internal-only while diversity thresholds are governed externally', () => {
  const snapshot = buildDataRailSnapshot([
    {
      id: 'evt',
      timestampMs: 1,
      actorId: 'native-vox',
      actorClass: 'ecosystem_native',
      surface: 'platform',
      action: 'package_narrative',
      outcome: 'published',
      attributable: true,
      containsSensitivePayload: false,
      contributionScore: 77,
      tags: [],
    },
  ]);

  assert.equal(snapshot.internalOnly, true);
  assert.equal(snapshot.diversityThresholdsDefined, true);
  assert.equal(snapshot.rewardEligibleCount, 1);
});
