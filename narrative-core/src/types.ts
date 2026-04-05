export interface NarrativeInput {
  organRuntime: {
    readyOrgans: string[];
    capitalGatedOrgans: string[];
  };
  oracle: {
    regime: string;
    deploymentPosture: string;
    commercializationPosture: string;
  };
  gnosis: {
    integrityStatus: string;
  };
  governance: {
    externalizationAllowed: boolean;
  };
  activationDecision: {
    status: string;
    recommendedScope: string;
    explicitDecisionPresent: boolean;
  };
}

export interface NarrativeArtifact {
  id: string;
  format: 'internal_memo' | 'operator_brief' | 'public_pulse';
  audience: string;
  status: 'ready_local' | 'bounded_review';
}

export interface NarrativeSnapshot {
  implemented: true;
  localAnalysisOnly: true;
  infrastructureStatus: 'local_ready';
  publicSurfaceStatus: 'internal_surface_ready' | 'bounded_review';
  deploymentLive: false;
  headline: string;
  internalMemo: string;
  publicPulse: string;
  distributionTargets: string[];
  blockers: string[];
  artifacts: NarrativeArtifact[];
}
