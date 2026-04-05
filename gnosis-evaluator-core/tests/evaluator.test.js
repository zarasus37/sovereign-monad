const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { buildGnosisEvaluationSnapshot } = require(path.resolve(__dirname, '..', 'dist', 'evaluator.js'));

test('capital-gated organs score lower while bounded-ready organs stay clear', () => {
  const snapshot = buildGnosisEvaluationSnapshot({
    organs: [
      { name: 'Synapse', zeroCapitalReady: true, capitalRequired: false, blockedReasons: [] },
      { name: 'Cardia', zeroCapitalReady: false, capitalRequired: true, blockedReasons: ['capital gated'] },
    ],
    gnosis: { integrityStatus: 'clear' },
    oracle: { deploymentPosture: 'bounded' },
    boundaryStress: { escalationTier: 'tier0' },
  });

  assert.equal(snapshot.organScores.length, 2);
  assert.ok(snapshot.organScores.find((item) => item.organ === 'Cardia').score < snapshot.organScores.find((item) => item.organ === 'Synapse').score);
});
