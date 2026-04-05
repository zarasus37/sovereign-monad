const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const { buildAgentNftSnapshot } = require(path.resolve(__dirname, '..', 'dist', 'src', 'nfts.js'));

test('buildAgentNftSnapshot defines the six-organ collection while keeping minting blocked', () => {
  const snapshot = buildAgentNftSnapshot({
    collectionName: 'Test',
    networkLive: false,
    tokens: [
      { tokenId: 'a', organ: 'Cardia', role: 'organ_identity', metadataStatus: 'defined', transferability: 'non_transferable', delegateCapable: false },
      { tokenId: 'b', organ: 'Pneuma', role: 'organ_identity', metadataStatus: 'defined', transferability: 'non_transferable', delegateCapable: true },
    ],
  });

  assert.equal(snapshot.collectionDefined, true);
  assert.equal(snapshot.mintLive, false);
  assert.equal(snapshot.readyCount, 2);
});
