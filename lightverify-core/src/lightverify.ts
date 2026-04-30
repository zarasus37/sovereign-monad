import { randomUUID } from 'crypto';
import type {
  CreateLightVerifyAssessmentInput,
  HistoricalLightVerifyRecord,
  IssueLightVerifyDecisionInput,
  LightVerifyAssessment,
  LightVerifyCommercialClass,
  LightVerifyDecisionRecord,
  LightVerifyDeidentificationRecord,
  LightVerifyEvidenceRef,
  LightVerifyInternalScorecard,
  LightVerifyNotificationSurface,
  LightVerifyPublicDisclosure,
  LightVerifyRevocationRecord,
  LightVerifySnapshot,
  LightVerifySourceRef,
  RevokeLightVerifyInput,
} from './types';

const ALLOWED_NOTIFICATION_SURFACES: LightVerifyNotificationSurface[] = [
  'historical_record',
  'data_product_bundle',
  'narrative_read_path',
];

function cloneEvidenceRef(ref: LightVerifyEvidenceRef): LightVerifyEvidenceRef {
  return { ...ref };
}

function cloneSourceRef(ref: LightVerifySourceRef): LightVerifySourceRef {
  return { ...ref };
}

function cloneDeidentificationRecord(
  record: LightVerifyDeidentificationRecord,
): LightVerifyDeidentificationRecord {
  return { ...record };
}

function cloneInternalScorecard(scorecard: LightVerifyInternalScorecard): LightVerifyInternalScorecard {
  return {
    ...scorecard,
    scoreNotes: scorecard.scoreNotes ? [...scorecard.scoreNotes] : undefined,
  };
}

function cloneAssessment(assessment: LightVerifyAssessment): LightVerifyAssessment {
  return {
    ...assessment,
    sourceRefs: assessment.sourceRefs.map(cloneSourceRef),
    doveEvidence: assessment.doveEvidence.map(cloneEvidenceRef),
    gnosisEvidence: assessment.gnosisEvidence.map(cloneEvidenceRef),
    rightsEvidence: assessment.rightsEvidence.map(cloneEvidenceRef),
    deidentificationRecord: cloneDeidentificationRecord(assessment.deidentificationRecord),
    internalScorecard: cloneInternalScorecard(assessment.internalScorecard),
    statusNotes: [...assessment.statusNotes],
  };
}

function mapDispositionToCommercialClass(
  disposition: LightVerifyDecisionRecord['disposition'],
): LightVerifyCommercialClass {
  switch (disposition) {
    case 'certified':
      return 'lightverified';
    case 'insufficient_evidence':
      return 'observed';
    case 'restricted':
      return 'restricted';
    case 'rejected':
      return 'rejected';
  }
}

function validateNonEmptyArray<T>(items: T[], label: string) {
  if (items.length === 0) {
    throw new Error(`${label} must contain at least one entry.`);
  }
}

function validateScore(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0 || value > 100) {
    throw new Error(`${label} must be a finite score between 0 and 100.`);
  }
}

function validateNotificationSurfaces(
  surfaces: LightVerifyNotificationSurface[],
): LightVerifyNotificationSurface[] {
  if (surfaces.length === 0) {
    throw new Error('At least one LightVerify notification surface is required.');
  }

  const unique = Array.from(new Set(surfaces));
  for (const surface of unique) {
    if (!ALLOWED_NOTIFICATION_SURFACES.includes(surface)) {
      throw new Error(`Notification surface ${surface} is not allowed.`);
    }
  }
  if (!unique.includes('historical_record')) {
    throw new Error('historical_record notification is required.');
  }

  return unique;
}

function createDisclosure(
  assessment: LightVerifyAssessment,
  decision: LightVerifyDecisionRecord,
): LightVerifyPublicDisclosure {
  if (decision.disposition === 'certified') {
    return {
      localAnalysisOnly: true,
      assessmentId: assessment.assessmentId,
      commercialClass: decision.commercialClass,
      publicMarkEligible: true,
      sealLabel: 'LightVerified',
      marketingClaim: `LightVerified: ${decision.publicSummary}`,
      caveats: [
        'The public seal is binary and does not expose internal scoring.',
        'This certification is a commercial provenance artifact, not a runtime execution permission.',
      ],
      generatedAtMs: decision.decidedAtMs,
    };
  }

  const classLabel =
    decision.commercialClass === 'observed'
      ? 'Observed'
      : decision.commercialClass === 'restricted'
        ? 'Restricted'
        : 'Rejected';

  return {
    localAnalysisOnly: true,
    assessmentId: assessment.assessmentId,
    commercialClass: decision.commercialClass,
    publicMarkEligible: false,
    marketingClaim: `${classLabel}: ${decision.publicSummary}`,
    caveats: [
      'This bundle is not LightVerified.',
      'Any lower commercial class must remain separate from the LightVerified public seal.',
    ],
    generatedAtMs: decision.decidedAtMs,
  };
}

function validateCertifiedAssessment(assessment: LightVerifyAssessment) {
  if (!assessment.deidentificationRecord.piiRemoved) {
    throw new Error('Certified LightVerify records require PII removal.');
  }
  if (assessment.deidentificationRecord.residualRisk === 'high') {
    throw new Error('Certified LightVerify records cannot carry high residual de-identification risk.');
  }
}

export function createLightVerifyAssessment(
  input: CreateLightVerifyAssessmentInput,
): LightVerifyAssessment {
  validateNonEmptyArray(input.sourceRefs, 'sourceRefs');
  validateNonEmptyArray(input.doveEvidence, 'doveEvidence');
  validateNonEmptyArray(input.gnosisEvidence, 'gnosisEvidence');
  validateNonEmptyArray(input.rightsEvidence, 'rightsEvidence');
  validateScore(input.internalScorecard.provenanceScore, 'provenanceScore');
  validateScore(input.internalScorecard.coherenceScore, 'coherenceScore');
  validateScore(input.internalScorecard.deidentificationScore, 'deidentificationScore');
  validateScore(input.internalScorecard.rightsReadinessScore, 'rightsReadinessScore');

  const createdAtMs = input.createdAtMs ?? Date.now();
  return {
    localAnalysisOnly: true,
    assessmentId: input.assessmentId ?? randomUUID(),
    state: 'pending_review',
    subjectId: input.subjectId,
    subjectType: input.subjectType,
    bundleSummary: input.bundleSummary,
    licensingIntent: input.licensingIntent,
    sourceRefs: input.sourceRefs.map(cloneSourceRef),
    doveEvidence: input.doveEvidence.map(cloneEvidenceRef),
    gnosisEvidence: input.gnosisEvidence.map(cloneEvidenceRef),
    rightsEvidence: input.rightsEvidence.map(cloneEvidenceRef),
    deidentificationRecord: cloneDeidentificationRecord(input.deidentificationRecord),
    internalScorecard: cloneInternalScorecard(input.internalScorecard),
    createdBy: input.createdBy,
    createdAtMs,
    lastStateChangeAtMs: createdAtMs,
    statusNotes: [...(input.statusNotes ?? [])],
  };
}

export function issueLightVerifyDecision(
  assessment: LightVerifyAssessment,
  input: IssueLightVerifyDecisionInput,
): LightVerifyDecisionRecord {
  if (assessment.state !== 'pending_review') {
    throw new Error(`Cannot issue LightVerify decision from assessment state ${assessment.state}.`);
  }

  if (input.disposition === 'certified') {
    validateCertifiedAssessment(assessment);
  }

  const notifiedSurfaces = validateNotificationSurfaces(
    input.notifiedSurfaces ?? ['historical_record'],
  );
  const commercialClass = mapDispositionToCommercialClass(input.disposition);
  const publicMarkEligible = input.disposition === 'certified';

  return {
    localAnalysisOnly: true,
    decisionId: input.decisionId ?? randomUUID(),
    assessmentId: assessment.assessmentId,
    disposition: input.disposition,
    commercialClass,
    publicMarkEligible,
    sealLabel: publicMarkEligible ? 'LightVerified' : undefined,
    decidedBy: input.decidedBy,
    decidedAtMs: input.decidedAtMs ?? Date.now(),
    justification: input.justification,
    publicSummary: input.publicSummary,
    notifiedSurfaces,
  };
}

export function revokeLightVerifyCertification(
  assessment: LightVerifyAssessment,
  decision: LightVerifyDecisionRecord,
  input: RevokeLightVerifyInput,
): LightVerifyRevocationRecord {
  if (decision.assessmentId !== assessment.assessmentId) {
    throw new Error('LightVerify decision does not match the supplied assessment.');
  }
  if (decision.disposition !== 'certified') {
    throw new Error('Only certified LightVerify decisions can be revoked.');
  }

  const notifiedSurfaces = validateNotificationSurfaces(
    input.notifiedSurfaces ?? decision.notifiedSurfaces,
  );

  return {
    localAnalysisOnly: true,
    revocationId: input.revocationId ?? randomUUID(),
    assessmentId: assessment.assessmentId,
    revokedBy: input.revokedBy,
    revokedAtMs: input.revokedAtMs ?? Date.now(),
    basis: input.basis,
    detail: input.detail,
    notifiedSurfaces,
  };
}

export function buildHistoricalLightVerifyRecord(
  assessment: LightVerifyAssessment,
  decision: LightVerifyDecisionRecord,
  revocation?: LightVerifyRevocationRecord,
): HistoricalLightVerifyRecord {
  if (decision.assessmentId !== assessment.assessmentId) {
    throw new Error('LightVerify decision does not match the supplied assessment.');
  }
  if (revocation && revocation.assessmentId !== assessment.assessmentId) {
    throw new Error('LightVerify revocation does not match the supplied assessment.');
  }

  const disclosure = createDisclosure(assessment, decision);
  return {
    localAnalysisOnly: true,
    recordStatus: revocation ? 'revoked' : 'active',
    assessment: cloneAssessment(assessment),
    decision: {
      ...decision,
      notifiedSurfaces: [...decision.notifiedSurfaces],
    },
    publicDisclosure: disclosure,
    revocation: revocation
      ? {
          ...revocation,
          notifiedSurfaces: [...revocation.notifiedSurfaces],
        }
      : undefined,
    readableBy: [...decision.notifiedSurfaces],
  };
}

export function buildLightVerifySnapshot(
  records: HistoricalLightVerifyRecord[],
): LightVerifySnapshot {
  const certifiedRecordCount = records.filter(
    (record) => record.recordStatus === 'active' && record.decision.commercialClass === 'lightverified',
  ).length;
  const observedRecordCount = records.filter(
    (record) => record.recordStatus === 'active' && record.decision.commercialClass === 'observed',
  ).length;
  const restrictedRecordCount = records.filter(
    (record) => record.recordStatus === 'active' && record.decision.commercialClass === 'restricted',
  ).length;
  const rejectedRecordCount = records.filter(
    (record) => record.recordStatus === 'active' && record.decision.commercialClass === 'rejected',
  ).length;
  const revokedRecordCount = records.filter((record) => record.recordStatus === 'revoked').length;
  const posture = records.length > 0 ? 'prepared' : 'blocked';

  return {
    implemented: true,
    localAnalysisOnly: true,
    certificationModel: 'binary_public_mark_with_internal_scorecard',
    runtimeExecutionGating: false,
    publicRatingLadder: false,
    historicalRecordOnly: true,
    posture,
    certifiedRecordCount,
    observedRecordCount,
    restrictedRecordCount,
    rejectedRecordCount,
    revokedRecordCount,
    summary:
      posture === 'prepared'
        ? 'LightVerify local certification artifacts exist with a binary public mark, internal scorecard, and no public rating ladder.'
        : 'LightVerify certification artifacts are not yet populated.',
  };
}

export function loadExampleLightVerifyRecords(): HistoricalLightVerifyRecord[] {
  const certifiedAssessment = createLightVerifyAssessment({
    assessmentId: 'lightverify-certified-assessment',
    subjectId: 'behavior-bundle-regime-001',
    subjectType: 'dataset_bundle',
    bundleSummary: 'Bounded behavior bundle for regime-shift response analysis.',
    licensingIntent: 'institutional behavioral intelligence licensing',
    sourceRefs: [
      {
        sourceId: 'bundle-source-1',
        surface: 'data-rail-core',
        ref: 'bundles/regime-001.json',
        summary: 'normalized behavior bundle generated from verified local sample',
      },
    ],
    doveEvidence: [
      {
        evidenceId: 'dove-1',
        surface: 'dove-integration-core',
        ref: 'dove/example#clear',
        summary: 'no coercive or suppressive production pattern surfaced',
      },
    ],
    gnosisEvidence: [
      {
        evidenceId: 'gnosis-1',
        surface: 'gnosis-evaluator-core',
        ref: 'gnosis/example#coherent',
        summary: 'bundle is coherent with retrospective decompression review',
      },
    ],
    rightsEvidence: [
      {
        evidenceId: 'rights-1',
        surface: 'rights-review-core',
        ref: 'rights/example#exportable',
        summary: 'rights review resolved with no blocking cases',
      },
    ],
    deidentificationRecord: {
      piiRemoved: true,
      transformVersion: 'light-strip-v1',
      residualRisk: 'low',
      note: 'PII stripped while preserving behavioral signal structure.',
    },
    internalScorecard: {
      provenanceScore: 88,
      coherenceScore: 91,
      deidentificationScore: 93,
      rightsReadinessScore: 86,
      scoreNotes: ['Strong provenance and clean export posture.'],
    },
    createdBy: 'lightverify-core',
  });

  const certifiedDecision = issueLightVerifyDecision(certifiedAssessment, {
    decisionId: 'lightverify-certified-decision',
    decidedBy: 'human-reviewer',
    disposition: 'certified',
    justification:
      'The bundle clears provenance, coherence, de-identification, and rights review for premium certification.',
    publicSummary:
      'Behavioral bundle cleared the defined integrity and provenance bar for premium licensing review.',
    notifiedSurfaces: ['historical_record', 'data_product_bundle', 'narrative_read_path'],
  });

  const observedAssessment = createLightVerifyAssessment({
    assessmentId: 'lightverify-observed-assessment',
    subjectId: 'research-brief-002',
    subjectType: 'research_bundle',
    bundleSummary: 'Observed research brief with usable market notes but incomplete evidence depth.',
    licensingIntent: 'limited private research distribution',
    sourceRefs: [
      {
        sourceId: 'bundle-source-2',
        surface: 'narrative-core',
        ref: 'briefs/research-002.md',
        summary: 'research brief assembled from bounded internal analysis output',
      },
    ],
    doveEvidence: [
      {
        evidenceId: 'dove-2',
        surface: 'dove-integration-core',
        ref: 'dove/example#watch',
        summary: 'no hard integrity failure surfaced, but evidence depth is limited',
      },
    ],
    gnosisEvidence: [
      {
        evidenceId: 'gnosis-2',
        surface: 'gnosis-evaluator-core',
        ref: 'gnosis/example#insufficient',
        summary: 'retrospective coherence evidence exists but does not clear premium confidence',
      },
    ],
    rightsEvidence: [
      {
        evidenceId: 'rights-2',
        surface: 'rights-review-core',
        ref: 'rights/example#limited',
        summary: 'rights review allows limited private distribution only',
      },
    ],
    deidentificationRecord: {
      piiRemoved: true,
      transformVersion: 'light-strip-v1',
      residualRisk: 'medium',
      note: 'Behavioral identifiers removed, but provenance confidence remains limited.',
    },
    internalScorecard: {
      provenanceScore: 52,
      coherenceScore: 58,
      deidentificationScore: 75,
      rightsReadinessScore: 60,
      scoreNotes: ['Usable internal score profile, but not a premium certification candidate.'],
    },
    createdBy: 'lightverify-core',
  });

  const observedDecision = issueLightVerifyDecision(observedAssessment, {
    decisionId: 'lightverify-observed-decision',
    decidedBy: 'human-reviewer',
    disposition: 'insufficient_evidence',
    justification:
      'The bundle is usable as observed material, but it does not clear the premium certification bar.',
    publicSummary:
      'Observed bundle available for limited review, but not certified as LightVerified.',
    notifiedSurfaces: ['historical_record', 'data_product_bundle'],
  });

  return [
    buildHistoricalLightVerifyRecord(certifiedAssessment, certifiedDecision),
    buildHistoricalLightVerifyRecord(observedAssessment, observedDecision),
  ];
}

export function loadLocalLightVerifySnapshot(_packageRoot: string): LightVerifySnapshot {
  return buildLightVerifySnapshot(loadExampleLightVerifyRecords());
}
