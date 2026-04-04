export type StressLevel = 'stable' | 'elevated' | 'critical';
export type EscalationTier = 'tier0' | 'tier1' | 'tier2';

export interface StressSignalInput {
  coordinationPressure: StressLevel;
  boundaryTension: StressLevel;
  capitalAttention: StressLevel;
  operatorLoad: StressLevel;
}

export interface StressOracleInput {
  regime: 'defensive' | 'balanced' | 'offensive';
  deploymentPosture: 'observe' | 'paper' | 'bounded';
}

export interface StressGnosisInput {
  integrityStatus: 'clear' | 'review' | 'contain';
  hollowConvergenceRisk: 'low' | 'elevated' | 'critical';
  boundaryStress: StressLevel;
}

export interface StressMandateInput {
  gateCheckCount: number;
  participationBlockedCount: number;
}

export interface BoundaryStressInput {
  signal: StressSignalInput;
  oracle: StressOracleInput;
  gnosis: StressGnosisInput;
  mandate: StressMandateInput;
}

export interface BoundaryStressSnapshot {
  implemented: true;
  sheathPressure: StressLevel;
  turbulence: StressLevel;
  escalationTier: EscalationTier;
  reviewRequired: boolean;
  pauseSuggested: boolean;
  reasons: string[];
}
