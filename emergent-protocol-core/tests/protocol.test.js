const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { buildEmergentProtocolSnapshot } = require(path.resolve(__dirname, '..', 'dist', 'src', 'protocol.js'));

test('review-ready accumulation yields candidate protocol paths without claiming formal activation', () => {
  const snapshot = buildEmergentProtocolSnapshot(
    {
      observation: { readiness: 'observable', evidenceWindow: 'forming' },
      baseline: { baselineStatus: 'stable', windowCount: 5, readinessTrend: 'improving' },
      accumulation: { status: 'review_ready', currentWindowCount: 5, remainingWindowCount: 3 },
      gnosis: { integrityStatus: 'clear' },
      oracle: { regime: 'balanced' },
    },
    [
      {
        id: 'pattern-a',
        minimumReadiness: 'forming',
        minimumAccumulation: 'review_ready',
        requiresIntegrity: 'clear',
        downstreamPath: 'protocol_candidate_review',
      },
      {
        id: 'pattern-b',
        minimumReadiness: 'observable',
        minimumAccumulation: 'target_met',
        requiresIntegrity: 'clear',
        downstreamPath: 'formal_protocol_spec',
      },
    ],
  );

  assert.equal(snapshot.validationStatus, 'review_ready');
  assert.equal(snapshot.validatedPatternCount, 1);
  assert.ok(snapshot.downstreamPath.includes('protocol_candidate_review'));
});
