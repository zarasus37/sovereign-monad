const assert = require('node:assert/strict');
const path = require('node:path');

const { buildLedgerEntry, buildRewardLedgerSnapshot } = require(
  path.resolve(__dirname, '..', 'dist', 'src', 'ledger.js'),
);

function testEligibleEntryCreation() {
  const entry = buildLedgerEntry({
    eventId: 'evt-1',
    actorId: 'native-vox',
    actorClass: 'ecosystem_native',
    contributionScore: 80,
    rewardEligible: true,
    rewardBand: 'acknowledge',
  });

  assert.ok(entry);
  assert.equal(entry.unit, 'internal_credit');
  assert.ok(entry.units > 0);
}

function testBlockedEntryCreation() {
  const entry = buildLedgerEntry({
    eventId: 'evt-2',
    actorId: 'future-buyer',
    actorClass: 'user_linked',
    contributionScore: 95,
    rewardEligible: false,
    rewardBand: 'none',
  });

  assert.equal(entry, null);
}

function testLedgerBalancesAggregate() {
  const snapshot = buildRewardLedgerSnapshot([
    {
      eventId: 'evt-1',
      actorId: 'native-vox',
      actorClass: 'ecosystem_native',
      contributionScore: 80,
      rewardEligible: true,
      rewardBand: 'acknowledge',
    },
    {
      eventId: 'evt-2',
      actorId: 'native-vox',
      actorClass: 'ecosystem_native',
      contributionScore: 70,
      rewardEligible: true,
      rewardBand: 'observe',
    },
  ]);

  assert.equal(snapshot.entryCount, 2);
  assert.equal(snapshot.balances.length, 1);
  assert.ok(snapshot.balances[0].units > 0);
}

testEligibleEntryCreation();
testBlockedEntryCreation();
testLedgerBalancesAggregate();
console.log('reward-ledger-core tests passed');
