export type ExpansionCapability =
  | 'organ_runtime'
  | 'signal_layer'
  | 'oracle'
  | 'gnosis'
  | 'boundary_stress'
  | 'state_api'
  | 'dashboard';

export interface ExpansionPolicy {
  allowLocalInternalExpansionDuringStress: boolean;
  requireIntegrityClearForOutwardExpansion: boolean;
  requireTier0ForOutwardExpansion: boolean;
  blockCapitalExpansionWhenDeploymentBlocked: boolean;
}

export interface ExpansionSummaryInput {
  localAnalysisOnly: true;
  deploymentBlockedByCapital: boolean;
  commercializationPosture: string;
  integrityStatus: string;
  escalationTier: string;
}

export interface ExpansionRequest {
  id: string;
  title: string;
  category: 'internal_surface' | 'buyer_surface' | 'capital_activation' | 'identity_surface';
  localOnly: boolean;
  outwardFacing: boolean;
  touchesCapital: boolean;
  requiredCapabilities: ExpansionCapability[];
}

export interface ExpansionDecision {
  implemented: true;
  requestId: string;
  approved: boolean;
  mode: 'allow' | 'review' | 'block';
  reasons: string[];
  requiredActions: string[];
}
