import {
  SignalAggregateSnapshot,
  SignalDomain,
  SignalEnvelope,
  SignalLane,
  SignalSeverity,
  SignalSource,
} from './types';

function initCountMap<T extends string>(keys: readonly T[]): Record<T, number> {
  return keys.reduce(
    (acc, key) => {
      acc[key] = 0;
      return acc;
    },
    {} as Record<T, number>,
  );
}

const DOMAINS = ['capital', 'research', 'exchange', 'integrity', 'operations', 'narrative'] as const satisfies readonly SignalDomain[];
const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const satisfies readonly SignalSeverity[];
const SOURCES = ['organ_runtime', 'human_delegate', 'operator', 'system', 'external'] as const satisfies readonly SignalSource[];
const LANES = ['fast', 'slow'] as const satisfies readonly SignalLane[];

export function aggregateSignals(signals: SignalEnvelope[]): SignalAggregateSnapshot {
  const byDomain = initCountMap(DOMAINS);
  const bySeverity = initCountMap(SEVERITIES);
  const bySource = initCountMap(SOURCES);
  const byLane = initCountMap(LANES);

  for (const signal of signals) {
    byDomain[signal.domain] += 1;
    bySeverity[signal.severity] += 1;
    bySource[signal.source] += 1;
    byLane[signal.lane] += 1;
  }

  return {
    totalSignals: signals.length,
    byDomain,
    bySeverity,
    bySource,
    byLane,
    capitalSensitiveCount: signals.filter((signal) => signal.capitalSensitive).length,
    humanLinkedCount: signals.filter((signal) => signal.humanLinked).length,
    boundaryRelevantCount: signals.filter((signal) => signal.boundaryRelevant).length,
  };
}
