export type ExternalizationReadinessStatus = 'blocked' | 'conditional' | 'ready';

export interface ExternalizationReadinessInput {
  governance: {
    thresholdsMet: boolean;
    externalizationAllowed: boolean;
  };
  rightsReview: {
    blockedCount: number;
    manualReviewCount: number;
    conditionalCount: number;
  };
  gnosis: {
    integrityStatus: string;
  };
  boundaryStress: {
    escalationTier: string;
    pauseSuggested: boolean;
  };
  emergenceObservation: {
    readiness: string;
  };
}

export interface ExternalizationReadinessSnapshot {
  implemented: true;
  status: ExternalizationReadinessStatus;
  blockers: string[];
  checklist: string[];
}
