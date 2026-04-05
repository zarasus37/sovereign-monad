const assert = require('node:assert/strict');
const path = require('node:path');

const { buildActivationDecisionSnapshot } = require(
  path.resolve(__dirname, '..', 'dist', 'index.js'),
);

function test(name, fn) {
  try {
    fn();
    process.stdout.write(`ok - ${name}\n`);
  } catch (error) {
    process.stderr.write(`not ok - ${name}\n`);
    throw error;
  }
}

const basePolicy = {
  schemaVersion: '1.0.0',
  minimumWindowCountForReview: 5,
  minimumWindowCountForActivation: 8,
  requireExplicitDecisionRecord: true,
  allowPublicActivationWithoutStableBaseline: false,
};

const eligibleInput = {
  governance: { externalizationAllowed: true },
  externalizationReadiness: { status: 'ready' },
  rightsReview: { openCaseCount: 0 },
  emergenceObservation: { readiness: 'observable' },
  emergenceBaseline: { windowCount: 5, baselineStatus: 'forming' },
  emergenceAccumulation: { status: 'review_ready', remainingWindowCount: 3 },
};

test('activation decision stays in review without an explicit decision record', () => {
  const snapshot = buildActivationDecisionSnapshot(eligibleInput, basePolicy, {
    schemaVersion: '1.0.0',
    present: false,
    approved: false,
    scope: 'none',
    recordedBy: null,
    recordedAtMs: null,
    notes: '',
  });

  assert.equal(snapshot.structurallyEligible, true);
  assert.equal(snapshot.status, 'review');
  assert.equal(snapshot.activationAllowed, false);
});

test('activation decision defers approved activation until the baseline target is met', () => {
  const snapshot = buildActivationDecisionSnapshot(eligibleInput, basePolicy, {
    schemaVersion: '1.0.0',
    present: true,
    approved: true,
    scope: 'public',
    recordedBy: 'operator',
    recordedAtMs: 1710000000000,
    notes: 'approved pending more windows',
  });

  assert.equal(snapshot.status, 'defer');
  assert.equal(snapshot.recommendedScope, 'limited_private');
  assert.equal(snapshot.activationAllowed, false);
});

test('activation decision activates once decision and accumulation targets are both met', () => {
  const snapshot = buildActivationDecisionSnapshot(
    {
      ...eligibleInput,
      emergenceBaseline: { windowCount: 8, baselineStatus: 'stable' },
      emergenceAccumulation: { status: 'target_met', remainingWindowCount: 0 },
    },
    basePolicy,
    {
      schemaVersion: '1.0.0',
      present: true,
      approved: true,
      scope: 'limited_private',
      recordedBy: 'operator',
      recordedAtMs: 1710000000000,
      notes: 'approved',
    },
  );

  assert.equal(snapshot.status, 'activate');
  assert.equal(snapshot.activationAllowed, true);
  assert.equal(snapshot.recommendedScope, 'limited_private');
});
