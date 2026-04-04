import { buildOracleSnapshot } from '../src';

describe('buildOracleSnapshot', () => {
  it('falls into defensive posture when integrity or execution is blocked', () => {
    const snapshot = buildOracleSnapshot({
      aggregate: {
        totalSignals: 3,
        byDomain: {
          capital: 1,
          research: 0,
          exchange: 0,
          integrity: 1,
          operations: 1,
          narrative: 0,
        },
        bySeverity: {
          low: 0,
          medium: 1,
          high: 1,
          critical: 1,
        },
        byLane: {
          fast: 2,
          slow: 1,
        },
        capitalSensitiveCount: 1,
        boundaryRelevantCount: 2,
      },
      interpretations: [
        { label: 'coordination_pressure', level: 'critical' },
        { label: 'boundary_tension', level: 'critical' },
        { label: 'exchange_readiness', level: 'stable' },
        { label: 'capital_attention', level: 'elevated' },
        { label: 'operator_load', level: 'elevated' },
      ],
      executionReadiness: 'blocked',
    });

    expect(snapshot.regime).toBe('defensive');
    expect(snapshot.deploymentPosture).toBe('observe');
    expect(snapshot.commercializationPosture).toBe('internal_only');
  });

  it('allows bounded outward posture when exchange is live-favorable and boundaries are stable', () => {
    const snapshot = buildOracleSnapshot({
      aggregate: {
        totalSignals: 4,
        byDomain: {
          capital: 1,
          research: 1,
          exchange: 2,
          integrity: 0,
          operations: 0,
          narrative: 0,
        },
        bySeverity: {
          low: 1,
          medium: 2,
          high: 1,
          critical: 0,
        },
        byLane: {
          fast: 1,
          slow: 3,
        },
        capitalSensitiveCount: 1,
        boundaryRelevantCount: 0,
      },
      interpretations: [
        { label: 'coordination_pressure', level: 'stable' },
        { label: 'boundary_tension', level: 'stable' },
        { label: 'exchange_readiness', level: 'elevated' },
        { label: 'capital_attention', level: 'elevated' },
        { label: 'operator_load', level: 'stable' },
      ],
      executionReadiness: 'ready',
    });

    expect(snapshot.regime).toBe('offensive');
    expect(snapshot.deploymentPosture).toBe('bounded');
    expect(snapshot.commercializationPosture).toBe('buyer_ready');
  });
});
