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
  hepar?: {
    sampleOpportunities?: HeparOpportunity[];
  };
  cortex?: {
    sampleResearch?: CortexResearchItem[];
  };
  vox?: {
    sampleRequests?: VoxNarrativeRequest[];
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
  hepar?: HeparRuntimeSnapshot;
  cortex?: CortexRuntimeSnapshot;
  vox?: VoxRuntimeSnapshot;
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

export type RiskBand = 'low' | 'medium' | 'high';

export interface HeparOpportunity {
  id: string;
  venue: string;
  edgeBps: number;
  liquidityScore: number;
  counterpartyRisk: RiskBand;
  structuralRisk: RiskBand;
  opaque: boolean;
  exploitative: boolean;
  summary: string;
}

export interface HeparDecision {
  opportunityId: string;
  approved: boolean;
  score: number;
  reasons: string[];
}

export interface HeparRuntimeSnapshot {
  implemented: true;
  screenedCount: number;
  approvedCount: number;
  decisions: HeparDecision[];
}

export type CortexAudience = 'internal' | 'operators' | 'buyers' | 'external';

export interface CortexResearchItem {
  id: string;
  title: string;
  summary: string;
  confidence: RiskBand;
  urgency: SynapseLatencyClass;
  monetizable: boolean;
  audience: CortexAudience;
  recommendedOrgans?: OrganName[];
}

export interface CortexBrief {
  sourceId: string;
  title: string;
  thesis: string;
  targetAudience: CortexAudience;
  monetizable: boolean;
  recommendedNextAction: string;
}

export interface CortexRuntimeSnapshot {
  implemented: true;
  sourceCount: number;
  briefs: CortexBrief[];
}

export type VoxFormat = 'thread' | 'memo' | 'newsletter' | 'briefing';
export type VoxAudience = 'operators' | 'public' | 'buyers' | 'partners';

export interface VoxNarrativeRequest {
  id: string;
  sourceBriefId: string;
  format: VoxFormat;
  audience: VoxAudience;
  urgency: 'normal' | 'fast';
}

export interface VoxNarrativePackage {
  requestId: string;
  sourceBriefId: string;
  headline: string;
  channel: string;
  callToAction: string;
  summary: string;
}

export interface VoxRuntimeSnapshot {
  implemented: true;
  requestCount: number;
  packages: VoxNarrativePackage[];
}
