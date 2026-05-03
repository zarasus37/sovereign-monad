"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRuntimeSnapshot = buildRuntimeSnapshot;
const cardia_1 = require("./cardia");
const cardia_adaptive_1 = require("./cardia-adaptive");
const controls_1 = require("./controls");
const cortex_1 = require("./cortex");
const cortex_strategic_1 = require("./cortex-strategic");
const hepar_consensus_1 = require("./hepar-consensus");
const hepar_1 = require("./hepar");
const mandate_1 = require("./mandate");
const organs_1 = require("./organs");
const orchestration_1 = require("./orchestration");
const participation_1 = require("./participation");
const pneuma_market_1 = require("./pneuma-market");
const pneuma_1 = require("./pneuma");
const revenue_1 = require("./revenue");
const synapse_adaptive_1 = require("./synapse-adaptive");
const synapse_1 = require("./synapse");
const vox_intelligence_1 = require("./vox-intelligence");
const vox_1 = require("./vox");
function unique(items) {
    return [...new Set(items)];
}
function validatePrimaryLoop(loop) {
    const missing = Object.keys(organs_1.ORGAN_DEFINITIONS).filter((name) => !loop.includes(name));
    if (missing.length > 0) {
        throw new Error(`Primary loop is missing organ definitions: ${missing.join(', ')}`);
    }
}
function buildRuntimeSnapshot(config) {
    validatePrimaryLoop(config.coordination.primaryLoop);
    const cardia = (0, cardia_1.buildCardiaSnapshot)(config.cardia?.sampleCapitalState || {
        reserveRatioPercent: 0,
        minReserveRatioPercent: 20,
        deploymentReadiness: 'blocked',
        lanes: [],
    });
    const hepar = (0, hepar_1.buildHeparSnapshot)(config.hepar?.sampleOpportunities || []);
    const heparConsensus = (0, hepar_consensus_1.buildHeparConsensusSnapshot)(config.heparConsensus?.sampleCampaigns || []);
    const cortex = (0, cortex_1.buildCortexSnapshot)(config.cortex?.sampleResearch || []);
    const cortexStrategic = (0, cortex_strategic_1.buildCortexStrategicSnapshot)(config.cortexStrategic?.sampleContexts || []);
    const vox = (0, vox_1.buildVoxSnapshot)(config.vox?.sampleRequests || [], cortex.briefs);
    const voxIntelligence = (0, vox_intelligence_1.buildVoxNarrativeIntelligenceSnapshot)(config.voxIntelligence?.sampleInputs || []);
    const pneuma = (0, pneuma_1.buildPneumaSnapshot)(config.pneuma?.sampleLeads || []);
    const pneumaMarket = (0, pneuma_market_1.buildPneumaMarketSnapshot)(config.pneumaMarket?.sampleOrders || [], config.pneumaMarket?.sampleVenueQuotes || [], config.pneumaMarket?.sampleCounterparties || [], config.pneumaMarket?.policy);
    const synapse = (0, synapse_1.buildSynapseSnapshot)(config.synapse?.sampleSignals || []);
    const synapseAdaptive = (0, synapse_adaptive_1.buildSynapseAdaptiveSnapshot)(config.synapseAdaptive?.sampleSignals || [], config.synapseAdaptive?.sampleSourceHealth || [], config.synapseAdaptive?.policy);
    const homeostasis = (0, controls_1.buildHomeostasisSnapshot)(config.controls?.homeostasis?.sampleMetrics || []);
    const signaling = (0, controls_1.buildSignalingSnapshot)(config.synapse?.sampleSignals || []);
    const immune = (0, controls_1.buildImmuneSnapshot)(config.controls?.immune?.sampleIncidents || []);
    const participation = (0, participation_1.buildParticipationSnapshot)(config.participation?.sampleActors || []);
    const cardiaAdaptive = (0, cardia_adaptive_1.buildCardiaAdaptiveSnapshot)(config.cardiaAdaptive?.sampleState || {
        reserveRatioPercent: 0,
        minReserveRatioPercent: 20,
        portfolioDrawdownPct: 0,
        volatilityRegime: 'low',
        liquidityStress: false,
    }, config.cardiaAdaptive?.sampleCandidates || [], config.cardiaAdaptive?.coefficients);
    const organs = config.coordination.primaryLoop.map((name) => {
        const definition = organs_1.ORGAN_DEFINITIONS[name];
        const organConfig = config.organs[name];
        const blockedReasons = [];
        if (!organConfig.enabled)
            blockedReasons.push('disabled');
        if (!organConfig.buildReady)
            blockedReasons.push('not_build_ready');
        if (organConfig.capitalRequired && config.runtimeMode !== 'live') {
            blockedReasons.push('capital_gated');
        }
        if (organConfig.capitalRequired &&
            config.runtimeMode === 'analysis' &&
            !config.coordination.allowCapitalGatedOrgansInAnalysis) {
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
    const orchestration = (0, orchestration_1.buildOrchestrationSnapshot)(implementedOrgans);
    const mandate = (0, mandate_1.buildFirstMandateSnapshot)({
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
    const revenue = (0, revenue_1.buildRevenueSnapshot)({
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
