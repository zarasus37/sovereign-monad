import { OrganRuntimeSignalLike, SignalDomain, SignalEnvelope, SignalSource } from './types';

function deriveDomain(signal: OrganRuntimeSignalLike): SignalDomain {
  switch (signal.category) {
    case 'opportunity':
      return signal.touchesCapital ? 'capital' : 'exchange';
    case 'research':
      return 'research';
    case 'narrative':
      return 'narrative';
    case 'growth':
      return 'exchange';
    case 'integrity':
      return 'integrity';
    case 'operations':
      return 'operations';
  }
}

function deriveSource(signal: OrganRuntimeSignalLike): SignalSource {
  if (signal.category === 'operations') return 'operator';
  if (signal.category === 'research' || signal.category === 'narrative') return 'organ_runtime';
  if (signal.category === 'growth') return 'external';
  return 'system';
}

export function normalizeSignal(signal: OrganRuntimeSignalLike): SignalEnvelope {
  return {
    id: signal.id,
    domain: deriveDomain(signal),
    source: deriveSource(signal),
    severity: signal.severity,
    latency: signal.latency,
    lane: signal.latency === 'urgent' || signal.latency === 'immediate' ? 'fast' : 'slow',
    summary: signal.summary,
    capitalSensitive: Boolean(signal.touchesCapital),
    humanLinked: signal.category === 'growth' || signal.category === 'operations',
    boundaryRelevant: signal.category === 'integrity' || signal.category === 'operations',
    tags: signal.tags || [],
  };
}

export function normalizeSignals(signals: OrganRuntimeSignalLike[]): SignalEnvelope[] {
  return signals.map(normalizeSignal);
}
