// hepar-core/types/hepar.types.ts

export type SymbolicResult = 'counterexample-found' | 'unknown/timeout' | 'proved-safe';

export interface ActionBand {
  band: 'BLOCK' | 'WARN' | 'ALLOW' | 'INVESTIGATE';
  score: number;
  confidence: number;
  escalationPath: string[];
}

export interface ActionBandResult {
  band: ActionBand['band'];
  reason: string;
  escalated: boolean;
}

export interface FindingVector {
  vectorId: string;
  vectorType: 'SYMBOLIC_INVARIANT' | 'AGENT_FINDING' | 'PATTERN_MATCH';
  severity: number;
  description: string;
  confidence: number;
}

export interface AttestationPayload {
  protocolId: string;
  decision: 'BLOCK' | 'ALLOW' | 'WARN' | 'INVESTIGATE';
  confidence: number;
  findings: FindingVector[];
  attestationTime: number;
  stageDConfig: string;
}
