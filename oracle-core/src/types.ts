export type OracleLevel = 'stable' | 'elevated' | 'critical';
export type OracleRegime = 'defensive' | 'balanced' | 'offensive';
export type OracleDeploymentPosture = 'observe' | 'paper' | 'bounded';
export type OracleCommercializationPosture = 'internal_only' | 'pilot_ready' | 'buyer_ready';

export interface OracleDomainCounts {
  capital: number;
  research: number;
  exchange: number;
  integrity: number;
  operations: number;
  narrative: number;
}

export interface OracleSeverityCounts {
  low: number;
  medium: number;
  high: number;
  critical: number;
}

export interface OracleLaneCounts {
  fast: number;
  slow: number;
}

export interface OracleAggregateInput {
  totalSignals: number;
  byDomain: OracleDomainCounts;
  bySeverity: OracleSeverityCounts;
  byLane: OracleLaneCounts;
  capitalSensitiveCount: number;
  boundaryRelevantCount: number;
}

export interface OracleInterpretationInput {
  label:
    | 'coordination_pressure'
    | 'boundary_tension'
    | 'exchange_readiness'
    | 'capital_attention'
    | 'operator_load';
  level: OracleLevel;
}

export interface OracleInput {
  aggregate: OracleAggregateInput;
  interpretations: OracleInterpretationInput[];
  executionReadiness: 'blocked' | 'bounded' | 'ready';
}

export interface OracleSnapshot {
  implemented: true;
  regime: OracleRegime;
  confidence: 'low' | 'medium' | 'high';
  deploymentPosture: OracleDeploymentPosture;
  commercializationPosture: OracleCommercializationPosture;
  reasons: string[];
}
