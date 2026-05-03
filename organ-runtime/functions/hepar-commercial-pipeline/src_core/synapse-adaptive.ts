import {
  OrganName,
  SynapseAdaptiveRoute,
  SynapseAdaptiveRuntimeSnapshot,
  SynapseAdaptivePolicy,
  SynapseAdaptiveSignal,
  SynapseConflictCase,
  SynapseSource,
  SynapseSourceHealth,
} from './types';

const SOURCE_ORDER: SynapseSource[] = ['Hepar', 'Cortex', 'Cardia', 'Pneuma', 'Vox', 'DataRail', 'Market'];

const DEFAULT_POLICY: SynapseAdaptivePolicy = {
  conflictSeverityGap: 3,
  lowConfidenceBlockThreshold: 0.45,
  capitalEscalationMinSeverity: 2,
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function severityLevel(severity: SynapseAdaptiveSignal['severity']): number {
  switch (severity) {
    case 'low':
      return 1;
    case 'medium':
      return 2;
    case 'high':
      return 3;
    case 'critical':
      return 4;
  }
}

function primaryTargetFor(signal: SynapseAdaptiveSignal): OrganName {
  switch (signal.category) {
    case 'opportunity':
    case 'integrity':
      return 'Hepar';
    case 'research':
      return 'Cortex';
    case 'narrative':
      return 'Vox';
    case 'growth':
      return 'Pneuma';
    case 'operations':
      return signal.touchesCapital ? 'Cardia' : 'Cortex';
  }
}

function sourceWeight(health: SynapseSourceHealth): number {
  const freshness = 1 - clamp01(health.stalenessSec / 600);
  const missPenalty = 1 - clamp01(health.missRate);
  return clamp01((health.precision * 0.5) + (missPenalty * 0.3) + (freshness * 0.2));
}

function buildSourceWeightMap(health: SynapseSourceHealth[]): Record<SynapseSource, number> {
  const map = {} as Record<SynapseSource, number>;
  for (const source of SOURCE_ORDER) {
    const row = health.find((entry) => entry.source === source);
    map[source] = row ? sourceWeight(row) : 0.5;
  }
  return map;
}

function detectConflicts(signals: SynapseAdaptiveSignal[], policy: SynapseAdaptivePolicy): SynapseConflictCase[] {
  const conflicts: SynapseConflictCase[] = [];
  for (let i = 0; i < signals.length; i += 1) {
    for (let j = i + 1; j < signals.length; j += 1) {
      const left = signals[i];
      const right = signals[j];
      if (left.category !== right.category) continue;
      if (!left.touchesCapital && !right.touchesCapital) continue;
      const severityGap = Math.abs(severityLevel(left.severity) - severityLevel(right.severity));
      if (severityGap < policy.conflictSeverityGap) continue;

      conflicts.push({
        conflictId: `conflict-${left.id}-${right.id}`,
        signalIds: [left.id, right.id],
        reason: `${left.source} and ${right.source} disagree on severity for ${left.category} signal`,
        arbitrationTarget: 'Cortex',
        status: 'escalated',
      });
    }
  }
  return conflicts;
}

function actionFor(signal: SynapseAdaptiveSignal, primaryTarget: OrganName): string {
  if (signal.category === 'opportunity' && signal.severity === 'critical') {
    return 'block allocation pending Hepar and Cortex arbitration';
  }
  if (signal.category === 'research' && signal.severity !== 'low') {
    return 'issue strategic digest and scenario update';
  }
  if (signal.category === 'growth') {
    return 'route to Pneuma execution queue with risk checks';
  }
  if (signal.category === 'narrative') {
    return 'prepare audience-specific narrative packages';
  }
  if (signal.category === 'operations' && signal.touchesCapital) {
    return 'gate Cardia until checks are resolved';
  }
  return `route to ${primaryTarget} standard workflow`;
}

function buildRoute(
  signal: SynapseAdaptiveSignal,
  weights: Record<SynapseSource, number>,
  conflictSignalIds: Set<string>,
  policy: SynapseAdaptivePolicy,
): SynapseAdaptiveRoute {
  const primaryTarget = primaryTargetFor(signal);
  const confidenceWeight = clamp01((clamp01(signal.confidence) * 0.6) + (weights[signal.source] * 0.4));
  const severe = severityLevel(signal.severity) >= policy.capitalEscalationMinSeverity;
  const conflicting = conflictSignalIds.has(signal.id);

  const routeType =
    conflicting || (signal.touchesCapital && severe)
      ? 'escalated'
      : confidenceWeight < policy.lowConfidenceBlockThreshold
        ? 'blocked'
        : 'normal';

  const reasons = [
    `source=${signal.source} weight=${weights[signal.source].toFixed(2)}`,
    `signal confidence=${clamp01(signal.confidence).toFixed(2)}`,
    `category=${signal.category} severity=${signal.severity}`,
  ];

  if (conflicting) reasons.push('conflict detected with paired signal');
  if (signal.touchesCapital) reasons.push('capital-sensitive routing path');

  return {
    signalId: signal.id,
    primaryTarget,
    routeType,
    confidenceWeight,
    action: actionFor(signal, primaryTarget),
    reasons,
  };
}

export function buildSynapseAdaptiveSnapshot(
  signals: SynapseAdaptiveSignal[],
  sourceHealth: SynapseSourceHealth[],
  policy?: Partial<SynapseAdaptivePolicy>,
): SynapseAdaptiveRuntimeSnapshot {
  const effectivePolicy: SynapseAdaptivePolicy = {
    ...DEFAULT_POLICY,
    ...(policy || {}),
  };
  const sourceWeights = buildSourceWeightMap(sourceHealth);
  const conflicts = detectConflicts(signals, effectivePolicy);
  const conflictSignalIds = new Set<string>(conflicts.flatMap((conflict) => conflict.signalIds));
  const routes = signals.map((signal) =>
    buildRoute(signal, sourceWeights, conflictSignalIds, effectivePolicy),
  );
  const escalations = routes.filter((route) => route.routeType === 'escalated').length;

  return {
    implemented: true,
    signalCount: signals.length,
    escalations,
    routes,
    conflicts,
    sourceWeights,
    policyUsed: effectivePolicy,
  };
}
