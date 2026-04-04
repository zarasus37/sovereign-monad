import { buildSignalLayerSnapshot } from '../src';

describe('buildSignalLayerSnapshot', () => {
  it('produces aggregate counts and interpretation labels', () => {
    const snapshot = buildSignalLayerSnapshot([
      {
        id: 'sig-opportunity',
        category: 'opportunity',
        severity: 'high',
        latency: 'urgent',
        summary: 'capital-sensitive opportunity',
        touchesCapital: true,
      },
      {
        id: 'sig-integrity',
        category: 'integrity',
        severity: 'high',
        latency: 'urgent',
        summary: 'boundary issue',
      },
      {
        id: 'sig-growth',
        category: 'growth',
        severity: 'medium',
        latency: 'normal',
        summary: 'qualified lead',
      },
    ]);

    expect(snapshot.implemented).toBe(true);
    expect(snapshot.normalizedCount).toBe(3);
    expect(snapshot.aggregate.byDomain.capital).toBe(1);
    expect(snapshot.aggregate.byDomain.integrity).toBe(1);
    expect(snapshot.aggregate.byDomain.exchange).toBe(1);
    expect(snapshot.interpretations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'coordination_pressure', level: 'elevated' }),
        expect.objectContaining({ label: 'boundary_tension', level: 'elevated' }),
        expect.objectContaining({ label: 'exchange_readiness', level: 'elevated' }),
        expect.objectContaining({ label: 'capital_attention', level: 'elevated' }),
      ]),
    );
  });
});
