export type ActivationDecisionStatus = 'blocked' | 'review' | 'defer' | 'activate';
export type ActivationScope = 'none' | 'internal_review' | 'limited_private' | 'public';

export interface ActivationDecisionPolicy {
  schemaVersion: string;
  minimumWindowCountForReview: number;
  minimumWindowCountForActivation: number;
  requireExplicitDecisionRecord: true;
  allowPublicActivationWithoutStableBaseline: boolean;
}

export interface ActivationDecisionRecord {
  schemaVersion: string;
  present: boolean;
  approved: boolean;
  scope: ActivationScope;
  recordedBy: string | null;
  recordedAtMs: number | null;
  notes: string;
}

export interface ActivationDecisionInput {
  governance: {
    externalizationAllowed: boolean;
  };
  externalizationReadiness: {
    status: string;
  };
  rightsReview: {
    openCaseCount: number;
  };
  emergenceObservation: {
    readiness: string;
  };
  emergenceBaseline: {
    windowCount: number;
    baselineStatus: string;
  };
  emergenceAccumulation: {
    status: string;
    remainingWindowCount: number;
  };
}

export interface ActivationDecisionSnapshot {
  implemented: true;
  decisionDisciplineImplemented: true;
  structurallyEligible: boolean;
  activationAllowed: boolean;
  status: ActivationDecisionStatus;
  recommendedScope: ActivationScope;
  explicitDecisionPresent: boolean;
  reasons: string[];
  pendingActions: string[];
  checklist: string[];
  decisionRecord: ActivationDecisionRecord;
}
