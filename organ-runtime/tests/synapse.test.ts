import { buildSynapseSnapshot, routeSignal } from '../src/synapse';

describe('routeSignal', () => {
  it('routes opportunity signals to Hepar with Cardia support when capital is involved', () => {
    const decision = routeSignal({
      id: 'op-1',
      category: 'opportunity',
      severity: 'high',
      latency: 'urgent',
      summary: 'Capital-touching opportunity',
      touchesCapital: true,
    });

    expect(decision.primaryTarget).toBe('Hepar');
    expect(decision.supportingTargets).toEqual(['Cortex', 'Cardia']);
    expect(decision.fastPath).toBe(true);
  });

  it('routes research signals to Cortex with outward support when expression is needed', () => {
    const decision = routeSignal({
      id: 'res-1',
      category: 'research',
      severity: 'medium',
      latency: 'normal',
      summary: 'Research packaging signal',
      requiresExternalExpression: true,
    });

    expect(decision.primaryTarget).toBe('Cortex');
    expect(decision.supportingTargets).toEqual(['Vox', 'Pneuma']);
    expect(decision.fastPath).toBe(false);
  });
});

describe('buildSynapseSnapshot', () => {
  it('builds routing decisions for each provided signal', () => {
    const snapshot = buildSynapseSnapshot([
      {
        id: 'growth-1',
        category: 'growth',
        severity: 'medium',
        latency: 'normal',
        summary: 'Lead routing',
        requiresExternalExpression: true,
      },
      {
        id: 'ops-1',
        category: 'operations',
        severity: 'critical',
        latency: 'immediate',
        summary: 'Critical treasury operations issue',
        touchesCapital: true,
      },
    ]);

    expect(snapshot.implemented).toBe(true);
    expect(snapshot.sampleSignalCount).toBe(2);
    expect(snapshot.routeDecisions[0].primaryTarget).toBe('Pneuma');
    expect(snapshot.routeDecisions[1].primaryTarget).toBe('Cardia');
    expect(snapshot.routeDecisions[1].fastPath).toBe(true);
  });
});
