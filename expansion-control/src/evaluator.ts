import fs from 'fs';
import path from 'path';
import policy from '../config/policy.json';
import { ExpansionCapability, ExpansionDecision, ExpansionPolicy, ExpansionRequest, ExpansionSummaryInput } from './types';

function packageExists(packageRoot: string, packageName: string) {
  return fs.existsSync(path.resolve(packageRoot, '..', packageName, 'package.json'));
}

export function deriveExpansionCapabilities(packageRoot: string) {
  return {
    organ_runtime: packageExists(packageRoot, 'organ-runtime'),
    signal_layer: packageExists(packageRoot, 'signal-layer'),
    oracle: packageExists(packageRoot, 'oracle-core'),
    gnosis: packageExists(packageRoot, 'gnosis-core'),
    boundary_stress: packageExists(packageRoot, 'boundary-stress-monitor'),
    state_api: packageExists(packageRoot, 'ecosystem-state-api'),
    dashboard: packageExists(packageRoot, 'ecosystem-dashboard'),
  } satisfies Record<ExpansionCapability, boolean>;
}

export function evaluateExpansionRequest(
  request: ExpansionRequest,
  summary: ExpansionSummaryInput,
  capabilities: Record<ExpansionCapability, boolean>,
  activePolicy: ExpansionPolicy = policy as ExpansionPolicy,
): ExpansionDecision {
  const reasons: string[] = [];
  const requiredActions: string[] = [];

  for (const capability of request.requiredCapabilities) {
    if (!capabilities[capability]) {
      reasons.push(`missing capability: ${capability}`);
      requiredActions.push(`build or expose ${capability}`);
    }
  }

  if (request.touchesCapital && activePolicy.blockCapitalExpansionWhenDeploymentBlocked && summary.deploymentBlockedByCapital) {
    reasons.push('capital expansion remains blocked by current deployment posture');
    requiredActions.push('finish funded Phase 1a deployment and remove capital gate first');
  }

  if (request.outwardFacing) {
    if (summary.localAnalysisOnly) {
      reasons.push('current environment is local-analysis-only');
      requiredActions.push('keep the request internal until a non-local posture is available');
    }

    if (activePolicy.requireIntegrityClearForOutwardExpansion && summary.integrityStatus !== 'clear') {
      reasons.push(`integrity status is ${summary.integrityStatus}`);
      requiredActions.push('clear integrity review/containment before outward expansion');
    }

    if (activePolicy.requireTier0ForOutwardExpansion && summary.escalationTier !== 'tier0') {
      reasons.push(`escalation tier is ${summary.escalationTier}`);
      requiredActions.push('reduce boundary stress before outward expansion');
    }

    if (summary.commercializationPosture === 'internal_only') {
      reasons.push('commercialization posture is internal_only');
      requiredActions.push('raise commercialization posture to pilot_ready or buyer_ready first');
    }
  }

  if (!request.outwardFacing && !request.touchesCapital && summary.integrityStatus !== 'clear' && summary.escalationTier !== 'tier0') {
    if (!activePolicy.allowLocalInternalExpansionDuringStress) {
      reasons.push('local internal expansion is disabled during stressed posture');
      requiredActions.push('stabilize posture before internal expansion');
    }
  }

  const blocked = reasons.length > 0;
  const mode: ExpansionDecision['mode'] =
    blocked
      ? request.outwardFacing || request.touchesCapital
        ? 'block'
        : 'review'
      : 'allow';

  if (!blocked) {
    requiredActions.push('request is within the current controlled expansion envelope');
  }

  return {
    implemented: true,
    requestId: request.id,
    approved: !blocked,
    mode,
    reasons,
    requiredActions,
  };
}

export function loadLocalExpansionDecision(
  packageRoot: string,
  request: ExpansionRequest,
): ExpansionDecision {
  const stateModulePath = path.resolve(packageRoot, '..', 'ecosystem-state-api', 'dist', 'state.js');
  if (!fs.existsSync(stateModulePath)) {
    throw new Error('ecosystem-state-api build artifact is missing. Build ecosystem-state-api first.');
  }

  const { loadEcosystemState } = require(stateModulePath) as {
    loadEcosystemState: (packageRoot: string, runtimeConfigPath: string) => { summary: ExpansionSummaryInput };
  };

  const ecosystemState = loadEcosystemState(
    path.resolve(packageRoot, '..', 'ecosystem-state-api'),
    path.resolve(packageRoot, '..', 'organ-runtime', 'config', 'runtime.json'),
  );

  return evaluateExpansionRequest(request, ecosystemState.summary, deriveExpansionCapabilities(packageRoot));
}
