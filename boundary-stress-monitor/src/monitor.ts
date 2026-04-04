import { BoundaryStressInput, BoundaryStressSnapshot, StressLevel } from './types';

function rank(level: StressLevel): number {
  switch (level) {
    case 'stable':
      return 0;
    case 'elevated':
      return 1;
    case 'critical':
      return 2;
  }
}

function maxLevel(levels: StressLevel[]): StressLevel {
  return levels.reduce((current, next) => (rank(next) > rank(current) ? next : current), 'stable');
}

export function buildBoundaryStressSnapshot(input: BoundaryStressInput): BoundaryStressSnapshot {
  const sheathPressure = maxLevel([
    input.signal.boundaryTension,
    input.gnosis.boundaryStress,
    input.gnosis.integrityStatus === 'contain' ? 'critical' : 'stable',
  ]);

  const turbulence = maxLevel([
    input.signal.coordinationPressure,
    input.signal.operatorLoad,
    input.oracle.regime === 'defensive' ? 'elevated' : 'stable',
    input.gnosis.hollowConvergenceRisk === 'critical'
      ? 'critical'
      : input.gnosis.hollowConvergenceRisk === 'elevated'
        ? 'elevated'
        : 'stable',
  ]);

  const reasons: string[] = [];

  let escalationTier: BoundaryStressSnapshot['escalationTier'] = 'tier0';
  let reviewRequired = false;
  let pauseSuggested = false;

  if (
    sheathPressure === 'critical' ||
    turbulence === 'critical' ||
    input.mandate.gateCheckCount > 1 ||
    input.mandate.participationBlockedCount > 0
  ) {
    escalationTier = 'tier2';
    reviewRequired = true;
    pauseSuggested = true;
    reasons.push('boundary and mandate pressure require Tier 2 review posture');
  } else if (
    sheathPressure === 'elevated' ||
    turbulence === 'elevated' ||
    input.oracle.deploymentPosture === 'observe' ||
    input.gnosis.integrityStatus === 'review'
  ) {
    escalationTier = 'tier1';
    reviewRequired = true;
    reasons.push('elevated pressure requires bounded review and tighter observation');
  } else {
    reasons.push('boundary pressure remains within stable local operating bands');
  }

  if (input.signal.capitalAttention === 'critical') {
    reasons.push('capital-sensitive stress is elevated and should remain bounded');
  }

  if (input.gnosis.hollowConvergenceRisk !== 'low') {
    reasons.push('decompression review pressure contributes to sheath instability');
  }

  return {
    implemented: true,
    sheathPressure,
    turbulence,
    escalationTier,
    reviewRequired,
    pauseSuggested,
    reasons,
  };
}
