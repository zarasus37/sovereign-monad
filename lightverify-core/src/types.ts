export type LightVerifyAssessmentState = 'pending_review';

export type LightVerifyDisposition =
  | 'certified'
  | 'insufficient_evidence'
  | 'restricted'
  | 'rejected';

export type LightVerifyCommercialClass =
  | 'lightverified'
  | 'observed'
  | 'restricted'
  | 'rejected';

export type LightVerifyNotificationSurface =
  | 'historical_record'
  | 'data_product_bundle'
  | 'narrative_read_path';

export type LightVerifySubjectType =
  | 'behavior_window'
  | 'dataset_bundle'
  | 'research_bundle'
  | 'signal_digest';

export type DeidentificationResidualRisk = 'low' | 'medium' | 'high';

export type LightVerifyRevocationBasis =
  | 'evidence_invalidated'
  | 'rights_changed'
  | 'deidentification_failed'
  | 'integrity_reassessment'
  | 'issuance_error';

export interface LightVerifyEvidenceRef {
  evidenceId: string;
  surface: string;
  ref: string;
  summary: string;
}

export interface LightVerifySourceRef {
  sourceId: string;
  surface: string;
  ref: string;
  summary: string;
}

export interface LightVerifyDeidentificationRecord {
  piiRemoved: boolean;
  transformVersion: string;
  residualRisk: DeidentificationResidualRisk;
  note: string;
}

export interface LightVerifyInternalScorecard {
  provenanceScore: number;
  coherenceScore: number;
  deidentificationScore: number;
  rightsReadinessScore: number;
  scoreNotes?: string[];
}

export interface CreateLightVerifyAssessmentInput {
  assessmentId?: string;
  subjectId: string;
  subjectType: LightVerifySubjectType;
  bundleSummary: string;
  licensingIntent: string;
  sourceRefs: LightVerifySourceRef[];
  doveEvidence: LightVerifyEvidenceRef[];
  gnosisEvidence: LightVerifyEvidenceRef[];
  rightsEvidence: LightVerifyEvidenceRef[];
  deidentificationRecord: LightVerifyDeidentificationRecord;
  internalScorecard: LightVerifyInternalScorecard;
  createdBy: string;
  createdAtMs?: number;
  statusNotes?: string[];
}

export interface LightVerifyAssessment {
  localAnalysisOnly: true;
  assessmentId: string;
  state: LightVerifyAssessmentState;
  subjectId: string;
  subjectType: LightVerifySubjectType;
  bundleSummary: string;
  licensingIntent: string;
  sourceRefs: LightVerifySourceRef[];
  doveEvidence: LightVerifyEvidenceRef[];
  gnosisEvidence: LightVerifyEvidenceRef[];
  rightsEvidence: LightVerifyEvidenceRef[];
  deidentificationRecord: LightVerifyDeidentificationRecord;
  internalScorecard: LightVerifyInternalScorecard;
  createdBy: string;
  createdAtMs: number;
  lastStateChangeAtMs: number;
  statusNotes: string[];
}

export interface IssueLightVerifyDecisionInput {
  decisionId?: string;
  decidedBy: string;
  decidedAtMs?: number;
  disposition: LightVerifyDisposition;
  justification: string;
  publicSummary: string;
  notifiedSurfaces?: LightVerifyNotificationSurface[];
}

export interface LightVerifyDecisionRecord {
  localAnalysisOnly: true;
  decisionId: string;
  assessmentId: string;
  disposition: LightVerifyDisposition;
  commercialClass: LightVerifyCommercialClass;
  publicMarkEligible: boolean;
  sealLabel?: 'LightVerified';
  decidedBy: string;
  decidedAtMs: number;
  justification: string;
  publicSummary: string;
  notifiedSurfaces: LightVerifyNotificationSurface[];
}

export interface RevokeLightVerifyInput {
  revocationId?: string;
  revokedBy: string;
  revokedAtMs?: number;
  basis: LightVerifyRevocationBasis;
  detail: string;
  notifiedSurfaces?: LightVerifyNotificationSurface[];
}

export interface LightVerifyRevocationRecord {
  localAnalysisOnly: true;
  revocationId: string;
  assessmentId: string;
  revokedBy: string;
  revokedAtMs: number;
  basis: LightVerifyRevocationBasis;
  detail: string;
  notifiedSurfaces: LightVerifyNotificationSurface[];
}

export interface LightVerifyPublicDisclosure {
  localAnalysisOnly: true;
  assessmentId: string;
  commercialClass: LightVerifyCommercialClass;
  publicMarkEligible: boolean;
  sealLabel?: 'LightVerified';
  marketingClaim: string;
  caveats: string[];
  generatedAtMs: number;
}

export interface HistoricalLightVerifyRecord {
  localAnalysisOnly: true;
  recordStatus: 'active' | 'revoked';
  assessment: LightVerifyAssessment;
  decision: LightVerifyDecisionRecord;
  publicDisclosure: LightVerifyPublicDisclosure;
  revocation?: LightVerifyRevocationRecord;
  readableBy: LightVerifyNotificationSurface[];
}

export interface LightVerifySnapshot {
  implemented: true;
  localAnalysisOnly: true;
  certificationModel: 'binary_public_mark_with_internal_scorecard';
  runtimeExecutionGating: false;
  publicRatingLadder: false;
  historicalRecordOnly: true;
  posture: 'prepared' | 'blocked';
  certifiedRecordCount: number;
  observedRecordCount: number;
  restrictedRecordCount: number;
  rejectedRecordCount: number;
  revokedRecordCount: number;
  summary: string;
}
