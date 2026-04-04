import { buildCardiaSnapshot } from './cardia';
import { buildHomeostasisSnapshot, buildImmuneSnapshot, buildSignalingSnapshot } from './controls';
import { buildCortexSnapshot } from './cortex';
import { buildHeparSnapshot } from './hepar';
import { buildFirstMandateSnapshot } from './mandate';
import { ORGAN_DEFINITIONS } from './organs';
import { buildOrchestrationSnapshot } from './orchestration';
import { buildParticipationSnapshot } from './participation';
import { buildPneumaSnapshot } from './pneuma';
import { buildSynapseSnapshot } from './synapse';
import { OrganName, OrganRuntimeConfig, OrganRuntimeSnapshot, OrganSnapshot } from './types';
import { buildVoxSnapshot } from './vox';

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
  const cardia = buildCardiaSnapshot(
    config.cardia?.sampleCapitalState || {
      reserveRatioPercent: 0,
      minReserveRatioPercent: 20,
      deploymentReadiness: 'blocked',
      lanes: [],
    },
  );
  const hepar = buildHeparSnapshot(config.hepar?.sampleOpportunities || []);
  const cortex = buildCortexSnapshot(config.cortex?.sampleResearch || []);
  const vox = buildVoxSnapshot(config.vox?.sampleRequests || [], cortex.briefs);
  const pneuma = buildPneumaSnapshot(config.pneuma?.sampleLeads || []);
  const synapse = buildSynapseSnapshot(config.synapse?.sampleSignals || []);
  const homeostasis = buildHomeostasisSnapshot(config.controls?.homeostasis?.sampleMetrics || []);
  const signaling = buildSignalingSnapshot(config.synapse?.sampleSignals || []);
  const immune = buildImmuneSnapshot(config.controls?.immune?.sampleIncidents || []);
  const participation = buildParticipationSnapshot(config.participation?.sampleActors || []);

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

  const implementedOrgans = organs
    .filter((organ) => organ.buildReady)
    .map((organ) => organ.name);
  const orchestration = buildOrchestrationSnapshot(implementedOrgans);
  const mandate = buildFirstMandateSnapshot({
    title: config.mandate?.title || 'First bounded ecosystem-seeded internal mandate',
    synapse,
    hepar,
    cortex,
    vox,
    pneuma,
    cardia,
    immune,
    participation,
  });

  return {
    runtimeMode: config.runtimeMode,
    zeroCapitalBuildQueue: organs.filter((o) => o.zeroCapitalReady).map((o) => o.name),
    capitalGatedQueue: organs.filter((o) => o.capitalRequired).map((o) => o.name),
    coordinationLoop: config.coordination.primaryLoop,
    organs,
    synapse,
    hepar,
    cortex,
    vox,
    pneuma,
    cardia,
    orchestration,
    participation,
    mandate,
    homeostasis,
    signaling,
    immune,
  };
}
