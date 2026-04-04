const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { buildBuilderPlan, evaluateRecipe } = require(
  path.resolve(__dirname, '..', 'dist', 'src', 'planner.js'),
);

test('buildBuilderPlan marks internal recipes ready when local platform capabilities exist', () => {
  const plan = buildBuilderPlan(path.resolve(__dirname, '..'), {
    localAnalysisOnly: true,
    implementedSurfaces: [
      'organ-runtime',
      'signal-layer',
      'oracle-core',
      'gnosis-core',
      'boundary-stress-monitor',
    ],
    deploymentBlockedByCapital: true,
    commercializationPosture: 'pilot_ready',
    integrityStatus: 'contain',
    escalationTier: 'tier2',
  });

  assert.equal(plan.implemented, true);
  assert.equal(plan.capabilityMap.state_api, true);
  assert.equal(plan.capabilityMap.dashboard, true);
  assert.ok(plan.readyCount >= 2);
});

test('evaluateRecipe blocks outward-facing recipes when integrity and escalation posture are not clear', () => {
  const decision = evaluateRecipe(
    {
      id: 'buyer-facing',
      title: 'Buyer-Facing',
      description: 'Test outward surface',
      stage: 'outward_expansion',
      requiredCapabilities: ['state_api', 'dashboard', 'oracle', 'gnosis'],
      outwardFacing: true,
      touchesCapital: false,
    },
    {
      state_api: true,
      dashboard: true,
      oracle: true,
      gnosis: true,
      signal_layer: true,
      boundary_stress: true,
      organ_runtime: true,
    },
    {
      localAnalysisOnly: true,
      implementedSurfaces: [],
      deploymentBlockedByCapital: true,
      commercializationPosture: 'internal_only',
      integrityStatus: 'contain',
      escalationTier: 'tier2',
    },
  );

  assert.equal(decision.ready, false);
  assert.ok(decision.reasons.includes('current stack is local-analysis-only'));
  assert.ok(decision.reasons.includes('integrity status is contain'));
  assert.ok(decision.reasons.includes('escalation tier is tier2'));
});
