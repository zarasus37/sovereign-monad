export type ExecutionTruthStatus = 'blocked' | 'staged' | 'closed';

export interface ExecutionTruthPolicy {
  requirePhase1aLiveProof: boolean;
  requireBootstrapSourceRegistration: boolean;
  requireGuardedLiveProfile: boolean;
  requireGuardedLiveActivationDoc: boolean;
  requireOperatorRunbook: boolean;
  requireRuntimeArtifact: boolean;
  requireProviderStabilityImplementation: boolean;
  requireObservedGuardedLiveSession: boolean;
  requireReceiptTruthValidation: boolean;
  requireIncidentQueueClear: boolean;
}

export interface ExecutionTruthRecord {
  phase1aLiveProofRecorded: boolean;
  bootstrapSourceRegistered: boolean;
  observedGuardedLiveSession: boolean;
  receiptTruthValidated: boolean;
  incidentQueueClear: boolean;
  notes: string[];
}

export interface ExecutionTruthInput {
  runtimeArtifactReady: boolean;
  providerStabilityImplemented: boolean;
  guardedLiveProfileDefined: boolean;
  guardedLiveActivationDocumented: boolean;
  operatorRunbookDefined: boolean;
  proofRecord: ExecutionTruthRecord;
}

export interface ExecutionTruthSnapshot {
  implemented: true;
  status: ExecutionTruthStatus;
  phase1aLiveProofRecorded: boolean;
  bootstrapSourceRegistered: boolean;
  runtimeArtifactReady: boolean;
  providerStabilityImplemented: boolean;
  guardedLiveProfileDefined: boolean;
  guardedLiveActivationDocumented: boolean;
  operatorRunbookDefined: boolean;
  observedGuardedLiveSession: boolean;
  receiptTruthValidated: boolean;
  incidentQueueClear: boolean;
  blockers: string[];
  nextActions: string[];
  notes: string[];
}
