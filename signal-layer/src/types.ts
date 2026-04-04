export type SignalDomain =
  | 'capital'
  | 'research'
  | 'exchange'
  | 'integrity'
  | 'operations'
  | 'narrative';

export type SignalSeverity = 'low' | 'medium' | 'high' | 'critical';
export type SignalLatency = 'slow' | 'normal' | 'urgent' | 'immediate';
export type SignalLane = 'fast' | 'slow';
export type SignalSource =
  | 'organ_runtime'
  | 'human_delegate'
  | 'operator'
  | 'system'
  | 'external';

export interface SignalEnvelope {
  id: string;
  domain: SignalDomain;
  source: SignalSource;
  severity: SignalSeverity;
  latency: SignalLatency;
  lane: SignalLane;
  summary: string;
  capitalSensitive: boolean;
  humanLinked: boolean;
  boundaryRelevant: boolean;
  tags: string[];
}

export interface SignalAggregateSnapshot {
  totalSignals: number;
  byDomain: Record<SignalDomain, number>;
  bySeverity: Record<SignalSeverity, number>;
  bySource: Record<SignalSource, number>;
  byLane: Record<SignalLane, number>;
  capitalSensitiveCount: number;
  humanLinkedCount: number;
  boundaryRelevantCount: number;
}

export interface SignalInterpretation {
  label:
    | 'coordination_pressure'
    | 'boundary_tension'
    | 'exchange_readiness'
    | 'capital_attention'
    | 'operator_load';
  level: 'stable' | 'elevated' | 'critical';
  reason: string;
}

export interface SignalLayerSnapshot {
  implemented: true;
  normalizedCount: number;
  aggregate: SignalAggregateSnapshot;
  interpretations: SignalInterpretation[];
}

export interface OrganRuntimeSignalLike {
  id: string;
  category: 'opportunity' | 'research' | 'narrative' | 'growth' | 'integrity' | 'operations';
  severity: SignalSeverity;
  latency: SignalLatency;
  summary: string;
  touchesCapital?: boolean;
  requiresExternalExpression?: boolean;
  tags?: string[];
}
