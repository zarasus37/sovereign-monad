import { buildRuntimeSnapshot } from '../src/coordinator';
import { OrganRuntimeConfig } from '../src/types';

function makeConfig(): OrganRuntimeConfig {
  return {
    runtimeMode: 'analysis',
    organs: {
      Cardia: {
        enabled: true,
        capitalRequired: true,
        buildReady: false,
        notes: ['capital gated'],
      },
      Pneuma: {
        enabled: true,
        capitalRequired: false,
        buildReady: true,
        notes: ['ready'],
      },
      Hepar: {
        enabled: true,
        capitalRequired: false,
        buildReady: true,
        notes: ['ready'],
      },
      Cortex: {
        enabled: true,
        capitalRequired: false,
        buildReady: true,
        notes: ['ready'],
      },
      Synapse: {
        enabled: true,
        capitalRequired: false,
        buildReady: true,
        notes: ['ready'],
      },
      Vox: {
        enabled: true,
        capitalRequired: false,
        buildReady: true,
        notes: ['ready'],
      },
    },
    coordination: {
      primaryLoop: ['Synapse', 'Hepar', 'Cortex', 'Cardia', 'Vox', 'Pneuma'],
      allowCapitalGatedOrgansInAnalysis: true,
    },
  };
}

describe('buildRuntimeSnapshot', () => {
  it('separates zero-capital and capital-gated organs', () => {
    const snapshot = buildRuntimeSnapshot(makeConfig());

    expect(snapshot.zeroCapitalBuildQueue).toEqual(['Synapse', 'Hepar', 'Cortex', 'Vox', 'Pneuma']);
    expect(snapshot.capitalGatedQueue).toEqual(['Cardia']);
  });

  it('marks Cardia as blocked in analysis mode when capital gated', () => {
    const snapshot = buildRuntimeSnapshot(makeConfig());
    const cardia = snapshot.organs.find((organ) => organ.name === 'Cardia');

    expect(cardia).toBeDefined();
    expect(cardia?.zeroCapitalReady).toBe(false);
    expect(cardia?.blockedReasons).toContain('capital_gated');
  });

  it('produces a synapse snapshot from sample signals', () => {
    const config = makeConfig();
    config.synapse = {
      sampleSignals: [
        {
          id: 'sig-opportunity',
          category: 'opportunity',
          severity: 'high',
          latency: 'urgent',
          summary: 'Opportunity needs filtering before capital deployment.',
          touchesCapital: true,
        },
      ],
    };

    const snapshot = buildRuntimeSnapshot(config);
    expect(snapshot.synapse?.implemented).toBe(true);
    expect(snapshot.synapse?.sampleSignalCount).toBe(1);
    expect(snapshot.synapse?.routeDecisions[0]).toMatchObject({
      signalId: 'sig-opportunity',
      primaryTarget: 'Hepar',
      supportingTargets: ['Cortex', 'Cardia'],
      fastPath: true,
    });
  });

  it('requires every organ in the primary loop', () => {
    const config = makeConfig();
    config.coordination.primaryLoop = ['Synapse', 'Hepar', 'Cortex', 'Cardia', 'Vox'];

    expect(() => buildRuntimeSnapshot(config)).toThrow('Primary loop is missing organ definitions');
  });
});
