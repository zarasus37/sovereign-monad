const test = require('node:test');
const assert = require('node:assert/strict');

const {
  applyConstraints,
  buildExecutionPlan,
} = require('../dist/planning.js');

test('applyConstraints rejects unsupported execution mode', () => {
  const decision = applyConstraints(
    {
      approved: true,
      mode: 'bridge_based',
      size: '1000',
    },
    {
      totalValueUsd: 100000,
      bridgeExposure: [],
      chainExposure: [],
      openPositions: [],
    },
    {
      maxBridgeExposurePercent: 30,
      maxSingleTradePercent: 10,
      supportedExecutionModes: ['inventory_based'],
    }
  );

  assert.equal(decision.approved, false);
  assert.equal(decision.reason, 'unsupported_mode:bridge_based');
});

test('buildExecutionPlan preserves evaluation metadata and computes deadline', () => {
  const nowMs = 1710000000000;
  const plan = buildExecutionPlan(
    {
      meta: {
        eventId: 'evt-1',
        eventType: 'OpportunityEvaluation',
        version: 1,
        timestampMs: nowMs - 1000,
        source: 'risk-engine',
      },
      opportunityId: 'opp-1',
      asset: 'ETH',
      direction: 'buy_M_sell_E',
      entryVenue: 'aerodrome:ETH/USDC:spot',
      exitVenue: 'camelot:ETH/USDC:spot',
      entryPrice: 2500,
      exitPrice: 2510,
      spreadBps: 40,
      sourceSignalId: 'signal-1',
      mode: 'inventory_based',
      evMean: 25,
      evStd: 3,
      sharpeLike: 8,
      pLossGtX: 0.1,
      maxDrawdownEstimate: -15,
      approved: true,
      size: '500',
      timeWindowMs: 8000,
    },
    { approved: true, size: '250' },
    nowMs
  );

  assert.equal(plan.asset, 'ETH');
  assert.equal(plan.direction, 'buy_M_sell_E');
  assert.equal(plan.entryVenue, 'aerodrome:ETH/USDC:spot');
  assert.equal(plan.exitVenue, 'camelot:ETH/USDC:spot');
  assert.equal(plan.entryPrice, 2500);
  assert.equal(plan.exitPrice, 2510);
  assert.equal(plan.spreadBps, 40);
  assert.equal(plan.sourceSignalId, 'signal-1');
  assert.equal(plan.expectedEv, 12.5);
  assert.equal(plan.executionDeadlineMs, nowMs + 8000);
  assert.match(plan.planId, /^opp-1:inventory_based:/);
});
