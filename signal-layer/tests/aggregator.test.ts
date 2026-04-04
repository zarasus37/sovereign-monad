import { aggregateSignals } from '../src/aggregator';

describe('aggregateSignals', () => {
  it('counts signals across domains, lanes, and sources', () => {
    const aggregate = aggregateSignals([
      {
        id: 'sig-capital',
        domain: 'capital',
        source: 'system',
        severity: 'high',
        latency: 'urgent',
        lane: 'fast',
        summary: 'capital',
        capitalSensitive: true,
        humanLinked: false,
        boundaryRelevant: false,
        tags: [],
      },
      {
        id: 'sig-ops',
        domain: 'operations',
        source: 'operator',
        severity: 'medium',
        latency: 'normal',
        lane: 'slow',
        summary: 'ops',
        capitalSensitive: false,
        humanLinked: true,
        boundaryRelevant: true,
        tags: [],
      },
    ]);

    expect(aggregate.totalSignals).toBe(2);
    expect(aggregate.byDomain.capital).toBe(1);
    expect(aggregate.byDomain.operations).toBe(1);
    expect(aggregate.byLane.fast).toBe(1);
    expect(aggregate.byLane.slow).toBe(1);
    expect(aggregate.bySource.operator).toBe(1);
    expect(aggregate.capitalSensitiveCount).toBe(1);
    expect(aggregate.boundaryRelevantCount).toBe(1);
  });
});
