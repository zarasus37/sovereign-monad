export type PublicActivationStatus =
  | 'blocked'
  | 'private_ready'
  | 'public_review'
  | 'active';

export interface PublicActivationPolicy {
  requireExecutionTruthStatus: 'blocked' | 'staged' | 'closed';
  requireCardiaStatus: 'blocked' | 'ready_for_funding' | 'staged' | 'ready_for_guarded_live' | 'active';
  allowPrivateLicensedBeforePublic: boolean;
  requireLicensedDeploymentDoc: boolean;
  requireGuardedLiveActivationDoc: boolean;
  requireOperatorRunbook: boolean;
  requireDataProductPrepared: boolean;
  requireNarrativeSurface: boolean;
}

export interface PublicActivationRecord {
  productionInfraConfigured: boolean;
  licensedPrivatePathValidated: boolean;
  operatorMonitoringReady: boolean;
  publicSurfaceReady: boolean;
  activationApproved: boolean;
  publicActivationLive: boolean;
  notes: string[];
}

export interface PublicActivationInput {
  phase1aLiveProofRecorded: boolean;
  executionTruthStatus: 'blocked' | 'staged' | 'closed';
  cardiaActivationStatus: 'blocked' | 'ready_for_funding' | 'staged' | 'ready_for_guarded_live' | 'active';
  dataProductStatus: string;
  narrativeStatus: string;
  licensedDeploymentDoc: boolean;
  guardedLiveActivationDoc: boolean;
  operatorRunbookDoc: boolean;
  record: PublicActivationRecord;
}

export interface PublicActivationSnapshot {
  implemented: true;
  status: PublicActivationStatus;
  phase1aLiveProofRecorded: boolean;
  executionTruthStatus: 'blocked' | 'staged' | 'closed';
  cardiaActivationStatus: 'blocked' | 'ready_for_funding' | 'staged' | 'ready_for_guarded_live' | 'active';
  dataProductStatus: string;
  narrativeStatus: string;
  productionInfraConfigured: boolean;
  licensedPrivatePathValidated: boolean;
  operatorMonitoringReady: boolean;
  publicSurfaceReady: boolean;
  activationApproved: boolean;
  publicActivationLive: boolean;
  blockers: string[];
  nextActions: string[];
  notes: string[];
}
