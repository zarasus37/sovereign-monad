export type BuilderCapability =
  | 'organ_runtime'
  | 'signal_layer'
  | 'oracle'
  | 'gnosis'
  | 'boundary_stress'
  | 'state_api'
  | 'dashboard';

export interface BuilderSummaryInput {
  localAnalysisOnly: true;
  implementedSurfaces: string[];
  deploymentBlockedByCapital: boolean;
  commercializationPosture: string;
  integrityStatus: string;
  escalationTier: string;
}

export interface BuilderRecipe {
  id: string;
  title: string;
  description: string;
  stage: 'local_analysis' | 'outward_expansion' | 'next_layer';
  requiredCapabilities: BuilderCapability[];
  outwardFacing: boolean;
  touchesCapital: boolean;
}

export interface BuilderDecision {
  id: string;
  title: string;
  ready: boolean;
  stage: BuilderRecipe['stage'];
  reasons: string[];
  nextActions: string[];
}

export interface BuilderPlan {
  implemented: true;
  localAnalysisOnly: true;
  capabilityMap: Record<BuilderCapability, boolean>;
  readyCount: number;
  blockedCount: number;
  decisions: BuilderDecision[];
}

export interface SharedStateSnapshot {
  summary: BuilderSummaryInput;
}
