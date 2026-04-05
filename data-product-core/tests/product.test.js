const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { buildDataProductSnapshot } = require(path.resolve(__dirname, '..', 'dist', 'src', 'product.js'));

test('private bundles remain available while public bundles stay blocked before activation', () => {
  const snapshot = buildDataProductSnapshot(
    {
      governance: { externalizationAllowed: true },
      rightsReview: { openCaseCount: 0, blockedCount: 0 },
      readiness: { status: 'ready' },
      activationDecision: {
        status: 'review',
        explicitDecisionPresent: false,
        recommendedScope: 'limited_private',
        activationAllowed: false,
      },
    },
    [
      { id: 'private', audience: 'operators', requiresExplicitActivation: false, rightsClass: 'internal_only', recommendedScope: 'limited_private' },
      { id: 'public', audience: 'public', requiresExplicitActivation: true, rightsClass: 'external_sensitive', recommendedScope: 'public' },
    ],
  );

  assert.equal(snapshot.productizationStatus, 'prepared');
  assert.equal(snapshot.availableBundles.length, 1);
  assert.equal(snapshot.blockedBundles.length, 1);
});
