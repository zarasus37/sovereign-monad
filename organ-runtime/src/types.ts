export type OrganName =
  | 'Cardia'
  | 'Pneuma'
  | 'Hepar'
  | 'Cortex'
  | 'Synapse'
  | 'Vox';

export type RuntimeMode = 'analysis' | 'paper' | 'live';

export interface OrganDefinition {
  name: OrganName;
  biologicalAnalog: string;
  ecosystemRole: string;
  primaryOutput: string;
  dependencies: OrganName[];
  capitalRequired: boolean;
}

export interface OrganRuntimeUnitConfig {
  enabled: boolean;
  capitalRequired: boolean;
  buildReady: boolean;
  notes: string[];
}

export interface OrganRuntimeConfig {
  runtimeMode: RuntimeMode;
  organs: Record<OrganName, OrganRuntimeUnitConfig>;
  coordination: {
    primaryLoop: OrganName[];
    allowCapitalGatedOrgansInAnalysis: boolean;
  };
  synapse?: {
    sampleSignals?: SynapseSignal[];
  };
}

export interface OrganSnapshot {
  name: OrganName;
  biologicalAnalog: string;
  ecosystemRole: string;
  primaryOutput: string;
  enabled: boolean;
  buildReady: boolean;
  capitalRequired: boolean;
  zeroCapitalReady: boolean;
  blockedReasons: string[];
}

export interface OrganRuntimeSnapshot {
  runtimeMode: RuntimeMode;
  zeroCapitalBuildQueue: OrganName[];
  capitalGatedQueue: OrganName[];
  coordinationLoop: OrganName[];
  organs: OrganSnapshot[];
  synapse?: SynapseRuntimeSnapshot;
}

export type SynapseSignalCategory =
  | 'opportunity'
  | 'research'
  | 'narrative'
  | 'growth'
  | 'integrity'
  | 'operations';

export type SynapseSignalSeverity = 'low' | 'medium' | 'high' | 'critical';

export type SynapseLatencyClass = 'slow' | 'normal' | 'urgent' | 'immediate';

export interface SynapseSignal {
  id: string;
  category: SynapseSignalCategory;
  severity: SynapseSignalSeverity;
  latency: SynapseLatencyClass;
  summary: string;
  touchesCapital?: boolean;
  requiresExternalExpression?: boolean;
  tags?: string[];
}

export interface SynapseRouteDecision {
  signalId: string;
  primaryTarget: OrganName;
  supportingTargets: OrganName[];
  justification: string;
  fastPath: boolean;
}

export interface SynapseRuntimeSnapshot {
  implemented: true;
  sampleSignalCount: number;
  routeDecisions: SynapseRouteDecision[];
}
