export interface DoveIntegrationInput {
  signal: {
    interpretations: Array<{ label: string; level: string }>;
  };
  oracle: {
    regime: string;
    deploymentPosture: string;
  };
  gnosis: {
    integrityStatus: string;
    hollowConvergenceRisk: string;
    boundaryStress: string;
  };
  boundaryStress: {
    escalationTier: string;
    pauseSuggested: boolean;
  };
}

export interface DoveSignalRoute {
  signal: string;
  destination: string;
}

export interface DoveIntegrationSnapshot {
  implemented: true;
  localAnalysisOnly: true;
  deployed: false;
  observerStatus: 'local_ready';
  driftStatus: 'stable' | 'watch' | 'contain';
  signalCount: number;
  routes: DoveSignalRoute[];
  recommendedActions: string[];
  blockedBy: string[];
}
