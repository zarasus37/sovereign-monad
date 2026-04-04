const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { deriveExpansionCapabilities, evaluateExpansionRequest } = require(
  path.resolve(__dirname, '..', 'dist', 'src', 'evaluator.js'),
);

test('deriveExpansionCapabilities sees the local platform surfaces', () => {
  const capabilities = deriveExpansionCapabilities(path.resolve(__dirname, '..'));
  assert.equal(capabilities.state_api, true);
  assert.equal(capabilities.dashboard, true);
  assert.equal(capabilities.gnosis, true);
});

test('evaluateExpansionRequest allows internal local expansion under stressed posture when it stays bounded', () => {
  const decision = evaluateExpansionRequest(
    {
      id: 'internal-only',
      title: 'Internal Surface',
      category: 'internal_surface',
      localOnly: true,
      outwardFacing: false,
      touchesCapital: false,
      requiredCapabilities: ['state_api', 'dashboard'],
    },
    {
      localAnalysisOnly: true,
      deploymentBlockedByCapital: true,
      commercializationPosture: 'pilot_ready',
      integrityStatus: 'contain',
      escalationTier: 'tier2',
    },
    {
      state_api: true,
      dashboard: true,
      organ_runtime: true,
      signal_layer: true,
      oracle: true,
      gnosis: true,
      boundary_stress: true,
    },
  );

  assert.equal(decision.approved, true);
  assert.equal(decision.mode, 'allow');
});

test('evaluateExpansionRequest blocks outward and capital-facing work when posture is not healthy', () => {
  const decision = evaluateExpansionRequest(
    {
      id: 'buyer-surface',
      title: 'Buyer Surface',
      category: 'buyer_surface',
      localOnly: false,
      outwardFacing: true,
      touchesCapital: true,
      requiredCapabilities: ['state_api', 'dashboard', 'oracle', 'gnosis'],
    },
    {
      localAnalysisOnly: true,
      deploymentBlockedByCapital: true,
      commercializationPosture: 'internal_only',
      integrityStatus: 'contain',
      escalationTier: 'tier2',
    },
    {
      state_api: true,
      dashboard: true,
      organ_runtime: true,
      signal_layer: true,
      oracle: true,
      gnosis: true,
      boundary_stress: true,
    },
  );

  assert.equal(decision.approved, false);
  assert.equal(decision.mode, 'block');
  assert.ok(decision.reasons.includes('capital expansion remains blocked by current deployment posture'));
  assert.ok(decision.reasons.includes('current environment is local-analysis-only'));
  assert.ok(decision.reasons.includes('integrity status is contain'));
});
