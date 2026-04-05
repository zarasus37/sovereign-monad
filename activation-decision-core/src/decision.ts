import path from 'path';
import {
  ActivationDecisionInput,
  ActivationDecisionPolicy,
  ActivationDecisionRecord,
  ActivationDecisionSnapshot,
} from './types';

export function buildActivationDecisionSnapshot(
  input: ActivationDecisionInput,
  policy: ActivationDecisionPolicy,
  decisionRecord: ActivationDecisionRecord,
): ActivationDecisionSnapshot {
  const reasons: string[] = [];
  const pendingActions: string[] = [];

  const structurallyEligible =
    input.governance.externalizationAllowed &&
    input.externalizationReadiness.status === 'ready' &&
    input.rightsReview.openCaseCount === 0 &&
    input.emergenceObservation.readiness !== 'insufficient' &&
    input.emergenceBaseline.windowCount >= policy.minimumWindowCountForReview;

  if (!input.governance.externalizationAllowed) {
    reasons.push('governance does not allow externalization');
  }
  if (input.externalizationReadiness.status !== 'ready') {
    reasons.push(`externalization readiness is ${input.externalizationReadiness.status}`);
  }
  if (input.rightsReview.openCaseCount > 0) {
    reasons.push('rights review queue is not fully resolved');
  }
  if (input.emergenceObservation.readiness === 'insufficient') {
    reasons.push('emergence observation remains insufficient');
  }
  if (input.emergenceBaseline.windowCount < policy.minimumWindowCountForReview) {
    reasons.push('baseline has not yet reached the minimum review window count');
  }
  if (structurallyEligible) {
    reasons.push('structural activation gates are clear for review');
  }

  let status: ActivationDecisionSnapshot['status'] = 'blocked';
  let activationAllowed = false;
  let recommendedScope: ActivationDecisionSnapshot['recommendedScope'] = 'none';

  if (!structurallyEligible) {
    pendingActions.push('clear remaining structural blockers before activation review');
  } else if (policy.requireExplicitDecisionRecord && !decisionRecord.present) {
    status = 'review';
    recommendedScope = 'limited_private';
    pendingActions.push('record an explicit activation decision before any externalization');
    pendingActions.push('keep Data Rail output internal until the decision record exists');
  } else if (!decisionRecord.approved) {
    status = 'defer';
    recommendedScope = 'limited_private';
    pendingActions.push('activation decision record exists but is not approved');
  } else if (
    input.emergenceAccumulation.status !== 'target_met' ||
    input.emergenceBaseline.windowCount < policy.minimumWindowCountForActivation ||
    input.emergenceBaseline.baselineStatus !== 'stable'
  ) {
    status = 'defer';
    recommendedScope = 'limited_private';
    pendingActions.push('continue longitudinal accumulation before any approved activation');
    pendingActions.push(
      `collect ${input.emergenceAccumulation.remainingWindowCount} more emergence windows to reach the activation target`,
    );
    reasons.push('baseline is reviewable but not yet mature enough for activation');
  } else {
    status = 'activate';
    activationAllowed = true;
    recommendedScope = decisionRecord.scope === 'none' ? 'limited_private' : decisionRecord.scope;
    reasons.push('explicit activation record is approved and the baseline target is met');
  }

  if (
    decisionRecord.scope === 'public' &&
    (!policy.allowPublicActivationWithoutStableBaseline ||
      input.emergenceBaseline.baselineStatus !== 'stable')
  ) {
    recommendedScope = activationAllowed ? 'public' : 'limited_private';
  }

  return {
    implemented: true,
    decisionDisciplineImplemented: true,
    structurallyEligible,
    activationAllowed,
    status,
    recommendedScope,
    explicitDecisionPresent: decisionRecord.present,
    reasons,
    pendingActions,
    checklist: [
      'structural readiness is clear',
      'rights review queue is resolved',
      'baseline reaches the review floor',
      'explicit activation record exists',
      'baseline reaches the activation target before activation'
    ],
    decisionRecord,
  };
}

export function loadLocalActivationDecisionSnapshot(
  packageRoot: string,
): ActivationDecisionSnapshot {
  const governanceModulePath = path.resolve(packageRoot, 'data-rail-governance', 'dist', 'src', 'index.js');
  const rightsModulePath = path.resolve(packageRoot, 'rights-review-core', 'dist', 'index.js');
  const readinessModulePath = path.resolve(packageRoot, 'externalization-readiness-core', 'dist', 'index.js');
  const observationModulePath = path.resolve(packageRoot, 'emergence-observer-core', 'dist', 'index.js');
  const baselineModulePath = path.resolve(packageRoot, 'emergence-baseline-core', 'dist', 'src', 'index.js');
  const accumulatorModulePath = path.resolve(packageRoot, 'emergence-accumulator-core', 'dist', 'index.js');
  const policyPath = path.resolve(packageRoot, 'activation-decision-core', 'config', 'policy.json');
  const recordPath = path.resolve(packageRoot, 'activation-decision-core', 'config', 'decision-record.example.json');

  const { loadLocalGovernanceSnapshot } = require(governanceModulePath) as {
    loadLocalGovernanceSnapshot: (packageRoot: string) => any;
  };
  const { loadLocalRightsReviewSnapshot } = require(rightsModulePath) as {
    loadLocalRightsReviewSnapshot: (packageRoot: string) => any;
  };
  const { loadLocalExternalizationReadinessSnapshot } = require(readinessModulePath) as {
    loadLocalExternalizationReadinessSnapshot: (packageRoot: string) => any;
  };
  const { loadLocalEmergenceObservationSnapshot } = require(observationModulePath) as {
    loadLocalEmergenceObservationSnapshot: (packageRoot: string) => any;
  };
  const { loadLocalEmergenceBaselineSnapshot } = require(baselineModulePath) as {
    loadLocalEmergenceBaselineSnapshot: (packageRoot: string) => any;
  };
  const { loadLocalEmergenceAccumulatorSnapshot } = require(accumulatorModulePath) as {
    loadLocalEmergenceAccumulatorSnapshot: (packageRoot: string) => any;
  };

  const governance = loadLocalGovernanceSnapshot(packageRoot);
  const rightsReview = loadLocalRightsReviewSnapshot(packageRoot);
  const externalizationReadiness = loadLocalExternalizationReadinessSnapshot(packageRoot);
  const emergenceObservation = loadLocalEmergenceObservationSnapshot(packageRoot);
  const emergenceBaseline = loadLocalEmergenceBaselineSnapshot(packageRoot);
  const emergenceAccumulation = loadLocalEmergenceAccumulatorSnapshot(packageRoot);
  const policy = require(policyPath) as ActivationDecisionPolicy;
  const decisionRecord = require(recordPath) as ActivationDecisionRecord;

  return buildActivationDecisionSnapshot(
    {
      governance: {
        externalizationAllowed: governance.externalizationAllowed,
      },
      externalizationReadiness: {
        status: externalizationReadiness.status,
      },
      rightsReview: {
        openCaseCount: rightsReview.openCaseCount,
      },
      emergenceObservation: {
        readiness: emergenceObservation.readiness,
      },
      emergenceBaseline: {
        windowCount: emergenceBaseline.windowCount,
        baselineStatus: emergenceBaseline.baselineStatus,
      },
      emergenceAccumulation: {
        status: emergenceAccumulation.status,
        remainingWindowCount: emergenceAccumulation.remainingWindowCount,
      },
    },
    policy,
    decisionRecord,
  );
}
