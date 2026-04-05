import fs from 'fs';
import path from 'path';
import bundleFile from '../config/bundles.example.json';
import { DataProductBundle, DataProductEvaluation, DataProductInput, DataProductSnapshot } from './types';

export function buildDataProductSnapshot(
  input: DataProductInput,
  bundles: DataProductBundle[],
): DataProductSnapshot {
  const blockers: string[] = [];
  const availableBundles: DataProductEvaluation[] = [];
  const blockedBundles: DataProductEvaluation[] = [];

  if (!input.governance.externalizationAllowed) {
    blockers.push('governance does not structurally allow externalization');
  }
  if (input.rightsReview.openCaseCount > 0 || input.rightsReview.blockedCount > 0) {
    blockers.push('rights review still contains unresolved or blocked cases');
  }
  if (input.readiness.status === 'blocked') {
    blockers.push('externalization readiness remains blocked');
  }

  for (const bundle of bundles) {
    const blockedByActivation =
      bundle.requiresExplicitActivation &&
      (!input.activationDecision.explicitDecisionPresent || !input.activationDecision.activationAllowed);
    const blockedByScope =
      bundle.recommendedScope === 'public' && input.activationDecision.recommendedScope !== 'public';

    if (blockedByActivation) {
      blockedBundles.push({
        bundleId: bundle.id,
        status: 'blocked',
        reason: 'bundle requires explicit approved activation before external release',
      });
      continue;
    }

    if (blockedByScope) {
      blockedBundles.push({
        bundleId: bundle.id,
        status: 'blocked',
        reason: `bundle scope exceeds current activation scope (${input.activationDecision.recommendedScope})`,
      });
      continue;
    }

    availableBundles.push({
      bundleId: bundle.id,
      status: 'available_local',
      reason: 'bundle is prepared for local/private productization review',
    });
  }

  const productizationStatus: DataProductSnapshot['productizationStatus'] =
    blockers.length === 0 && availableBundles.length > 0 ? 'prepared' : 'blocked';

  return {
    implemented: true,
    localAnalysisOnly: true,
    productizationStatus,
    externalActivationLive: false,
    recommendedScope: input.activationDecision.recommendedScope,
    availableBundles,
    blockedBundles,
    blockers,
  };
}

export function loadLocalDataProductSnapshot(packageRoot: string): DataProductSnapshot {
  const governanceModulePath = path.resolve(packageRoot, 'data-rail-governance', 'dist', 'src', 'index.js');
  const rightsModulePath = path.resolve(packageRoot, 'rights-review-core', 'dist', 'index.js');
  const readinessModulePath = path.resolve(packageRoot, 'externalization-readiness-core', 'dist', 'index.js');
  const activationModulePath = path.resolve(packageRoot, 'activation-decision-core', 'dist', 'index.js');
  const bundlePath = path.resolve(packageRoot, 'data-product-core', 'config', 'bundles.example.json');

  const { loadLocalGovernanceSnapshot } = require(governanceModulePath) as { loadLocalGovernanceSnapshot: (packageRoot: string) => any };
  const { loadLocalRightsReviewSnapshot } = require(rightsModulePath) as { loadLocalRightsReviewSnapshot: (packageRoot: string) => any };
  const { loadLocalExternalizationReadinessSnapshot } = require(readinessModulePath) as { loadLocalExternalizationReadinessSnapshot: (packageRoot: string) => any };
  const { loadLocalActivationDecisionSnapshot } = require(activationModulePath) as { loadLocalActivationDecisionSnapshot: (packageRoot: string) => any };

  const governance = loadLocalGovernanceSnapshot(packageRoot);
  const rightsReview = loadLocalRightsReviewSnapshot(packageRoot);
  const readiness = loadLocalExternalizationReadinessSnapshot(packageRoot);
  const activationDecision = loadLocalActivationDecisionSnapshot(packageRoot);
  const bundles = JSON.parse(fs.readFileSync(bundlePath, 'utf8')) as DataProductBundle[];

  return buildDataProductSnapshot(
    {
      governance: {
        externalizationAllowed: governance.externalizationAllowed,
      },
      rightsReview: {
        openCaseCount: rightsReview.openCaseCount,
        blockedCount: rightsReview.blockedCount,
      },
      readiness: {
        status: readiness.status,
      },
      activationDecision: {
        status: activationDecision.status,
        explicitDecisionPresent: activationDecision.explicitDecisionPresent,
        recommendedScope: activationDecision.recommendedScope,
        activationAllowed: activationDecision.activationAllowed,
      },
    },
    bundles,
  );
}

export function loadExampleDataProductSnapshot(): DataProductSnapshot {
  return buildDataProductSnapshot(
    {
      governance: {
        externalizationAllowed: true,
      },
      rightsReview: {
        openCaseCount: 0,
        blockedCount: 0,
      },
      readiness: {
        status: 'ready',
      },
      activationDecision: {
        status: 'review',
        explicitDecisionPresent: false,
        recommendedScope: 'limited_private',
        activationAllowed: false,
      },
    },
    bundleFile as DataProductBundle[],
  );
}
