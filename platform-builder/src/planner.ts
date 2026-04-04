import fs from 'fs';
import path from 'path';
import recipes from '../config/recipes.json';
import { BuilderCapability, BuilderDecision, BuilderPlan, BuilderRecipe, SharedStateSnapshot } from './types';

function stateModulePath(packageRoot: string) {
  return path.resolve(packageRoot, '..', 'ecosystem-state-api', 'dist', 'state.js');
}

function runtimeConfigPath(packageRoot: string) {
  return path.resolve(packageRoot, '..', 'organ-runtime', 'config', 'runtime.json');
}

function packageExists(packageRoot: string, packageName: string) {
  return fs.existsSync(path.resolve(packageRoot, '..', packageName, 'package.json'));
}

export function deriveCapabilityMap(packageRoot: string, implementedSurfaces: string[]) {
  const surfaceSet = new Set(implementedSurfaces);

  return {
    organ_runtime: surfaceSet.has('organ-runtime'),
    signal_layer: surfaceSet.has('signal-layer'),
    oracle: surfaceSet.has('oracle-core'),
    gnosis: surfaceSet.has('gnosis-core'),
    boundary_stress: surfaceSet.has('boundary-stress-monitor'),
    state_api: packageExists(packageRoot, 'ecosystem-state-api'),
    dashboard: packageExists(packageRoot, 'ecosystem-dashboard'),
  } satisfies Record<BuilderCapability, boolean>;
}

export function evaluateRecipe(
  recipe: BuilderRecipe,
  capabilityMap: Record<BuilderCapability, boolean>,
  summary: SharedStateSnapshot['summary'],
): BuilderDecision {
  const reasons: string[] = [];
  const nextActions: string[] = [];

  for (const capability of recipe.requiredCapabilities) {
    if (!capabilityMap[capability]) {
      reasons.push(`missing capability: ${capability}`);
      nextActions.push(`build or expose ${capability}`);
    }
  }

  if (recipe.touchesCapital && summary.deploymentBlockedByCapital) {
    reasons.push('capital deployment remains blocked');
    nextActions.push('complete funded Phase 1a deployment path before capital-linked platform work');
  }

  if (recipe.outwardFacing && summary.localAnalysisOnly) {
    reasons.push('current stack is local-analysis-only');
    nextActions.push('keep outward-facing work behind local-only boundaries until posture is cleaner');
  }

  if (recipe.outwardFacing && summary.integrityStatus !== 'clear') {
    reasons.push(`integrity status is ${summary.integrityStatus}`);
    nextActions.push('clear integrity review/containment posture before outward expansion');
  }

  if (recipe.outwardFacing && summary.escalationTier !== 'tier0') {
    reasons.push(`escalation tier is ${summary.escalationTier}`);
    nextActions.push('reduce boundary stress before outward expansion');
  }

  if (recipe.outwardFacing && summary.commercializationPosture === 'internal_only') {
    reasons.push('commercialization posture is still internal_only');
    nextActions.push('raise commercialization posture through verified pilot-ready work first');
  }

  if (!recipe.outwardFacing && reasons.length === 0) {
    nextActions.push('ready to implement in the local zero-capital platform lane');
  }

  return {
    id: recipe.id,
    title: recipe.title,
    ready: reasons.length === 0,
    stage: recipe.stage,
    reasons,
    nextActions,
  };
}

export function buildBuilderPlan(
  packageRoot: string,
  summary: SharedStateSnapshot['summary'],
  recipeList: BuilderRecipe[] = recipes as BuilderRecipe[],
): BuilderPlan {
  const capabilityMap = deriveCapabilityMap(packageRoot, summary.implementedSurfaces);
  const decisions = recipeList.map((recipe) => evaluateRecipe(recipe, capabilityMap, summary));

  return {
    implemented: true,
    localAnalysisOnly: true,
    capabilityMap,
    readyCount: decisions.filter((decision) => decision.ready).length,
    blockedCount: decisions.filter((decision) => !decision.ready).length,
    decisions,
  };
}

export function loadLocalBuilderPlan(packageRoot: string): BuilderPlan {
  const modulePath = stateModulePath(packageRoot);
  if (!fs.existsSync(modulePath)) {
    throw new Error('ecosystem-state-api build artifact is missing. Build ecosystem-state-api first.');
  }

  const { loadEcosystemState } = require(modulePath) as {
    loadEcosystemState: (packageRoot: string, runtimeConfigPath: string) => SharedStateSnapshot;
  };

  const state = loadEcosystemState(
    path.resolve(packageRoot, '..', 'ecosystem-state-api'),
    runtimeConfigPath(packageRoot),
  );

  return buildBuilderPlan(packageRoot, state.summary);
}
