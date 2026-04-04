import {
  HomeostasisBreach,
  HomeostasisMetric,
  HomeostasisRuntimeSnapshot,
  ImmuneIncident,
  ImmuneResponseDecision,
  ImmuneRuntimeSnapshot,
  SignalingRuntimeSnapshot,
  SynapseSignal,
} from './types';

function buildBreach(metric: HomeostasisMetric): HomeostasisBreach {
  return {
    name: metric.name,
    current: metric.current,
    range: `${metric.min}-${metric.max} ${metric.unit}`.trim(),
    correctiveAction: metric.correctiveAction,
  };
}

export function buildHomeostasisSnapshot(
  metrics: HomeostasisMetric[],
): HomeostasisRuntimeSnapshot {
  const breaches = metrics
    .filter((metric) => metric.current < metric.min || metric.current > metric.max)
    .map(buildBreach);

  return {
    implemented: true,
    healthy: breaches.length === 0,
    metricCount: metrics.length,
    breaches,
  };
}

export function buildSignalingSnapshot(
  signals: SynapseSignal[],
): SignalingRuntimeSnapshot {
  const fastLaneSignalIds = signals
    .filter((signal) => signal.latency === 'urgent' || signal.latency === 'immediate')
    .map((signal) => signal.id);

  const slowLaneSignalIds = signals
    .filter((signal) => signal.latency === 'normal' || signal.latency === 'slow')
    .map((signal) => signal.id);

  return {
    implemented: true,
    fastLaneSignalIds,
    slowLaneSignalIds,
  };
}

function buildImmuneDecision(incident: ImmuneIncident): ImmuneResponseDecision {
  const barrierTriggered = incident.selfBoundaryViolated || incident.severity === 'critical';

  const containmentAction = barrierTriggered
    ? 'trigger barrier and quarantine the affected lane'
    : incident.contained
      ? 'containment already in place; monitor and preserve memory'
      : 'raise alert and apply bounded containment';

  const repairAction = incident.needsRepair
    ? 'open repair loop with postmortem, tightened controls, and controlled re-entry'
    : null;

  return {
    incidentId: incident.id,
    barrierTriggered,
    containmentAction,
    repairAction,
  };
}

export function buildImmuneSnapshot(
  incidents: ImmuneIncident[],
): ImmuneRuntimeSnapshot {
  const decisions = incidents.map(buildImmuneDecision);
  return {
    implemented: true,
    incidentCount: incidents.length,
    barrierTriggerCount: decisions.filter((decision) => decision.barrierTriggered).length,
    repairQueueCount: decisions.filter((decision) => decision.repairAction !== null).length,
    decisions,
  };
}
