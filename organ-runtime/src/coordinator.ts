import { ORGAN_DEFINITIONS } from './organs';
import { OrganName, OrganRuntimeConfig, OrganRuntimeSnapshot, OrganSnapshot } from './types';

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function validatePrimaryLoop(loop: OrganName[]) {
  const missing = Object.keys(ORGAN_DEFINITIONS).filter(
    (name) => !loop.includes(name as OrganName),
  );

  if (missing.length > 0) {
    throw new Error(`Primary loop is missing organ definitions: ${missing.join(', ')}`);
  }
}

export function buildRuntimeSnapshot(config: OrganRuntimeConfig): OrganRuntimeSnapshot {
  validatePrimaryLoop(config.coordination.primaryLoop);

  const organs: OrganSnapshot[] = config.coordination.primaryLoop.map((name) => {
    const definition = ORGAN_DEFINITIONS[name];
    const organConfig = config.organs[name];
    const blockedReasons: string[] = [];

    if (!organConfig.enabled) blockedReasons.push('disabled');
    if (!organConfig.buildReady) blockedReasons.push('not_build_ready');
    if (organConfig.capitalRequired && config.runtimeMode !== 'live') {
      blockedReasons.push('capital_gated');
    }

    if (
      organConfig.capitalRequired &&
      config.runtimeMode === 'analysis' &&
      !config.coordination.allowCapitalGatedOrgansInAnalysis
    ) {
      blockedReasons.push('analysis_mode_disallows_capital_organs');
    }

    return {
      name,
      biologicalAnalog: definition.biologicalAnalog,
      ecosystemRole: definition.ecosystemRole,
      primaryOutput: definition.primaryOutput,
      enabled: organConfig.enabled,
      buildReady: organConfig.buildReady,
      capitalRequired: organConfig.capitalRequired,
      zeroCapitalReady: organConfig.enabled && organConfig.buildReady && !organConfig.capitalRequired,
      blockedReasons: unique(blockedReasons.concat(organConfig.notes.length === 0 ? ['missing_notes'] : [])),
    };
  });

  return {
    runtimeMode: config.runtimeMode,
    zeroCapitalBuildQueue: organs.filter((o) => o.zeroCapitalReady).map((o) => o.name),
    capitalGatedQueue: organs.filter((o) => o.capitalRequired).map((o) => o.name),
    coordinationLoop: config.coordination.primaryLoop,
    organs,
  };
}
