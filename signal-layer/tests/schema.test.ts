import { normalizeSignal, normalizeSignals } from '../src/schema';

describe('normalizeSignal', () => {
  it('maps opportunity signals into capital-domain fast-lane envelopes', () => {
    const normalized = normalizeSignal({
      id: 'sig-opportunity',
      category: 'opportunity',
      severity: 'high',
      latency: 'urgent',
      summary: 'capital-sensitive opportunity',
      touchesCapital: true,
      tags: ['defi'],
    });

    expect(normalized).toEqual({
      id: 'sig-opportunity',
      domain: 'capital',
      source: 'system',
      severity: 'high',
      latency: 'urgent',
      lane: 'fast',
      summary: 'capital-sensitive opportunity',
      capitalSensitive: true,
      humanLinked: false,
      boundaryRelevant: false,
      tags: ['defi'],
    });
  });

  it('normalizes a batch of runtime signals', () => {
    const normalized = normalizeSignals([
      {
        id: 'sig-research',
        category: 'research',
        severity: 'medium',
        latency: 'normal',
        summary: 'research brief',
      },
      {
        id: 'sig-growth',
        category: 'growth',
        severity: 'medium',
        latency: 'normal',
        summary: 'lead',
      },
    ]);

    expect(normalized).toHaveLength(2);
    expect(normalized.map((signal) => signal.domain)).toEqual(['research', 'exchange']);
  });
});
