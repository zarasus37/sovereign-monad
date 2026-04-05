import fs from 'fs';
import path from 'path';
import { PublicActivationInput, PublicActivationPolicy, PublicActivationRecord, PublicActivationSnapshot } from './types';

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function rankExecutionTruth(status: PublicActivationInput['executionTruthStatus']) {
  return { blocked: 0, staged: 1, closed: 2 }[status];
}

function rankCardia(status: PublicActivationInput['cardiaActivationStatus']) {
  return {
    blocked: 0,
    ready_for_funding: 1,
    staged: 2,
    ready_for_guarded_live: 3,
    active: 4,
  }[status];
}

export function buildPublicActivationSnapshot(
  input: PublicActivationInput,
  policy: PublicActivationPolicy,
): PublicActivationSnapshot {
  const blockers: string[] = [];
  const nextActions: string[] = [];

  if (!input.phase1aLiveProofRecorded) {
    blockers.push('live Phase 1a deployment proof is not recorded');
    nextActions.push('complete live Phase 1a proof before considering production/public activation');
  }

  if (rankExecutionTruth(input.executionTruthStatus) < rankExecutionTruth(policy.requireExecutionTruthStatus)) {
    blockers.push(`execution truth is ${input.executionTruthStatus}`);
    nextActions.push('close runtime execution truth before production/public activation');
  }

  if (rankCardia(input.cardiaActivationStatus) < rankCardia(policy.requireCardiaStatus)) {
    blockers.push(`Cardia activation posture is ${input.cardiaActivationStatus}`);
    nextActions.push('advance funded Cardia readiness before production/public activation');
  }

  if (policy.requireLicensedDeploymentDoc && !input.licensedDeploymentDoc) {
    blockers.push('licensed deployment document is missing');
  }
  if (policy.requireGuardedLiveActivationDoc && !input.guardedLiveActivationDoc) {
    blockers.push('guarded-live activation document is missing');
  }
  if (policy.requireOperatorRunbook && !input.operatorRunbookDoc) {
    blockers.push('operator runbook is missing');
  }
  if (policy.requireDataProductPrepared && input.dataProductStatus !== 'prepared') {
    blockers.push(`data product posture is ${input.dataProductStatus}`);
  }
  if (policy.requireNarrativeSurface && !['bounded_review', 'ready', 'live'].includes(input.narrativeStatus)) {
    blockers.push(`narrative posture is ${input.narrativeStatus}`);
  }

  let status: PublicActivationSnapshot['status'] = 'blocked';

  if (blockers.length === 0) {
    if (
      policy.allowPrivateLicensedBeforePublic &&
      (!input.record.productionInfraConfigured ||
        !input.record.licensedPrivatePathValidated ||
        !input.record.operatorMonitoringReady)
    ) {
      status = 'private_ready';
      if (!input.record.productionInfraConfigured) {
        nextActions.push('configure the production/private infrastructure surface');
      }
      if (!input.record.licensedPrivatePathValidated) {
        nextActions.push('validate the licensed/private activation path first');
      }
      if (!input.record.operatorMonitoringReady) {
        nextActions.push('confirm operator monitoring and rollback surfaces are ready');
      }
    } else if (
      !input.record.publicSurfaceReady ||
      !input.record.activationApproved ||
      !input.record.publicActivationLive
    ) {
      status = 'public_review';
      if (!input.record.publicSurfaceReady) {
        nextActions.push('finish the public-facing surface and readiness checks');
      }
      if (!input.record.activationApproved) {
        nextActions.push('record an explicit production/public activation approval');
      }
      if (!input.record.publicActivationLive) {
        nextActions.push('keep activation downstream until the private path is proven');
      }
    } else {
      status = 'active';
    }
  }

  return {
    implemented: true,
    status,
    phase1aLiveProofRecorded: input.phase1aLiveProofRecorded,
    executionTruthStatus: input.executionTruthStatus,
    cardiaActivationStatus: input.cardiaActivationStatus,
    dataProductStatus: input.dataProductStatus,
    narrativeStatus: input.narrativeStatus,
    productionInfraConfigured: input.record.productionInfraConfigured,
    licensedPrivatePathValidated: input.record.licensedPrivatePathValidated,
    operatorMonitoringReady: input.record.operatorMonitoringReady,
    publicSurfaceReady: input.record.publicSurfaceReady,
    activationApproved: input.record.activationApproved,
    publicActivationLive: input.record.publicActivationLive,
    blockers,
    nextActions,
    notes: input.record.notes,
  };
}

export function loadLocalPublicActivationSnapshot(packageRoot: string): PublicActivationSnapshot {
  const policyPath = path.resolve(packageRoot, 'public-activation-core', 'config', 'policy.json');
  const recordPath = path.resolve(packageRoot, 'public-activation-core', 'config', 'activation-record.json');
  const executionTruthModulePath = path.resolve(packageRoot, 'execution-truth-core', 'dist', 'index.js');
  const cardiaActivationModulePath = path.resolve(packageRoot, 'cardia-activation-core', 'dist', 'index.js');
  const narrativeModulePath = path.resolve(packageRoot, 'narrative-core', 'dist', 'index.js');
  const dataProductModulePath = path.resolve(packageRoot, 'data-product-core', 'dist', 'src', 'index.js');

  const policy = readJson<PublicActivationPolicy>(policyPath);
  const record = readJson<PublicActivationRecord>(recordPath);

  const { loadLocalExecutionTruthSnapshot } = require(executionTruthModulePath) as {
    loadLocalExecutionTruthSnapshot: (packageRoot: string) => any;
  };
  const { loadLocalCardiaActivationSnapshot } = require(cardiaActivationModulePath) as {
    loadLocalCardiaActivationSnapshot: (packageRoot: string) => any;
  };
  const { loadLocalNarrativeSnapshot } = require(narrativeModulePath) as {
    loadLocalNarrativeSnapshot: (packageRoot: string) => any;
  };
  const { loadLocalDataProductSnapshot } = require(dataProductModulePath) as {
    loadLocalDataProductSnapshot: (packageRoot: string) => any;
  };

  const executionTruth = loadLocalExecutionTruthSnapshot(packageRoot);
  const cardiaActivation = loadLocalCardiaActivationSnapshot(packageRoot);
  const narrative = loadLocalNarrativeSnapshot(packageRoot);
  const dataProduct = loadLocalDataProductSnapshot(packageRoot);

  return buildPublicActivationSnapshot(
    {
      phase1aLiveProofRecorded: executionTruth.phase1aLiveProofRecorded,
      executionTruthStatus: executionTruth.status,
      cardiaActivationStatus: cardiaActivation.status,
      dataProductStatus: dataProduct.productizationStatus,
      narrativeStatus: narrative.publicSurfaceStatus,
      licensedDeploymentDoc: fs.existsSync(
        path.resolve(packageRoot, 'docs', 'LICENSED-DEPLOYMENT.md'),
      ),
      guardedLiveActivationDoc: fs.existsSync(
        path.resolve(packageRoot, 'docs', 'GUARDED-LIVE-ACTIVATION.md'),
      ),
      operatorRunbookDoc: fs.existsSync(path.resolve(packageRoot, 'docs', 'OPERATOR-RUNBOOK.md')),
      record,
    },
    policy,
  );
}
