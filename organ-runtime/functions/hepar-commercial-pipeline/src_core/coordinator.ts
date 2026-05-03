import { buildCardiaSnapshot } from './cardia';
import { buildCardiaAdaptiveSnapshot } from './cardia-adaptive';
import { buildHomeostasisSnapshot, buildImmuneSnapshot, buildSignalingSnapshot } from './controls';
import { buildCortexSnapshot } from './cortex';
import { buildCortexStrategicSnapshot } from './cortex-strategic';
import { buildHeparConsensusSnapshot } from './hepar-consensus';
import { buildHeparSnapshot } from './hepar';
import { buildFirstMandateSnapshot } from './mandate';
import { ORGAN_DEFINITIONS } from './organs';
import { buildOrchestrationSnapshot } from './orchestration';
import { buildParticipationSnapshot } from './participation';
import { buildPneumaMarketSnapshot } from './pneuma-market';
import { buildPneumaSnapshot } from './pneuma';
import { buildRevenueSnapshot } from './revenue';
import { buildSynapseAdaptiveSnapshot } from './synapse-adaptive';
import { buildSynapseSnapshot } from './synapse';
import { OrganName, OrganRuntimeConfig, OrganRuntimeSnapshot, OrganSnapshot } from './types';
import { buildVoxNarrativeIntelligenceSnapshot } from './vox-intelligence';
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
  const heparConsensus = buildHeparConsensusSnapshot(config.heparConsensus?.sampleCampaigns || []);
  const cortex = buildCortexSnapshot(config.cortex?.sampleResearch || []);
  const cortexStrategic = buildCortexStrategicSnapshot(config.cortexStrategic?.sampleContexts || []);
  const vox = buildVoxSnapshot(config.vox?.sampleRequests || [], cortex.briefs);
  const voxIntelligence = buildVoxNarrativeIntelligenceSnapshot(config.voxIntelligence?.sampleInputs || []);
  const pneuma = buildPneumaSnapshot(config.pneuma?.sampleLeads || []);
  const pneumaMarket = buildPneumaMarketSnapshot(
    config.pneumaMarket?.sampleOrders || [],
    config.pneumaMarket?.sampleVenueQuotes || [],
    config.pneumaMarket?.sampleCounterparties || [],
    config.pneumaMarket?.policy,
  );
  const synapse = buildSynapseSnapshot(config.synapse?.sampleSignals || []);
  const synapseAdaptive = buildSynapseAdaptiveSnapshot(
    config.synapseAdaptive?.sampleSignals || [],
    config.synapseAdaptive?.sampleSourceHealth || [],
    config.synapseAdaptive?.policy,
  );
  const homeostasis = buildHomeostasisSnapshot(config.controls?.homeostasis?.sampleMetrics || []);
  const signaling = buildSignalingSnapshot(config.synapse?.sampleSignals || []);
  const immune = buildImmuneSnapshot(config.controls?.immune?.sampleIncidents || []);
  const participation = buildParticipationSnapshot(config.participation?.sampleActors || []);
  const cardiaAdaptive = buildCardiaAdaptiveSnapshot(
    config.cardiaAdaptive?.sampleState || {
      reserveRatioPercent: 0,
      minReserveRatioPercent: 20,
      portfolioDrawdownPct: 0,
      volatilityRegime: 'low',
      liquidityStress: false,
    },
    config.cardiaAdaptive?.sampleCandidates || [],
    config.cardiaAdaptive?.coefficients,
  );

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
  const revenue = buildRevenueSnapshot({
    hepar,
    cortex,
    vox,
    pneuma,
    cardia,
    tier3Operational: config.revenue?.tier3Operational,
  });

  return {
    runtimeMode: config.runtimeMode,
    zeroCapitalBuildQueue: organs.filter((o) => o.zeroCapitalReady).map((o) => o.name),
    capitalGatedQueue: organs.filter((o) => o.capitalRequired).map((o) => o.name),
    coordinationLoop: config.coordination.primaryLoop,
    organs,
    synapse,
    synapseAdaptive,
    hepar,
    heparConsensus,
    cortex,
    cortexStrategic,
    vox,
    voxIntelligence,
    pneuma,
    pneumaMarket,
    cardia,
    cardiaAdaptive,
    orchestration,
    participation,
    mandate,
    revenue,
    homeostasis,
    signaling,
    immune,
  };
}
