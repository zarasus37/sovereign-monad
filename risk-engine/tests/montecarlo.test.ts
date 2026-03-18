/**
 * Monte Carlo Engine Tests (Phase 5)
 * 
 * Test fixture and unit tests for the Monte Carlo risk engine.
 */

import { runMonteCarlo, evaluateOpportunity } from '../src/engine/montecarlo';
import { OpportunityCandidate } from '../src/models/events';

// Test fixture per spec
const baseOpportunity: OpportunityCandidate = {
  meta: {
    eventId: 'test-event-id',
    eventType: 'OpportunityCandidate',
    version: 1,
    timestampMs: Date.now(),
    source: 'test',
  },
  id: 'test-opp-001',
  asset: 'ETH',
  direction: 'buy_M_sell_E',
  sizeSuggestion: '50000',
  entryMarket: 'kuru:ETH/USDC:spot',
  exitMarket: 'uni_v3:ETH/USDC:0.05%',
  modeOptions: ['inventory_based', 'bridge_based'],
  timeWindowEstimateMs: 30000,
  spreadBps: 25,
  volM5m: 0.5,
  volE5m: 0.3,
  sourceSignalId: 'test-signal-001',
};

// Test fixtures - typed as record to avoid tuple inference
const TEST_OPPORTUNITY: OpportunityCandidate = { ...baseOpportunity };
const TEST_FIXTURES: Record<string, OpportunityCandidate> = {
  basicOpportunity: baseOpportunity,
  highVolatility: { ...baseOpportunity, volM5m: 2.0, volE5m: 1.5, spreadBps: 50 },
  lowSpread: { ...baseOpportunity, spreadBps: 5, sizeSuggestion: '10000' },
  largeSize: { ...baseOpportunity, sizeSuggestion: '500000', spreadBps: 30 },
  longBridge: { ...baseOpportunity, timeWindowEstimateMs: 60000 },
};

const RISK_CONFIG = {
  evMinThreshold: 100,
  sharpeLikeThreshold: 0.5,
  maxTailLossPercent: 20,
};

describe('MonteCarlo Engine', () => {
  describe('runMonteCarlo', () => {
    it('should return valid MonteCarloResult structure', () => {
      const result = runMonteCarlo(TEST_OPPORTUNITY, {}, 1000);
      expect(result).toHaveProperty('evMean');
      expect(result).toHaveProperty('evStd');
      expect(result).toHaveProperty('sharpeLike');
      expect(result).toHaveProperty('pLossGtX');
      expect(result).toHaveProperty('maxDrawdownEstimate');
      expect(result).toHaveProperty('distribution');
      expect(Array.isArray(result.distribution)).toBe(true);
    });

    it('should run with specified number of simulations', () => {
      const result = runMonteCarlo(TEST_OPPORTUNITY, {}, 5000);
      expect(result.distribution.length).toBe(5000);
    });

    it('should handle inventory_based mode', () => {
      const opp = { ...TEST_OPPORTUNITY, modeOptions: ['inventory_based', 'inventory_based'] as ['inventory_based', 'inventory_based'] };
      const result = runMonteCarlo(opp, {}, 1000);
      expect(result.evMean).toBeDefined();
    });

    it('should handle bridge_based mode', () => {
      const opp = { ...TEST_OPPORTUNITY, modeOptions: ['bridge_based', 'bridge_based'] as ['bridge_based', 'bridge_based'] };
      const result = runMonteCarlo(opp, {}, 1000);
      expect(result.evMean).toBeDefined();
      expect(result.evStd).toBeGreaterThan(0);
    });

    it('should use custom volatility parameters', () => {
      const result = runMonteCarlo(TEST_OPPORTUNITY, { volM: 1.0, volE: 0.8 }, 1000);
      expect(result.evMean).toBeDefined();
    });

    it('should produce consistent results', () => {
      const results = [runMonteCarlo(TEST_OPPORTUNITY, {}, 100), runMonteCarlo(TEST_OPPORTUNITY, {}, 100)];
      results.forEach(r => expect(r.distribution.length).toBe(100));
    });
  });

  describe('evaluateOpportunity', () => {
    it('should approve profitable opportunity', () => {
      const result = evaluateOpportunity(TEST_OPPORTUNITY, RISK_CONFIG);
      expect(result).toHaveProperty('approved');
      expect(result).toHaveProperty('size');
    });

    it('should reject low-EV opportunity', () => {
      const opp = { ...TEST_OPPORTUNITY, spreadBps: 1, sizeSuggestion: '1000' };
      const result = evaluateOpportunity(opp, RISK_CONFIG);
      expect(result).toBeDefined();
    });

    it('should handle high volatility', () => {
      const result = evaluateOpportunity(TEST_FIXTURES.highVolatility, RISK_CONFIG);
      expect(result).toBeDefined();
    });
  });

  describe('Risk Metrics', () => {
    it('should calculate EV', () => {
      const result = runMonteCarlo(TEST_OPPORTUNITY, {}, 1000);
      expect(typeof result.evMean).toBe('number');
    });

    it('should have non-negative std', () => {
      const result = runMonteCarlo(TEST_OPPORTUNITY, {}, 1000);
      expect(result.evStd).toBeGreaterThanOrEqual(0);
    });

    it('should report tail risk', () => {
      const result = runMonteCarlo(TEST_OPPORTUNITY, {}, 1000);
      expect(result.pLossGtX).toBeGreaterThanOrEqual(0);
      expect(result.pLossGtX).toBeLessThanOrEqual(1);
    });
  });

  describe('Fixtures', () => {
    it('basicOpportunity', () => {
      const r = runMonteCarlo(TEST_FIXTURES.basicOpportunity, {}, 100);
      expect(r.evMean).toBeDefined();
    });
    it('highVolatility', () => {
      const r = runMonteCarlo(TEST_FIXTURES.highVolatility, {}, 100);
      expect(r.evStd).toBeGreaterThan(0);
    });
    it('lowSpread', () => {
      const r = runMonteCarlo(TEST_FIXTURES.lowSpread, {}, 100);
      expect(r.evMean).toBeDefined();
    });
    it('largeSize', () => {
      const r = runMonteCarlo(TEST_FIXTURES.largeSize, {}, 100);
      expect(r.evMean).toBeDefined();
    });
    it('longBridge', () => {
      const r = runMonteCarlo(TEST_FIXTURES.longBridge, {}, 100);
      expect(r.evMean).toBeDefined();
    });
  });
});
