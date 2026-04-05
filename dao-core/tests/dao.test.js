const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { buildDaoSnapshot } = require(path.resolve(__dirname, '..', 'dist', 'src', 'dao.js'));

test('accepts bounded local proposals that stay inside local governance rules', () => {
  const snapshot = buildDaoSnapshot(
    {
      schemaVersion: '1.0.0',
      charterVersion: 'test',
      minimumSponsorCount: 1,
      requiredSponsorClasses: ['ecosystem_native'],
      handoffRequiresDelegateAgent: true,
      capitalProposalsRemainDeferred: true,
      onchainProposalsRemainDeferred: true,
    },
    [
      {
        id: 'prop-1',
        title: 'Local review lane',
        summary: 'bounded',
        sponsorClasses: ['ecosystem_native'],
        delegateAgentPresent: true,
        affectsCapital: false,
        touchesOnchain: false,
        alignmentNotes: ['bounded'],
      },
    ],
  );

  assert.equal(snapshot.acceptedCount, 1);
  assert.equal(snapshot.deferredCount, 0);
});

test('defers capital and onchain proposals into the capital-gated lane', () => {
  const snapshot = buildDaoSnapshot(
    {
      schemaVersion: '1.0.0',
      charterVersion: 'test',
      minimumSponsorCount: 1,
      requiredSponsorClasses: ['ecosystem_native'],
      handoffRequiresDelegateAgent: true,
      capitalProposalsRemainDeferred: true,
      onchainProposalsRemainDeferred: true,
    },
    [
      {
        id: 'prop-2',
        title: 'Treasury spend',
        summary: 'funded',
        sponsorClasses: ['ecosystem_native'],
        delegateAgentPresent: true,
        affectsCapital: true,
        touchesOnchain: true,
        alignmentNotes: ['funded'],
      },
    ],
  );

  assert.equal(snapshot.deferredCount, 1);
  assert.equal(snapshot.decisions[0].allowedExecutionSurface, 'capital_gated');
});
