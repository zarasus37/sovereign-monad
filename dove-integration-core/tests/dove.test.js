const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { buildDoveIntegrationSnapshot } = require(path.resolve(__dirname, '..', 'dist', 'dove.js'));

test('elevated stress or containment integrity moves Dove into containment posture', () => {
  const snapshot = buildDoveIntegrationSnapshot({
    signal: { interpretations: [{ label: 'boundary_tension', level: 'elevated' }] },
    oracle: { regime: 'balanced', deploymentPosture: 'bounded' },
    gnosis: { integrityStatus: 'contain', hollowConvergenceRisk: 'elevated', boundaryStress: 'elevated' },
    boundaryStress: { escalationTier: 'tier2', pauseSuggested: true },
  });

  assert.equal(snapshot.driftStatus, 'contain');
  assert.ok(snapshot.recommendedActions.some((item) => item.includes('containment')));
});
