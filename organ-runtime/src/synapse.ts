import { OrganName, SynapseRouteDecision, SynapseRuntimeSnapshot, SynapseSignal } from './types';

function supportingTargetsFor(signal: SynapseSignal, primaryTarget: OrganName): OrganName[] {
  const supporting = new Set<OrganName>();

  switch (signal.category) {
    case 'opportunity':
      supporting.add('Cortex');
      if (signal.touchesCapital) supporting.add('Cardia');
      break;
    case 'research':
      supporting.add('Vox');
      supporting.add('Pneuma');
      break;
    case 'narrative':
      supporting.add('Pneuma');
      if (signal.severity === 'high' || signal.severity === 'critical') supporting.add('Cortex');
      break;
    case 'growth':
      supporting.add('Vox');
      supporting.add('Cortex');
      break;
    case 'integrity':
      supporting.add('Cortex');
      if (signal.touchesCapital) supporting.add('Cardia');
      break;
    case 'operations':
      supporting.add('Cortex');
      if (signal.touchesCapital) supporting.add('Cardia');
      break;
  }

  if (signal.requiresExternalExpression) {
    supporting.add('Vox');
    supporting.add('Pneuma');
  }

  supporting.delete(primaryTarget);
  return [...supporting];
}

function primaryTargetFor(signal: SynapseSignal): OrganName {
  switch (signal.category) {
    case 'opportunity':
      return 'Hepar';
    case 'research':
      return 'Cortex';
    case 'narrative':
      return 'Vox';
    case 'growth':
      return 'Pneuma';
    case 'integrity':
      return 'Hepar';
    case 'operations':
      return signal.touchesCapital ? 'Cardia' : 'Cortex';
  }
}

function buildJustification(signal: SynapseSignal, primaryTarget: OrganName): string {
  const reasons: string[] = [];

  reasons.push(`${signal.category} signal routes primarily to ${primaryTarget}`);

  if (signal.touchesCapital) {
    reasons.push('signal touches capital or treasury posture');
  }

  if (signal.requiresExternalExpression) {
    reasons.push('signal needs outward expression and exchange follow-through');
  }

  if (signal.latency === 'urgent' || signal.latency === 'immediate') {
    reasons.push('signal requires fast-path routing');
  }

  return reasons.join('; ');
}

export function routeSignal(signal: SynapseSignal): SynapseRouteDecision {
  const primaryTarget = primaryTargetFor(signal);
  return {
    signalId: signal.id,
    primaryTarget,
    supportingTargets: supportingTargetsFor(signal, primaryTarget),
    justification: buildJustification(signal, primaryTarget),
    fastPath: signal.latency === 'urgent' || signal.latency === 'immediate',
  };
}

export function buildSynapseSnapshot(sampleSignals: SynapseSignal[]): SynapseRuntimeSnapshot {
  return {
    implemented: true,
    sampleSignalCount: sampleSignals.length,
    routeDecisions: sampleSignals.map(routeSignal),
  };
}
