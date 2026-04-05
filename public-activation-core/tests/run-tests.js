const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { buildPublicActivationSnapshot, loadLocalPublicActivationSnapshot } = require(
  path.resolve(__dirname, '..', 'dist', 'index.js'),
);

const policy = {
  requireExecutionTruthStatus: 'closed',
  requireCardiaStatus: 'ready_for_guarded_live',
  allowPrivateLicensedBeforePublic: true,
  requireLicensedDeploymentDoc: true,
  requireGuardedLiveActivationDoc: true,
  requireOperatorRunbook: true,
  requireDataProductPrepared: true,
  requireNarrativeSurface: true,
};

test('buildPublicActivationSnapshot blocks until execution truth and Cardia are ready', () => {
  const snapshot = buildPublicActivationSnapshot(
    {
      phase1aLiveProofRecorded: false,
      executionTruthStatus: 'blocked',
      cardiaActivationStatus: 'blocked',
      dataProductStatus: 'prepared',
      narrativeStatus: 'bounded_review',
      licensedDeploymentDoc: true,
      guardedLiveActivationDoc: true,
      operatorRunbookDoc: true,
      record: {
        productionInfraConfigured: false,
        licensedPrivatePathValidated: false,
        operatorMonitoringReady: false,
        publicSurfaceReady: false,
        activationApproved: false,
        publicActivationLive: false,
        notes: [],
      },
    },
    policy,
  );

  assert.equal(snapshot.status, 'blocked');
  assert.ok(snapshot.blockers.includes('live Phase 1a deployment proof is not recorded'));
});

test('buildPublicActivationSnapshot reaches public_review once private readiness is clear', () => {
  const snapshot = buildPublicActivationSnapshot(
    {
      phase1aLiveProofRecorded: true,
      executionTruthStatus: 'closed',
      cardiaActivationStatus: 'ready_for_guarded_live',
      dataProductStatus: 'prepared',
      narrativeStatus: 'bounded_review',
      licensedDeploymentDoc: true,
      guardedLiveActivationDoc: true,
      operatorRunbookDoc: true,
      record: {
        productionInfraConfigured: true,
        licensedPrivatePathValidated: true,
        operatorMonitoringReady: true,
        publicSurfaceReady: false,
        activationApproved: false,
        publicActivationLive: false,
        notes: [],
      },
    },
    policy,
  );

  assert.equal(snapshot.status, 'public_review');
});

test('loadLocalPublicActivationSnapshot reflects the current blocked local posture', () => {
  const snapshot = loadLocalPublicActivationSnapshot(path.resolve(__dirname, '..', '..'));
  assert.equal(snapshot.implemented, true);
  assert.equal(snapshot.status, 'blocked');
  assert.equal(snapshot.publicActivationLive, false);
});
