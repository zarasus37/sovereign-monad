export interface EmergentPatternDefinition {
  id: string;
  minimumReadiness: 'insufficient' | 'forming' | 'observable';
  minimumAccumulation: 'collecting' | 'review_ready' | 'target_met';
  requiresIntegrity: 'clear' | 'watch' | 'contain';
  downstreamPath: string;
}

export interface EmergentProtocolInput {
  observation: {
    readiness: 'insufficient' | 'forming' | 'observable';
    evidenceWindow: string;
  };
  baseline: {
    baselineStatus: string;
    windowCount: number;
    readinessTrend: string;
  };
  accumulation: {
    status: 'collecting' | 'review_ready' | 'target_met';
    currentWindowCount: number;
    remainingWindowCount: number;
  };
  gnosis: {
    integrityStatus: 'clear' | 'watch' | 'contain' | string;
  };
  oracle: {
    regime: string;
  };
}

export interface EmergentProtocolCandidate {
  id: string;
  status: 'blocked' | 'candidate' | 'validated';
  reason: string;
  downstreamPath: string;
}

export interface EmergentProtocolSnapshot {
  implemented: true;
  observationOnly: true;
  patternCount: number;
  validatedPatternCount: number;
  validationStatus: 'forming' | 'review_ready' | 'validated';
  protocolCandidates: EmergentProtocolCandidate[];
  downstreamPath: string[];
  notes: string[];
}
