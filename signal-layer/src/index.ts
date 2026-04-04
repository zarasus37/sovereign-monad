import { aggregateSignals } from './aggregator';
import { interpretAggregate } from './interpreter';
import { normalizeSignals } from './schema';
import {
  OrganRuntimeSignalLike,
  SignalAggregateSnapshot,
  SignalEnvelope,
  SignalInterpretation,
  SignalLayerSnapshot,
} from './types';

const SAMPLE_SIGNALS: OrganRuntimeSignalLike[] = [
  {
    id: 'sig-opportunity-001',
    category: 'opportunity',
    severity: 'high',
    latency: 'urgent',
    summary: 'Bounded capital-sensitive opportunity requires filtering and coordination.',
    touchesCapital: true,
    tags: ['defi', 'arbitrage'],
  },
  {
    id: 'sig-research-001',
    category: 'research',
    severity: 'medium',
    latency: 'normal',
    summary: 'Research brief requires synthesis and package preparation.',
    tags: ['research', 'brief'],
  },
  {
    id: 'sig-growth-001',
    category: 'growth',
    severity: 'medium',
    latency: 'normal',
    summary: 'Qualified inbound demand can move into exchange handling.',
    requiresExternalExpression: true,
    tags: ['lead', 'distribution'],
  },
  {
    id: 'sig-integrity-001',
    category: 'integrity',
    severity: 'high',
    latency: 'urgent',
    summary: 'Boundary-sensitive behavior needs review and containment.',
    tags: ['boundary', 'integrity'],
  },
];

export function buildSignalLayerSnapshot(
  signals: OrganRuntimeSignalLike[],
): SignalLayerSnapshot {
  const normalized = normalizeSignals(signals);
  const aggregate = aggregateSignals(normalized);
  const interpretations = interpretAggregate(aggregate);

  return {
    implemented: true,
    normalizedCount: normalized.length,
    aggregate,
    interpretations,
  };
}

export {
  aggregateSignals,
  interpretAggregate,
  normalizeSignals,
};

export type {
  OrganRuntimeSignalLike,
  SignalAggregateSnapshot,
  SignalEnvelope,
  SignalInterpretation,
  SignalLayerSnapshot,
};

function main() {
  const snapshot = buildSignalLayerSnapshot(SAMPLE_SIGNALS);
  process.stdout.write(`${JSON.stringify(snapshot, null, 2)}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    process.exitCode = 1;
  }
}
