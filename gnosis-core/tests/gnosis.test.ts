import { buildGnosisSnapshot } from '../src';

describe('buildGnosisSnapshot', () => {
  it('contains integrity when boundary and mandate pressure are too high', () => {
    const snapshot = buildGnosisSnapshot({
      signal: {
        byDomain: {
          capital: 1,
          research: 1,
          exchange: 1,
          integrity: 2,
          operations: 1,
          narrative: 0,
        },
        interpretations: [
          { label: 'coordination_pressure', level: 'critical' },
          { label: 'boundary_tension', level: 'critical' },
          { label: 'exchange_readiness', level: 'elevated' },
          { label: 'capital_attention', level: 'elevated' },
          { label: 'operator_load', level: 'elevated' },
        ],
      },
      oracle: {
        regime: 'defensive',
        confidence: 'high',
        deploymentPosture: 'observe',
        commercializationPosture: 'internal_only',
      },
      participation: {
        actorCount: 3,
        blockedDecisionCount: 1,
        operatorOverrideCount: 1,
      },
      mandate: {
        title: 'bounded loop',
        gateCheckCount: 2,
      },
    });

    expect(snapshot.integrityStatus).toBe('contain');
    expect(snapshot.boundaryStress).toBe('critical');
    expect(snapshot.reviewFlags).toContain('containment_review');
    expect(snapshot.retrospectiveOnly).toBe(true);
  });

  it('raises hollow-convergence risk when exchange pressure outpaces reflective surfaces', () => {
    const snapshot = buildGnosisSnapshot({
      signal: {
        byDomain: {
          capital: 1,
          research: 0,
          exchange: 3,
          integrity: 0,
          operations: 0,
          narrative: 1,
        },
        interpretations: [
          { label: 'coordination_pressure', level: 'elevated' },
          { label: 'boundary_tension', level: 'stable' },
          { label: 'exchange_readiness', level: 'elevated' },
          { label: 'capital_attention', level: 'stable' },
          { label: 'operator_load', level: 'stable' },
        ],
      },
      oracle: {
        regime: 'balanced',
        confidence: 'high',
        deploymentPosture: 'bounded',
        commercializationPosture: 'buyer_ready',
      },
      participation: {
        actorCount: 2,
        blockedDecisionCount: 0,
        operatorOverrideCount: 0,
      },
      mandate: {
        title: 'outbound loop',
        gateCheckCount: 0,
      },
    });

    expect(snapshot.hollowConvergenceRisk).toBe('critical');
    expect(snapshot.decompressionStatus).toBe('at_risk');
    expect(snapshot.reviewFlags).toContain('hollow_convergence_risk');
  });

  it('stays clear when reflective and exchange surfaces remain balanced', () => {
    const snapshot = buildGnosisSnapshot({
      signal: {
        byDomain: {
          capital: 1,
          research: 2,
          exchange: 1,
          integrity: 1,
          operations: 0,
          narrative: 1,
        },
        interpretations: [
          { label: 'coordination_pressure', level: 'stable' },
          { label: 'boundary_tension', level: 'stable' },
          { label: 'exchange_readiness', level: 'elevated' },
          { label: 'capital_attention', level: 'elevated' },
          { label: 'operator_load', level: 'stable' },
        ],
      },
      oracle: {
        regime: 'balanced',
        confidence: 'medium',
        deploymentPosture: 'bounded',
        commercializationPosture: 'pilot_ready',
      },
      participation: {
        actorCount: 2,
        blockedDecisionCount: 0,
        operatorOverrideCount: 0,
      },
      mandate: {
        title: 'balanced loop',
        gateCheckCount: 0,
      },
    });

    expect(snapshot.integrityStatus).toBe('clear');
    expect(snapshot.decompressionStatus).toBe('authentic_tendency');
    expect(snapshot.hollowConvergenceRisk).toBe('low');
  });
});
