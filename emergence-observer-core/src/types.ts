export type MarkerLevel = 'absent' | 'partial' | 'present';
export type ObservationReadiness = 'insufficient' | 'forming' | 'observable';

export interface EmergenceRuntimeInput {
  organCount: number;
  orchestrationPhaseCount: number;
  mandateSequenceCount: number;
  participationActorCount: number;
}

export interface EmergenceSignalInput {
  normalizedCount: number;
  interpretationCount: number;
}

export interface EmergenceOracleInput {
  deploymentPosture: string;
  commercializationPosture: string;
}

export interface EmergenceGnosisInput {
  integrityStatus: string;
  hollowConvergenceRisk: string;
}

export interface EmergenceDataRailInput {
  normalizedCount: number;
  rewardEligibleCount: number;
}

export interface EmergenceGovernanceInput {
  thresholdsDefined: boolean;
  thresholdsMet: boolean;
  externalizationAllowed: boolean;
}

export interface EmergenceObservationInput {
  runtime: EmergenceRuntimeInput;
  signal: EmergenceSignalInput;
  oracle: EmergenceOracleInput;
  gnosis: EmergenceGnosisInput;
  dataRail: EmergenceDataRailInput;
  governance: EmergenceGovernanceInput;
}

export interface EmergenceMarkerAssessment {
  marker: string;
  level: MarkerLevel;
  reasons: string[];
}

export interface EmergenceObservationSnapshot {
  implemented: true;
  observationOnly: true;
  emergenceClaimed: false;
  readiness: ObservationReadiness;
  evidenceWindow: 'seed' | 'forming' | 'extended';
  markers: EmergenceMarkerAssessment[];
  blockedBy: string[];
  nextCollectionTargets: string[];
}
