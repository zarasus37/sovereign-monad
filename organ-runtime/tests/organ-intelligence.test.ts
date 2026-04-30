import { buildCardiaAdaptiveSnapshot } from '../src/cardia-adaptive';
import { buildCortexStrategicSnapshot } from '../src/cortex-strategic';
import { buildPneumaMarketSnapshot } from '../src/pneuma-market';
import { buildSynapseAdaptiveSnapshot } from '../src/synapse-adaptive';
import { buildVoxNarrativeIntelligenceSnapshot } from '../src/vox-intelligence';

describe('adaptive synapse', () => {
  it('escalates conflicting capital-sensitive signals', () => {
    const snapshot = buildSynapseAdaptiveSnapshot(
      [
        {
          id: 's1',
          source: 'Hepar',
          category: 'opportunity',
          severity: 'critical',
          confidence: 0.95,
          touchesCapital: true,
          summary: 'critical exploit',
        },
        {
          id: 's2',
          source: 'Cardia',
          category: 'opportunity',
          severity: 'low',
          confidence: 0.6,
          touchesCapital: true,
          summary: 'allocation seems viable',
        },
      ],
      [
        { source: 'Hepar', precision: 0.9, missRate: 0.05, stalenessSec: 60 },
        { source: 'Cardia', precision: 0.7, missRate: 0.2, stalenessSec: 90 },
      ],
    );

    expect(snapshot.conflicts.length).toBe(1);
    expect(snapshot.escalations).toBeGreaterThan(0);
  });
});

describe('strategic cortex', () => {
  it('produces scenarios and recommendations from stress context', () => {
    const snapshot = buildCortexStrategicSnapshot([
      {
        id: 'ctx1',
        headline: 'stress context',
        heparCriticalCount: 8,
        marketVolatilityPct: 45,
        recentPnlUsd: -100000,
        agentBehaviorStress: 0.7,
        macroRegime: 'risk-off tightening',
      },
    ]);

    expect(snapshot.contextCount).toBe(1);
    expect(snapshot.reports[0].scenarios.length).toBe(3);
    expect(snapshot.reports[0].recommendations.length).toBeGreaterThan(1);
  });
});

describe('narrative vox', () => {
  it('marks narratives verified when facts and proof refs exist', () => {
    const snapshot = buildVoxNarrativeIntelligenceSnapshot([
      {
        id: 'vx1',
        eventTitle: 'event',
        facts: ['fact-a'],
        proofRefs: ['proof://a'],
        contradictionCount: 0,
        audiences: ['operators', 'public'],
      },
    ]);

    expect(snapshot.packageCount).toBe(2);
    expect(snapshot.verifiedCount).toBe(2);
    expect(snapshot.conflictedCount).toBe(0);
  });
});

describe('adaptive cardia', () => {
  it('blocks high-risk candidates and allocates to acceptable ones', () => {
    const snapshot = buildCardiaAdaptiveSnapshot(
      {
        reserveRatioPercent: 30,
        minReserveRatioPercent: 20,
        portfolioDrawdownPct: 6,
        volatilityRegime: 'low',
        liquidityStress: false,
      },
      [
        {
          id: 'c1',
          protocolId: 'safe-proto',
          heparRiskScore: 20,
          expectedReturnPct: 25,
          confidence: 0.8,
          requiredCapitalUsd: 80000,
          currentAllocationUsd: 10000,
        },
        {
          id: 'c2',
          protocolId: 'risky-proto',
          heparRiskScore: 82,
          expectedReturnPct: 20,
          confidence: 0.7,
          requiredCapitalUsd: 60000,
          currentAllocationUsd: 10000,
        },
      ],
    );

    expect(snapshot.blockedCount).toBe(1);
    expect(snapshot.decisions.some((decision) => decision.action === 'allocate')).toBe(true);
  });
});

describe('market pneuma', () => {
  it('selects a valid low-cost venue under risk constraints', () => {
    const snapshot = buildPneumaMarketSnapshot(
      [
        {
          id: 'o1',
          asset: 'ETH/USDC',
          side: 'buy',
          notionalUsd: 100000,
          maxSlippageBps: 25,
          urgency: 'urgent',
        },
      ],
      [
        {
          orderId: 'o1',
          venue: 'dex-a',
          availableUsd: 100000,
          slippageBps: 20,
          feeBps: 4,
          latencyMs: 300,
          counterparty: 'cp-safe',
        },
        {
          orderId: 'o1',
          venue: 'dex-b',
          availableUsd: 100000,
          slippageBps: 10,
          feeBps: 3,
          latencyMs: 500,
          counterparty: 'cp-risky',
        },
      ],
      [
        { name: 'cp-safe', solvencyRisk: 'low', settlementReliability: 0.9, complianceBlocked: false },
        { name: 'cp-risky', solvencyRisk: 'high', settlementReliability: 0.8, complianceBlocked: false },
      ],
    );

    expect(snapshot.acceptedCount).toBe(1);
    expect(snapshot.decisions[0].venue).toBe('dex-a');
  });
});
