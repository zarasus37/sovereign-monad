import { OracleInput, OracleSnapshot } from './types';

function interpretationLevel(input: OracleInput, label: OracleInput['interpretations'][number]['label']) {
  return input.interpretations.find((item) => item.label === label)?.level || 'low';
}

export function buildOracleSnapshot(input: OracleInput): OracleSnapshot {
  const coordination = interpretationLevel(input, 'coordination_pressure');
  const boundary = interpretationLevel(input, 'boundary_tension');
  const exchange = interpretationLevel(input, 'exchange_readiness');
  const capital = interpretationLevel(input, 'capital_attention');
  const operator = interpretationLevel(input, 'operator_load');

  const reasons: string[] = [];
  let regime: OracleSnapshot['regime'] = 'balanced';
  let deploymentPosture: OracleSnapshot['deploymentPosture'] = 'paper';
  let commercializationPosture: OracleSnapshot['commercializationPosture'] = 'internal_only';
  let confidence: OracleSnapshot['confidence'] = 'medium';

  if (
    input.executionReadiness === 'blocked' ||
    boundary === 'critical' ||
    coordination === 'critical'
  ) {
    regime = 'defensive';
    deploymentPosture = 'observe';
    commercializationPosture = 'internal_only';
    confidence = 'high';
    reasons.push('execution or integrity posture is not healthy enough for outward deployment');
  } else if (
    input.executionReadiness === 'ready' &&
    exchange !== 'stable' &&
    boundary === 'stable' &&
    operator !== 'critical'
  ) {
    regime = 'offensive';
    deploymentPosture = 'bounded';
    commercializationPosture = 'buyer_ready';
    confidence = 'high';
    reasons.push('exchange posture is live-favorable and boundary pressure is stable');
  } else {
    regime = 'balanced';
    deploymentPosture = input.executionReadiness === 'bounded' ? 'bounded' : 'paper';
    commercializationPosture = exchange === 'elevated' ? 'pilot_ready' : 'internal_only';
    confidence = input.aggregate.totalSignals >= 3 ? 'medium' : 'low';
    reasons.push('signal posture supports bounded analysis but not full outward confidence');
  }

  if (capital === 'critical' || input.aggregate.capitalSensitiveCount > 1) {
    reasons.push('capital attention remains elevated and should stay explicitly bounded');
  }

  if (operator === 'elevated' || operator === 'critical') {
    reasons.push('operator load should be reduced before escalation');
  }

  if (input.aggregate.byDomain.research > 0) {
    reasons.push('research-domain signal is available for briefing and commercialization packaging');
  }

  return {
    implemented: true,
    regime,
    confidence,
    deploymentPosture,
    commercializationPosture,
    reasons,
  };
}
