export type EmergenceTier = 'causal_set' | 'full_field';

export type EmergenceClaimState =
  | 'evidence_insufficient'
  | 'candidate'
  | 'not_candidate';

export type PredictionScope = 'agent_behavioral' | 'organism_developmental';

export type PredictionOutcome = 'pending' | 'supported' | 'falsified' | 'inconclusive';

export type RetractionBasis =
  | 'evidence_invalidated'
  | 'causal_set_incomplete'
  | 'non_decomposability_failed'
  | 'independence_violation'
  | 'prediction_falsified'
  | 'ratification_error';

export type EmergenceNotificationSurface = 'historical_record' | 'narrative_read_path';

export interface EmergenceEventWindow {
  label: string;
  startTimestampMs: number;
  endTimestampMs: number;
  startBlockRef?: string;
  endBlockRef?: string;
}

export interface EmergenceStreamSnapshotRef {
  streamId: string;
  snapshotRef: string;
  versionRef?: string;
  summary?: string;
}

export interface ActiveOrganismSubsystemSnapshotRef {
  subsystemId: string;
  snapshotRef: string;
  outputRef: string;
  versionRef?: string;
  summary?: string;
}

export interface EmergenceEvidenceRef {
  evidenceId: string;
  surface: string;
  ref: string;
  summary: string;
}

export interface EmergenceCausalNecessityArgument {
  streamId: string;
  snapshotRef: string;
  necessityArgument: string;
}

export interface EmergenceFalsifiablePrediction {
  predictionStatement: string;
  predictionScope: PredictionScope;
  evaluationWindow: EmergenceEventWindow;
  falsificationCondition: string;
  confirmationCondition: string;
}

export interface CreateEmergenceClaimInput {
  claimId?: string;
  eventWindow: EmergenceEventWindow;
  candidateEventSummary: string;
  nonDecomposabilityBasis: string;
  metricEvidence: EmergenceEvidenceRef[];
  comprehensionalExplanation: string;
  falsifiablePrediction: EmergenceFalsifiablePrediction;
  observerPackageVersion: string;
  substrateSummaryRefs: EmergenceEvidenceRef[];
  streamsSampled: EmergenceStreamSnapshotRef[];
  metricSourceId: string;
  narrativeSourceId: string;
  metricGenerationPath: string;
  narrativeGenerationPath: string;
  createdAtMs?: number;
  createdBy: string;
  statusNotes?: string[];
}

export interface CreateCausalSetEmergenceClaimInput extends CreateEmergenceClaimInput {
  tier: 'causal_set';
  causalStreamSet: EmergenceStreamSnapshotRef[];
  causalNecessityArguments: EmergenceCausalNecessityArgument[];
  activeSubsystemSet?: never;
}

export interface CreateFullFieldEmergenceClaimInput extends CreateEmergenceClaimInput {
  tier: 'full_field';
  activeSubsystemSet: ActiveOrganismSubsystemSnapshotRef[];
  causalStreamSet?: never;
}

export type CreateAnyEmergenceClaimInput =
  | CreateCausalSetEmergenceClaimInput
  | CreateFullFieldEmergenceClaimInput;

export interface RejectEmergenceClaimInput {
  reason: string;
  changedAtMs?: number;
}

export interface PromoteEmergenceClaimInput {
  reason: string;
  changedAtMs?: number;
}

interface EmergenceClaimBase {
  localAnalysisOnly: true;
  claimId: string;
  tier: EmergenceTier;
  state: EmergenceClaimState;
  eventWindow: EmergenceEventWindow;
  candidateEventSummary: string;
  nonDecomposabilityBasis: string;
  metricEvidence: EmergenceEvidenceRef[];
  comprehensionalExplanation: string;
  falsifiablePrediction: EmergenceFalsifiablePrediction;
  observerPackageVersion: string;
  substrateSummaryRefs: EmergenceEvidenceRef[];
  streamsSampled: EmergenceStreamSnapshotRef[];
  metricSourceId: string;
  narrativeSourceId: string;
  metricGenerationPath: string;
  narrativeGenerationPath: string;
  createdAtMs: number;
  createdBy: string;
  lastStateChangeAtMs: number;
  statusNotes: string[];
}

export interface CausalSetEmergenceClaim extends EmergenceClaimBase {
  tier: 'causal_set';
  causalStreamSet: EmergenceStreamSnapshotRef[];
  causalNecessityArguments: EmergenceCausalNecessityArgument[];
  activeSubsystemSet?: never;
}

export interface FullFieldEmergenceClaim extends EmergenceClaimBase {
  tier: 'full_field';
  activeSubsystemSet: ActiveOrganismSubsystemSnapshotRef[];
  causalStreamSet?: never;
}

export type EmergenceClaim = CausalSetEmergenceClaim | FullFieldEmergenceClaim;

export interface RatifyEmergenceClaimInput {
  ratificationId?: string;
  ratifiedBy: string;
  ratifiedAtMs?: number;
  ratifierJustification: string;
  falsifiablePredictionEvaluation: string;
  notifiedSurfaces?: EmergenceNotificationSurface[];
}

export interface EmergenceRatificationRecord {
  localAnalysisOnly: true;
  ratificationId: string;
  claimId: string;
  ratifiedBy: string;
  ratifiedAtMs: number;
  ratifierJustification: string;
  falsifiablePredictionEvaluation: string;
  notifiedSurfaces: EmergenceNotificationSurface[];
}

export interface RecordPredictionEvaluationInput {
  evaluationId?: string;
  evaluatedBy: string;
  predictionOutcome: Exclude<PredictionOutcome, 'pending'>;
  evaluatedAtMs?: number;
  outcomeNotes?: string;
}

export interface EmergencePredictionEvaluationRecord {
  localAnalysisOnly: true;
  evaluationId: string;
  claimId: string;
  evaluatedBy: string;
  evaluatedAtMs: number;
  predictionOutcome: Exclude<PredictionOutcome, 'pending'>;
  outcomeNotes?: string;
}

export interface RetractEmergenceClaimInput {
  retractionId?: string;
  retractedBy: string;
  retractedAtMs?: number;
  retractionBasis: RetractionBasis;
  retractionDetail: string;
  notifiedSurfaces?: EmergenceNotificationSurface[];
}

export interface EmergenceRetractionRecord {
  localAnalysisOnly: true;
  retractionId: string;
  claimId: string;
  retractedBy: string;
  retractedAtMs: number;
  retractionBasis: RetractionBasis;
  retractionDetail: string;
  notifiedSurfaces: EmergenceNotificationSurface[];
}

export interface HistoricalEmergenceRecord {
  localAnalysisOnly: true;
  recordStatus: 'ratified' | 'retracted';
  claim: EmergenceClaim;
  ratification: EmergenceRatificationRecord;
  predictionEvaluation?: EmergencePredictionEvaluationRecord;
  retraction?: EmergenceRetractionRecord;
  readableBy: EmergenceNotificationSurface[];
}
