import path from 'path';
import {
  buildHistoricalLightVerifyRecord,
  buildLightVerifySnapshot,
  createLightVerifyAssessment,
  issueLightVerifyDecision,
  loadExampleLightVerifyRecords,
  loadLocalLightVerifySnapshot,
  revokeLightVerifyCertification,
} from './lightverify';
import type {
  CreateLightVerifyAssessmentInput,
  HistoricalLightVerifyRecord,
  IssueLightVerifyDecisionInput,
  LightVerifyAssessment,
  LightVerifyCommercialClass,
  LightVerifyDecisionRecord,
  LightVerifyDeidentificationRecord,
  LightVerifyDisposition,
  LightVerifyEvidenceRef,
  LightVerifyInternalScorecard,
  LightVerifyNotificationSurface,
  LightVerifyPublicDisclosure,
  LightVerifyRevocationBasis,
  LightVerifyRevocationRecord,
  LightVerifySnapshot,
  LightVerifySourceRef,
  LightVerifySubjectType,
  RevokeLightVerifyInput,
} from './types';

export {
  buildHistoricalLightVerifyRecord,
  buildLightVerifySnapshot,
  createLightVerifyAssessment,
  issueLightVerifyDecision,
  loadExampleLightVerifyRecords,
  loadLocalLightVerifySnapshot,
  revokeLightVerifyCertification,
};

export type {
  CreateLightVerifyAssessmentInput,
  HistoricalLightVerifyRecord,
  IssueLightVerifyDecisionInput,
  LightVerifyAssessment,
  LightVerifyCommercialClass,
  LightVerifyDecisionRecord,
  LightVerifyDeidentificationRecord,
  LightVerifyDisposition,
  LightVerifyEvidenceRef,
  LightVerifyInternalScorecard,
  LightVerifyNotificationSurface,
  LightVerifyPublicDisclosure,
  LightVerifyRevocationBasis,
  LightVerifyRevocationRecord,
  LightVerifySnapshot,
  LightVerifySourceRef,
  LightVerifySubjectType,
  RevokeLightVerifyInput,
};

function main() {
  const snapshot: LightVerifySnapshot = loadLocalLightVerifySnapshot(
    path.resolve(__dirname, '..', '..'),
  );
  process.stdout.write(`${JSON.stringify(snapshot, null, 2)}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(message);
    process.exitCode = 1;
  }
}
