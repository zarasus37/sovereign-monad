const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { buildKeyLayerSnapshot, evaluateKeyRequest } = require(
  path.resolve(__dirname, '..', 'dist', 'src', 'evaluator.js'),
);

test('ecosystem-native requests are allowed inside the local key scaffold', () => {
  const decision = evaluateKeyRequest({
    id: 'native',
    subjectId: 'native-synapse',
    activationClass: 'ecosystem_native',
    requestedScopes: ['runtime.observe', 'signal.route', 'builder.compose'],
    nftRequired: false,
    delegateAgentPresent: false,
  });

  assert.equal(decision.approved, true);
  assert.equal(decision.activationMode, 'local_scaffold');
  assert.equal(decision.blockedScopes.length, 0);
});

test('delegated-human requests require a delegate agent and stay out of capital scopes', () => {
  const decision = evaluateKeyRequest({
    id: 'delegated',
    subjectId: 'delegated-user',
    activationClass: 'delegated_human',
    requestedScopes: ['dashboard.view', 'capital.touch'],
    nftRequired: false,
    delegateAgentPresent: false,
  });

  assert.equal(decision.approved, false);
  assert.equal(decision.activationMode, 'blocked');
  assert.ok(decision.blockedScopes.some((item) => item.scope === 'capital.touch'));
});

test('key layer snapshot keeps NFT-dependent requests blocked', () => {
  const snapshot = buildKeyLayerSnapshot([
    {
      id: 'future-nft',
      subjectId: 'future-buyer',
      activationClass: 'user_linked',
      requestedScopes: ['keys.activate'],
      nftRequired: true,
      delegateAgentPresent: false,
    },
  ]);

  assert.equal(snapshot.nftInfrastructureLive, false);
  assert.equal(snapshot.approvedCount, 0);
  assert.equal(snapshot.decisions[0].activationMode, 'blocked');
});
