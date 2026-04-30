const assert = require('node:assert/strict');
const path = require('node:path');

const {
  buildHistoricalLightVerifyRecord,
  buildLightVerifySnapshot,
  createLightVerifyAssessment,
  issueLightVerifyDecision,
  loadExampleLightVerifyRecords,
  revokeLightVerifyCertification,
} = require(path.resolve(__dirname, '..', 'dist', 'index.js'));

function buildAssessment(overrides = {}) {
  return createLightVerifyAssessment({
    assessmentId: 'assessment-1',
    subjectId: 'bundle-1',
    subjectType: 'dataset_bundle',
    bundleSummary: 'Example bundle.',
    licensingIntent: 'institutional licensing',
    sourceRefs: [
      { sourceId: 'source-1', surface: 'data-rail-core', ref: 'bundle/1', summary: 'bundle source' },
    ],
    doveEvidence: [
      { evidenceId: 'dove-1', surface: 'dove-integration-core', ref: 'dove/1', summary: 'clear' },
    ],
    gnosisEvidence: [
      { evidenceId: 'gnosis-1', surface: 'gnosis-evaluator-core', ref: 'gnosis/1', summary: 'coherent' },
    ],
    rightsEvidence: [
      { evidenceId: 'rights-1', surface: 'rights-review-core', ref: 'rights/1', summary: 'exportable' },
    ],
    deidentificationRecord: {
      piiRemoved: true,
      transformVersion: 'light-strip-v1',
      residualRisk: 'low',
      note: 'PII removed.',
    },
    internalScorecard: {
      provenanceScore: 80,
      coherenceScore: 81,
      deidentificationScore: 82,
      rightsReadinessScore: 83,
    },
    createdBy: 'test-suite',
    ...overrides,
  });
}

function buildDecision(assessment, overrides = {}) {
  return issueLightVerifyDecision(assessment, {
    decisionId: 'decision-1',
    decidedBy: 'reviewer',
    disposition: 'certified',
    justification: 'clears bar',
    publicSummary: 'clears bar',
    notifiedSurfaces: ['historical_record', 'data_product_bundle'],
    ...overrides,
  });
}

(() => {
  const assessment = buildAssessment();
  assert.equal(assessment.state, 'pending_review');
  assert.equal(assessment.localAnalysisOnly, true);
})();

(() => {
  assert.throws(
    () =>
      createLightVerifyAssessment({
        assessmentId: 'bad',
        subjectId: 'bundle-bad',
        subjectType: 'dataset_bundle',
        bundleSummary: 'Bad bundle.',
        licensingIntent: 'none',
        sourceRefs: [],
        doveEvidence: [{ evidenceId: 'd', surface: 'dove', ref: 'x', summary: 'x' }],
        gnosisEvidence: [{ evidenceId: 'g', surface: 'gnosis', ref: 'x', summary: 'x' }],
        rightsEvidence: [{ evidenceId: 'r', surface: 'rights', ref: 'x', summary: 'x' }],
        deidentificationRecord: {
          piiRemoved: true,
          transformVersion: 'v1',
          residualRisk: 'low',
          note: 'x',
        },
        internalScorecard: {
          provenanceScore: 101,
          coherenceScore: 50,
          deidentificationScore: 50,
          rightsReadinessScore: 50,
        },
        createdBy: 'test-suite',
      }),
    /sourceRefs|provenanceScore/,
  );
})();

(() => {
  const assessment = buildAssessment();
  const decision = buildDecision(assessment);
  assert.equal(decision.commercialClass, 'lightverified');
  assert.equal(decision.publicMarkEligible, true);
  assert.equal(decision.sealLabel, 'LightVerified');
})();

(() => {
  const assessment = buildAssessment();
  const decision = buildDecision(assessment, {
    disposition: 'insufficient_evidence',
    publicSummary: 'not certified',
  });
  const record = buildHistoricalLightVerifyRecord(assessment, decision);
  assert.equal(record.publicDisclosure.publicMarkEligible, false);
  assert.equal(record.publicDisclosure.commercialClass, 'observed');
  assert.match(record.publicDisclosure.marketingClaim, /Observed/);
})();

(() => {
  const assessment = buildAssessment({
    deidentificationRecord: {
      piiRemoved: false,
      transformVersion: 'light-strip-v1',
      residualRisk: 'low',
      note: 'still contains PII',
    },
  });
  assert.throws(
    () => buildDecision(assessment),
    /PII removal/,
  );
})();

(() => {
  const assessment = buildAssessment();
  const decision = buildDecision(assessment);
  const revocation = revokeLightVerifyCertification(assessment, decision, {
    revocationId: 'revocation-1',
    revokedBy: 'reviewer',
    basis: 'integrity_reassessment',
    detail: 'later review invalidated claim',
  });
  const record = buildHistoricalLightVerifyRecord(assessment, decision, revocation);
  assert.equal(record.recordStatus, 'revoked');
  assert.equal(record.revocation.basis, 'integrity_reassessment');
})();

(() => {
  const records = loadExampleLightVerifyRecords();
  const snapshot = buildLightVerifySnapshot(records);
  assert.equal(snapshot.posture, 'prepared');
  assert.equal(snapshot.certificationModel, 'binary_public_mark_with_internal_scorecard');
  assert.equal(snapshot.publicRatingLadder, false);
  assert.equal(snapshot.certifiedRecordCount, 1);
  assert.equal(snapshot.observedRecordCount, 1);
})();

process.stdout.write('lightverify-core tests passed\n');
