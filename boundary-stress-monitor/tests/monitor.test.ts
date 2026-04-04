import { buildBoundaryStressSnapshot } from '../src';

describe('buildBoundaryStressSnapshot', () => {
  it('escalates to tier2 when boundary pressure and gate pressure are high', () => {
    const snapshot = buildBoundaryStressSnapshot({
      signal: {
        coordinationPressure: 'elevated',
        boundaryTension: 'critical',
        capitalAttention: 'elevated',
        operatorLoad: 'stable',
      },
      oracle: {
        regime: 'defensive',
        deploymentPosture: 'observe',
      },
      gnosis: {
        integrityStatus: 'contain',
        hollowConvergenceRisk: 'critical',
        boundaryStress: 'critical',
      },
      mandate: {
        gateCheckCount: 2,
        participationBlockedCount: 1,
      },
    });

    expect(snapshot.escalationTier).toBe('tier2');
    expect(snapshot.pauseSuggested).toBe(true);
    expect(snapshot.reviewRequired).toBe(true);
  });

  it('uses tier1 for elevated-but-not-critical sheath pressure', () => {
    const snapshot = buildBoundaryStressSnapshot({
      signal: {
        coordinationPressure: 'elevated',
        boundaryTension: 'elevated',
        capitalAttention: 'stable',
        operatorLoad: 'stable',
      },
      oracle: {
        regime: 'balanced',
        deploymentPosture: 'bounded',
      },
      gnosis: {
        integrityStatus: 'review',
        hollowConvergenceRisk: 'elevated',
        boundaryStress: 'elevated',
      },
      mandate: {
        gateCheckCount: 1,
        participationBlockedCount: 0,
      },
    });

    expect(snapshot.escalationTier).toBe('tier1');
    expect(snapshot.reviewRequired).toBe(true);
    expect(snapshot.pauseSuggested).toBe(false);
  });

  it('stays tier0 when local posture is stable', () => {
    const snapshot = buildBoundaryStressSnapshot({
      signal: {
        coordinationPressure: 'stable',
        boundaryTension: 'stable',
        capitalAttention: 'stable',
        operatorLoad: 'stable',
      },
      oracle: {
        regime: 'balanced',
        deploymentPosture: 'paper',
      },
      gnosis: {
        integrityStatus: 'clear',
        hollowConvergenceRisk: 'low',
        boundaryStress: 'stable',
      },
      mandate: {
        gateCheckCount: 0,
        participationBlockedCount: 0,
      },
    });

    expect(snapshot.escalationTier).toBe('tier0');
    expect(snapshot.reviewRequired).toBe(false);
    expect(snapshot.pauseSuggested).toBe(false);
  });
});
