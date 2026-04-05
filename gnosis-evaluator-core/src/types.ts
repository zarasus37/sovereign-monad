export interface GnosisEvaluationInput {
  organs: Array<{
    name: string;
    zeroCapitalReady: boolean;
    capitalRequired: boolean;
    blockedReasons: string[];
  }>;
  gnosis: {
    integrityStatus: string;
  };
  oracle: {
    deploymentPosture: string;
  };
  boundaryStress: {
    escalationTier: string;
  };
}

export interface OrganIntegrityScore {
  organ: string;
  score: number;
  posture: 'clear' | 'watch' | 'contain';
  reasons: string[];
}

export interface GnosisEvaluationSnapshot {
  implemented: true;
  localAnalysisOnly: true;
  evaluationMechanicsImplemented: true;
  overallScore: number;
  posture: 'clear' | 'watch' | 'contain';
  organScores: OrganIntegrityScore[];
  reviewReasons: string[];
}
