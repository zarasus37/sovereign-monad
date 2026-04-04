export type KeyActivationClass =
  | 'ecosystem_native'
  | 'delegated_human'
  | 'operator_review'
  | 'user_linked';

export type KeyScope =
  | 'runtime.observe'
  | 'signal.route'
  | 'builder.compose'
  | 'dashboard.view'
  | 'research.read'
  | 'operator.review'
  | 'identity.link'
  | 'keys.activate'
  | 'capital.touch'
  | 'boundary.override';

export interface KeyActivationRequest {
  id: string;
  subjectId: string;
  activationClass: KeyActivationClass;
  requestedScopes: KeyScope[];
  nftRequired: boolean;
  delegateAgentPresent: boolean;
}

export interface KeyDecision {
  requestId: string;
  subjectId: string;
  approved: boolean;
  activationMode: 'local_scaffold' | 'review' | 'blocked';
  grantedScopes: KeyScope[];
  blockedScopes: Array<{ scope: KeyScope; reason: string }>;
  reasons: string[];
}

export interface KeyLayerSnapshot {
  implemented: true;
  localAnalysisOnly: true;
  nftInfrastructureLive: false;
  requestCount: number;
  approvedCount: number;
  decisions: KeyDecision[];
}
