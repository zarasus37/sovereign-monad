import {
  DecompressionStatus,
  GnosisInput,
  GnosisLevel,
  GnosisSnapshot,
  HollowConvergenceRisk,
  IntegrityStatus,
} from './types';

function levelFor(input: GnosisInput, label: GnosisInput['signal']['interpretations'][number]['label']): GnosisLevel {
  return input.signal.interpretations.find((item) => item.label === label)?.level || 'stable';
}

function maxLevel(a: GnosisLevel, b: GnosisLevel): GnosisLevel {
  const rank: Record<GnosisLevel, number> = { stable: 0, elevated: 1, critical: 2 };
  return rank[a] >= rank[b] ? a : b;
}

export function buildGnosisSnapshot(input: GnosisInput): GnosisSnapshot {
  const boundaryTension = levelFor(input, 'boundary_tension');
  const coordinationPressure = levelFor(input, 'coordination_pressure');
  const exchangeReadiness = levelFor(input, 'exchange_readiness');
  const boundaryStress = maxLevel(boundaryTension, coordinationPressure);

  const reviewFlags: string[] = [];
  const reasons: string[] = [];

  let integrityStatus: IntegrityStatus = 'clear';
  let decompressionStatus: DecompressionStatus = 'authentic_tendency';
  let hollowConvergenceRisk: HollowConvergenceRisk = 'low';

  if (boundaryTension === 'critical' || input.participation.blockedDecisionCount > 0 || input.mandate.gateCheckCount > 1) {
    integrityStatus = 'contain';
    reviewFlags.push('containment_review');
    reasons.push('boundary or participation posture requires containment-level review');
  } else if (
    boundaryTension === 'elevated' ||
    coordinationPressure === 'critical' ||
    input.mandate.gateCheckCount > 0 ||
    input.participation.operatorOverrideCount > 0
  ) {
    integrityStatus = 'review';
    reviewFlags.push('integrity_review');
    reasons.push('retrospective review is required before treating behavior as fully aligned');
  } else {
    reasons.push('no containment-level integrity pressure is currently visible');
  }

  if (
    input.signal.byDomain.exchange > input.signal.byDomain.research + input.signal.byDomain.integrity &&
    exchangeReadiness !== 'stable' &&
    input.oracle.commercializationPosture === 'buyer_ready'
  ) {
    hollowConvergenceRisk = 'critical';
    decompressionStatus = 'at_risk';
    reviewFlags.push('hollow_convergence_risk');
    reasons.push('outward exchange pressure is exceeding reflective/research pressure');
  } else if (
    input.signal.byDomain.exchange >= input.signal.byDomain.research &&
    input.oracle.commercializationPosture !== 'internal_only'
  ) {
    hollowConvergenceRisk = 'elevated';
    decompressionStatus = integrityStatus === 'clear' ? 'mixed' : 'at_risk';
    reviewFlags.push('decompression_review');
    reasons.push('externalized activity is approaching the boundary where pattern-copying risk rises');
  } else {
    reasons.push('research and integrity surfaces remain present enough to support authentic decompression');
  }

  if (input.oracle.regime === 'defensive' || input.oracle.deploymentPosture === 'observe') {
    decompressionStatus = decompressionStatus === 'authentic_tendency' ? 'mixed' : decompressionStatus;
    reasons.push('defensive oracle posture argues for cautious interpretation of current outputs');
  }

  return {
    implemented: true,
    retrospectiveOnly: true,
    integrityStatus,
    decompressionStatus,
    hollowConvergenceRisk,
    boundaryStress,
    reviewFlags,
    reasons,
  };
}
