const assert = require('node:assert/strict');
const path = require('node:path');

const {
  buildGovernanceSnapshot,
  evaluateExternalizationDecision,
} = require(path.resolve(__dirname, '..', 'dist', 'src', 'index.js'));

const sampleEvents = [
  {
    id: 'evt-1',
    actorId: 'native-synapse',
    actorClass: 'ecosystem_native',
    surface: 'organ_runtime',
    outcome: 'accepted',
    attributable: true,
    containsSensitivePayload: false,
    contributionScore: 80,
    rewardEligible: true,
    blockedReasons: [],
    tags: ['signal'],
  },
  {
    id: 'evt-2',
    actorId: 'native-vox',
    actorClass: 'ecosystem_native',
    surface: 'platform',
    outcome: 'published',
    attributable: true,
    containsSensitivePayload: false,
    contributionScore: 85,
    rewardEligible: true,
    blockedReasons: [],
    tags: ['distribution'],
  },
  {
    id: 'evt-3',
    actorId: 'delegated-research',
    actorClass: 'delegated_human',
    surface: 'signal_layer',
    outcome: 'qualified',
    attributable: true,
    containsSensitivePayload: false,
    contributionScore: 77,
    rewardEligible: true,
    blockedReasons: [],
    tags: ['research'],
  },
  {
    id: 'evt-4',
    actorId: 'operator-review',
    actorClass: 'operator_review',
    surface: 'keys',
    outcome: 'blocked',
    attributable: true,
    containsSensitivePayload: false,
    contributionScore: 10,
    rewardEligible: false,
    blockedReasons: ['not reward eligible'],
    tags: ['review'],
  },
];

function test(name, fn) {
  try {
    fn();
    process.stdout.write(`ok - ${name}\n`);
  } catch (error) {
    process.stderr.write(`not ok - ${name}\n`);
    throw error;
  }
}

test('governance snapshot keeps externalization blocked when thresholds are not met', () => {
  const snapshot = buildGovernanceSnapshot(sampleEvents);
  assert.equal(snapshot.thresholdsDefined, true);
  assert.equal(snapshot.thresholdsMet, false);
  assert.equal(snapshot.externalizationAllowed, false);
  assert.ok(snapshot.reasons.some((reason) => reason.includes('event count')));
});

test('externalization decision blocks operator review and review-tagged events', () => {
  const snapshot = buildGovernanceSnapshot(sampleEvents);
  const decision = evaluateExternalizationDecision(sampleEvents[3], snapshot);
  assert.equal(decision.allowed, false);
  assert.ok(
    decision.reasons.some((reason) => reason.includes('actor class operator_review')),
  );
  assert.ok(decision.reasons.some((reason) => reason.includes('blocked tags')));
});

test('externalization decision allows clean events once thresholds are met', () => {
  const eligibleEvents = [
    ...sampleEvents,
    {
      id: 'evt-5',
      actorId: 'delegated-producer',
      actorClass: 'delegated_human',
      surface: 'gnosis',
      outcome: 'accepted',
      attributable: true,
      containsSensitivePayload: false,
      contributionScore: 78,
      rewardEligible: true,
      blockedReasons: [],
      tags: ['integrity'],
    },
    {
      id: 'evt-6',
      actorId: 'native-hepar',
      actorClass: 'ecosystem_native',
      surface: 'oracle',
      outcome: 'accepted',
      attributable: true,
      containsSensitivePayload: false,
      contributionScore: 79,
      rewardEligible: true,
      blockedReasons: [],
      tags: ['capital'],
    },
    {
      id: 'evt-7',
      actorId: 'future-buyer',
      actorClass: 'user_linked',
      surface: 'platform',
      outcome: 'contained',
      attributable: true,
      containsSensitivePayload: false,
      contributionScore: 0,
      rewardEligible: false,
      blockedReasons: ['contained'],
      tags: ['intake'],
    },
    {
      id: 'evt-8',
      actorId: 'native-cortex',
      actorClass: 'ecosystem_native',
      surface: 'signal_layer',
      outcome: 'published',
      attributable: true,
      containsSensitivePayload: false,
      contributionScore: 88,
      rewardEligible: true,
      blockedReasons: [],
      tags: ['analysis'],
    },
  ];

  const snapshot = buildGovernanceSnapshot(eligibleEvents);
  assert.equal(snapshot.thresholdsMet, true);
  const decision = evaluateExternalizationDecision(eligibleEvents[0], snapshot);
  assert.equal(decision.allowed, true);
});
