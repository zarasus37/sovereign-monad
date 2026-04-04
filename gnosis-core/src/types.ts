export type GnosisLevel = 'stable' | 'elevated' | 'critical';
export type DecompressionStatus = 'authentic_tendency' | 'mixed' | 'at_risk';
export type HollowConvergenceRisk = 'low' | 'elevated' | 'critical';
export type IntegrityStatus = 'clear' | 'review' | 'contain';

export interface GnosisSignalPosture {
  byDomain: {
    capital: number;
    research: number;
    exchange: number;
    integrity: number;
    operations: number;
    narrative: number;
  };
  interpretations: Array<{
    label:
      | 'coordination_pressure'
      | 'boundary_tension'
      | 'exchange_readiness'
      | 'capital_attention'
      | 'operator_load';
    level: GnosisLevel;
  }>;
}

export interface GnosisOraclePosture {
  regime: 'defensive' | 'balanced' | 'offensive';
  confidence: 'low' | 'medium' | 'high';
  deploymentPosture: 'observe' | 'paper' | 'bounded';
  commercializationPosture: 'internal_only' | 'pilot_ready' | 'buyer_ready';
}

export interface GnosisParticipationPosture {
  actorCount: number;
  blockedDecisionCount: number;
  operatorOverrideCount: number;
}

export interface GnosisMandatePosture {
  title: string;
  gateCheckCount: number;
}

export interface GnosisInput {
  signal: GnosisSignalPosture;
  oracle: GnosisOraclePosture;
  participation: GnosisParticipationPosture;
  mandate: GnosisMandatePosture;
}

export interface GnosisSnapshot {
  implemented: true;
  retrospectiveOnly: true;
  integrityStatus: IntegrityStatus;
  decompressionStatus: DecompressionStatus;
  hollowConvergenceRisk: HollowConvergenceRisk;
  boundaryStress: GnosisLevel;
  reviewFlags: string[];
  reasons: string[];
}
