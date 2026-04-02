const test = require('node:test');
const assert = require('node:assert/strict');

const {
  buildAdapterSwapLegs,
  buildAdapterSwapTransactions,
  buildExecutionPath,
  getRequiredInventory,
  supportsLiveExecution,
  validateExecutionPlan,
} = require('../dist/execution.js');
const { AdapterRegistry } = require('../dist/adapters/index.js');

function basePlan(overrides = {}) {
  return {
    meta: {
      eventId: 'evt-1',
      eventType: 'ExecutionPlan',
      version: 1,
      timestampMs: 1710000000000,
      source: 'portfolio-manager',
    },
    planId: 'plan-1',
    opportunityId: 'opp-1',
    sourceSignalId: 'signal-1',
    asset: 'ETH',
    direction: 'buy_M_sell_E',
    size: '1000',
    mode: 'inventory_based',
    entryVenue: 'aerodrome:ETH/USDC:spot',
    exitVenue: 'camelot:ETH/USDC:spot',
    entryPrice: 2500,
    exitPrice: 2510,
    spreadBps: 40,
    expectedEv: 20,
    approved: true,
    timeWindowMs: 10000,
    executionDeadlineMs: 1710000009000,
    timestampMs: 1710000000000,
    ...overrides,
  };
}

test('validateExecutionPlan rejects stale and expired plans', () => {
  assert.equal(
    validateExecutionPlan(basePlan(), 1710000040001, 30000).reason,
    'plan_stale'
  );

  assert.equal(
    validateExecutionPlan(basePlan({ executionDeadlineMs: 1710000001000 }), 1710000002000, 30000).reason,
    'execution_deadline_expired'
  );
});

test('supportsLiveExecution only allows ETH inventory plans on aerodrome/camelot', () => {
  assert.equal(supportsLiveExecution(basePlan()).valid, true);
  assert.equal(
    supportsLiveExecution(basePlan({ mode: 'bridge_based' })).reason,
    'bridge_mode_requires_bridge_executor'
  );
  assert.equal(
    supportsLiveExecution(basePlan({ entryVenue: 'unknown:ETH/USDC:spot' })).reason,
    'unsupported_venue_pair'
  );
});

test('getRequiredInventory computes inventory by direction', () => {
  const requirements = getRequiredInventory(basePlan());
  assert.deepEqual(requirements, [
    { chain: 'base', asset: 'USDC', amount: 1000 },
    { chain: 'arbitrum', asset: 'WETH', amount: 0.4 },
  ]);
});

test('buildExecutionPath reflects execution mode', () => {
  assert.equal(
    buildExecutionPath(basePlan(), 'base', 'arbitrum'),
    'base<->arbitrum:inventory'
  );
  assert.equal(
    buildExecutionPath(basePlan({ mode: 'bridge_based' }), 'base', 'arbitrum'),
    'base->arbitrum:bridge'
  );
});

test('buildAdapterSwapLegs prepares venue-specific swap legs', () => {
  const registry = new AdapterRegistry({
    aerodromeRouterAddress: '0x1111111111111111111111111111111111111111',
    aerodromeFactoryAddress: '0x3333333333333333333333333333333333333333',
    camelotRouterAddress: '0x2222222222222222222222222222222222222222',
    camelotReferrerAddress: '0x4444444444444444444444444444444444444444',
  });

  const result = buildAdapterSwapLegs(basePlan(), registry, 20);
  assert.equal(result.ok, true);
  assert.equal(result.legs.length, 2);
  assert.equal(result.legs[0].venue, 'aerodrome:ETH/USDC:spot');
  assert.equal(result.legs[0].side, 'buy');
  assert.equal(result.legs[1].venue, 'camelot:ETH/USDC:spot');
  assert.equal(result.legs[1].side, 'sell');
});

test('buildAdapterSwapLegs reports missing router configuration', () => {
  const registry = new AdapterRegistry({
    aerodromeRouterAddress: null,
    aerodromeFactoryAddress: '0x3333333333333333333333333333333333333333',
    camelotRouterAddress: '0x2222222222222222222222222222222222222222',
    camelotReferrerAddress: '0x4444444444444444444444444444444444444444',
  });

  const result = buildAdapterSwapLegs(basePlan(), registry, 20);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'missing_aerodrome_router_address');
});

test('buildAdapterSwapTransactions encodes Aerodrome and Camelot router calls', () => {
  const registry = new AdapterRegistry({
    aerodromeRouterAddress: '0x1111111111111111111111111111111111111111',
    aerodromeFactoryAddress: '0x3333333333333333333333333333333333333333',
    camelotRouterAddress: '0x2222222222222222222222222222222222222222',
    camelotReferrerAddress: '0x4444444444444444444444444444444444444444',
  });

  const legs = buildAdapterSwapLegs(basePlan(), registry, 20);
  assert.equal(legs.ok, true);

  const transactions = buildAdapterSwapTransactions(
    legs.legs,
    registry,
    '0x5555555555555555555555555555555555555555',
    1710000009000
  );

  assert.equal(transactions.ok, true);
  assert.equal(transactions.transactions.length, 2);
  assert.equal(transactions.transactions[0].method, 'swapExactTokensForTokens');
  assert.equal(
    transactions.transactions[1].method,
    'swapExactTokensForTokensSupportingFeeOnTransferTokens'
  );
  assert.ok(transactions.transactions[0].data.startsWith('0x'));
  assert.ok(transactions.transactions[1].data.startsWith('0x'));
});
