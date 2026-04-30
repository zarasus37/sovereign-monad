const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { buildExecutionTruthSnapshot, loadLocalExecutionTruthSnapshot } = require(
  path.resolve(__dirname, '..', 'dist', 'index.js'),
);

test('buildExecutionTruthSnapshot blocks when live proof and bootstrap registration are missing', () => {
  const snapshot = buildExecutionTruthSnapshot(
    {
      runtimeArtifactReady: true,
      providerStabilityImplemented: true,
      guardedLiveProfileDefined: true,
      guardedLiveActivationDocumented: true,
      operatorRunbookDefined: true,
      proofRecord: {
        phase1aLiveProofRecorded: false,
        bootstrapSourceRegistered: false,
        observedGuardedLiveSession: false,
        receiptTruthValidated: false,
        incidentQueueClear: false,
        notes: [],
      },
    },
    {
      requirePhase1aLiveProof: true,
      requireBootstrapSourceRegistration: true,
      requireGuardedLiveProfile: true,
      requireGuardedLiveActivationDoc: true,
      requireOperatorRunbook: true,
      requireRuntimeArtifact: true,
      requireProviderStabilityImplementation: true,
      requireObservedGuardedLiveSession: true,
      requireReceiptTruthValidation: true,
      requireIncidentQueueClear: true,
    },
  );

  assert.equal(snapshot.status, 'blocked');
  assert.ok(snapshot.blockers.includes('live Phase 1a deployment proof is not recorded'));
  assert.ok(snapshot.blockers.includes('bootstrap approved-source registration is not recorded'));
});

test('buildExecutionTruthSnapshot closes only when live execution proof exists', () => {
  const snapshot = buildExecutionTruthSnapshot(
    {
      runtimeArtifactReady: true,
      providerStabilityImplemented: true,
      guardedLiveProfileDefined: true,
      guardedLiveActivationDocumented: true,
      operatorRunbookDefined: true,
      proofRecord: {
        phase1aLiveProofRecorded: true,
        bootstrapSourceRegistered: true,
        observedGuardedLiveSession: true,
        receiptTruthValidated: true,
        incidentQueueClear: true,
        notes: [],
      },
    },
    {
      requirePhase1aLiveProof: true,
      requireBootstrapSourceRegistration: true,
      requireGuardedLiveProfile: true,
      requireGuardedLiveActivationDoc: true,
      requireOperatorRunbook: true,
      requireRuntimeArtifact: true,
      requireProviderStabilityImplementation: true,
      requireObservedGuardedLiveSession: true,
      requireReceiptTruthValidation: true,
      requireIncidentQueueClear: true,
    },
  );

  assert.equal(snapshot.status, 'closed');
  assert.equal(snapshot.blockers.length, 0);
});

test('loadLocalExecutionTruthSnapshot reflects the current local staged state', () => {
  const snapshot = loadLocalExecutionTruthSnapshot(path.resolve(__dirname, '..', '..'));
  assert.equal(snapshot.implemented, true);
  assert.equal(snapshot.phase1aLiveProofRecorded, true);
  assert.equal(snapshot.bootstrapSourceRegistered, true);
  assert.equal(snapshot.status, 'staged');
});
