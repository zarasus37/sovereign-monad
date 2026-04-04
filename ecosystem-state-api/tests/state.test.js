const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { buildEcosystemStateFromRuntimeConfig } = require(
  path.resolve(__dirname, '..', 'dist', 'state.js'),
);

test('buildEcosystemStateFromRuntimeConfig composes the zero-capital stack into one summary', () => {
  const runtimeConfig = {
    runtimeMode: 'analysis',
    synapse: { sampleSignals: [] },
  };

  const snapshot = buildEcosystemStateFromRuntimeConfig(
    runtimeConfig,
    {
      buildRuntimeSnapshot: () => ({
        runtimeMode: 'analysis',
        zeroCapitalBuildQueue: ['Synapse', 'Hepar', 'Cortex', 'Vox', 'Pneuma'],
        capitalGatedQueue: ['Cardia'],
        participation: {
          actorCount: 3,
          decisions: [
            { allowedSurface: 'ecosystem_native_runtime', blockedReasons: [] },
            { allowedSurface: 'delegated_agent_surface', blockedReasons: [] },
            { allowedSurface: 'operator_review_surface', blockedReasons: ['cannot_bypass_boundary'] },
          ],
        },
        mandate: {
          title: 'Bounded research-to-exchange internal loop',
          gateChecks: ['gate-a', 'gate-b'],
        },
        cardia: {
          deploymentMode: 'analysis_only',
        },
      }),
      buildSignalLayerSnapshot: () => ({
        aggregate: {
          byDomain: {
            capital: 1,
            research: 1,
            exchange: 1,
            integrity: 1,
            operations: 0,
            narrative: 0,
          },
        },
        interpretations: [
          { label: 'coordination_pressure', level: 'elevated' },
          { label: 'boundary_tension', level: 'elevated' },
          { label: 'exchange_readiness', level: 'elevated' },
          { label: 'capital_attention', level: 'elevated' },
          { label: 'operator_load', level: 'stable' },
        ],
      }),
      buildOracleSnapshot: () => ({
        deploymentPosture: 'bounded',
        commercializationPosture: 'pilot_ready',
        regime: 'balanced',
      }),
      buildGnosisSnapshot: () => ({
        integrityStatus: 'contain',
        hollowConvergenceRisk: 'elevated',
        boundaryStress: 'elevated',
      }),
      buildBoundaryStressSnapshot: () => ({
        escalationTier: 'tier2',
      }),
    },
    'C:\\runtime.json',
    1710000000000,
  );

  assert.equal(snapshot.implemented, true);
  assert.equal(snapshot.localAnalysisOnly, true);
  assert.equal(snapshot.summary.runtimeMode, 'analysis');
  assert.equal(snapshot.summary.deploymentBlockedByCapital, true);
  assert.equal(snapshot.summary.deploymentPosture, 'bounded');
  assert.equal(snapshot.summary.integrityStatus, 'contain');
  assert.deepEqual(snapshot.summary.capitalGatedOrgans, ['Cardia']);
});

test('buildEcosystemStateFromRuntimeConfig treats bounded-ready cardia as not blocked by capital queue when absent', () => {
  const snapshot = buildEcosystemStateFromRuntimeConfig(
    { runtimeMode: 'analysis', synapse: { sampleSignals: [] } },
    {
      buildRuntimeSnapshot: () => ({
        runtimeMode: 'analysis',
        zeroCapitalBuildQueue: ['Synapse'],
        capitalGatedQueue: [],
        participation: { actorCount: 0, decisions: [] },
        mandate: { title: 'Loop', gateChecks: [] },
        cardia: { deploymentMode: 'bounded_ready' },
      }),
      buildSignalLayerSnapshot: () => ({
        aggregate: {
          byDomain: {
            capital: 0,
            research: 0,
            exchange: 0,
            integrity: 0,
            operations: 0,
            narrative: 0,
          },
        },
        interpretations: [],
      }),
      buildOracleSnapshot: () => ({
        deploymentPosture: 'bounded',
        commercializationPosture: 'internal_only',
        regime: 'balanced',
      }),
      buildGnosisSnapshot: () => ({
        integrityStatus: 'clear',
        hollowConvergenceRisk: 'low',
        boundaryStress: 'stable',
      }),
      buildBoundaryStressSnapshot: () => ({
        escalationTier: 'tier0',
      }),
    },
    'C:\\runtime.json',
    1710000000001,
  );

  assert.equal(snapshot.summary.deploymentBlockedByCapital, false);
  assert.equal(snapshot.summary.escalationTier, 'tier0');
});
