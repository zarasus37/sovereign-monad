const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { buildNarrativeSnapshot } = require(path.resolve(__dirname, '..', 'dist', 'narrative.js'));

test('buildNarrativeSnapshot keeps the public surface bounded until activation is explicit', () => {
  const snapshot = buildNarrativeSnapshot({
    organRuntime: { readyOrgans: ['Synapse', 'Hepar'], capitalGatedOrgans: ['Cardia'] },
    oracle: { regime: 'balanced', deploymentPosture: 'bounded', commercializationPosture: 'pilot_ready' },
    gnosis: { integrityStatus: 'clear' },
    governance: { externalizationAllowed: true },
    activationDecision: { status: 'review', recommendedScope: 'limited_private', explicitDecisionPresent: false },
  });

  assert.equal(snapshot.deploymentLive, false);
  assert.equal(snapshot.publicSurfaceStatus, 'bounded_review');
  assert.ok(snapshot.blockers.some((item) => item.includes('explicit')));
});
