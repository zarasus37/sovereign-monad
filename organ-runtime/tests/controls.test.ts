import {
  buildHomeostasisSnapshot,
  buildImmuneSnapshot,
  buildSignalingSnapshot,
} from '../src/controls';

describe('buildHomeostasisSnapshot', () => {
  it('detects breaches outside healthy ranges', () => {
    const snapshot = buildHomeostasisSnapshot([
      {
        name: 'drawdown_bps',
        current: 80,
        min: 0,
        max: 120,
        unit: 'bps',
        correctiveAction: 'stay bounded',
      },
      {
        name: 'operator_queue_depth',
        current: 12,
        min: 0,
        max: 8,
        unit: 'items',
        correctiveAction: 'clear backlog',
      },
    ]);

    expect(snapshot.healthy).toBe(false);
    expect(snapshot.breaches).toHaveLength(1);
    expect(snapshot.breaches[0].name).toBe('operator_queue_depth');
  });
});

describe('buildSignalingSnapshot', () => {
  it('separates fast and slow lanes', () => {
    const snapshot = buildSignalingSnapshot([
      {
        id: 'sig-fast',
        category: 'opportunity',
        severity: 'high',
        latency: 'urgent',
        summary: 'fast',
      },
      {
        id: 'sig-slow',
        category: 'research',
        severity: 'medium',
        latency: 'normal',
        summary: 'slow',
      },
    ]);

    expect(snapshot.fastLaneSignalIds).toEqual(['sig-fast']);
    expect(snapshot.slowLaneSignalIds).toEqual(['sig-slow']);
  });
});

describe('buildImmuneSnapshot', () => {
  it('creates barrier and repair decisions from incidents', () => {
    const snapshot = buildImmuneSnapshot([
      {
        id: 'imm-1',
        category: 'integrity',
        severity: 'high',
        selfBoundaryViolated: true,
        contained: false,
        needsRepair: true,
        summary: 'boundary issue',
      },
      {
        id: 'imm-2',
        category: 'operations',
        severity: 'medium',
        selfBoundaryViolated: false,
        contained: true,
        needsRepair: false,
        summary: 'contained drift',
      },
    ]);

    expect(snapshot.barrierTriggerCount).toBe(1);
    expect(snapshot.repairQueueCount).toBe(1);
    expect(snapshot.decisions[0].repairAction).toContain('repair loop');
  });
});
