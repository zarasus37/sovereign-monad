export interface DataProductBundle {
  id: string;
  audience: string;
  requiresExplicitActivation: boolean;
  rightsClass: 'internal_only' | 'derived_safe' | 'external_sensitive';
  recommendedScope: 'none' | 'limited_private' | 'public';
  productTier?: string;
  priceModel?: string;
  revenueBand?: string;
  producingOrgans?: string[];
}

export interface DataProductInput {
  governance: {
    externalizationAllowed: boolean;
  };
  rightsReview: {
    openCaseCount: number;
    blockedCount: number;
  };
  readiness: {
    status: string;
  };
  activationDecision: {
    status: string;
    explicitDecisionPresent: boolean;
    recommendedScope: string;
    activationAllowed: boolean;
  };
}

export interface DataProductEvaluation {
  bundleId: string;
  status: 'available_local' | 'blocked';
  reason: string;
}

export interface DataProductSnapshot {
  implemented: true;
  localAnalysisOnly: true;
  productizationStatus: 'prepared' | 'blocked';
  externalActivationLive: false;
  recommendedScope: string;
  availableBundles: DataProductEvaluation[];
  blockedBundles: DataProductEvaluation[];
  blockers: string[];
}
