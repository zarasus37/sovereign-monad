"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRuntimeSnapshot = void 0;
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
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _0, _1, _2;
    validatePrimaryLoop(config.coordination.primaryLoop);
    const cardia = (0, cardia_1.buildCardiaSnapshot)(((_a = config.cardia) === null || _a === void 0 ? void 0 : _a.sampleCapitalState) || {
        reserveRatioPercent: 0,
        minReserveRatioPercent: 20,
        deploymentReadiness: 'blocked',
        lanes: [],
    });
    const hepar = (0, hepar_1.buildHeparSnapshot)(((_b = config.hepar) === null || _b === void 0 ? void 0 : _b.sampleOpportunities) || []);
    const heparConsensus = (0, hepar_consensus_1.buildHeparConsensusSnapshot)(((_c = config.heparConsensus) === null || _c === void 0 ? void 0 : _c.sampleCampaigns) || []);
    const cortex = (0, cortex_1.buildCortexSnapshot)(((_d = config.cortex) === null || _d === void 0 ? void 0 : _d.sampleResearch) || []);
    const cortexStrategic = (0, cortex_strategic_1.buildCortexStrategicSnapshot)(((_e = config.cortexStrategic) === null || _e === void 0 ? void 0 : _e.sampleContexts) || []);
    const vox = (0, vox_1.buildVoxSnapshot)(((_f = config.vox) === null || _f === void 0 ? void 0 : _f.sampleRequests) || [], cortex.briefs);
    const voxIntelligence = (0, vox_intelligence_1.buildVoxNarrativeIntelligenceSnapshot)(((_g = config.voxIntelligence) === null || _g === void 0 ? void 0 : _g.sampleInputs) || []);
    const pneuma = (0, pneuma_1.buildPneumaSnapshot)(((_h = config.pneuma) === null || _h === void 0 ? void 0 : _h.sampleLeads) || []);
    const pneumaMarket = (0, pneuma_market_1.buildPneumaMarketSnapshot)(((_j = config.pneumaMarket) === null || _j === void 0 ? void 0 : _j.sampleOrders) || [], ((_k = config.pneumaMarket) === null || _k === void 0 ? void 0 : _k.sampleVenueQuotes) || [], ((_l = config.pneumaMarket) === null || _l === void 0 ? void 0 : _l.sampleCounterparties) || [], (_m = config.pneumaMarket) === null || _m === void 0 ? void 0 : _m.policy);
    const synapse = (0, synapse_1.buildSynapseSnapshot)(((_o = config.synapse) === null || _o === void 0 ? void 0 : _o.sampleSignals) || []);
    const synapseAdaptive = (0, synapse_adaptive_1.buildSynapseAdaptiveSnapshot)(((_p = config.synapseAdaptive) === null || _p === void 0 ? void 0 : _p.sampleSignals) || [], ((_q = config.synapseAdaptive) === null || _q === void 0 ? void 0 : _q.sampleSourceHealth) || [], (_r = config.synapseAdaptive) === null || _r === void 0 ? void 0 : _r.policy);
    const homeostasis = (0, controls_1.buildHomeostasisSnapshot)(((_t = (_s = config.controls) === null || _s === void 0 ? void 0 : _s.homeostasis) === null || _t === void 0 ? void 0 : _t.sampleMetrics) || []);
    const signaling = (0, controls_1.buildSignalingSnapshot)(((_u = config.synapse) === null || _u === void 0 ? void 0 : _u.sampleSignals) || []);
    const immune = (0, controls_1.buildImmuneSnapshot)(((_w = (_v = config.controls) === null || _v === void 0 ? void 0 : _v.immune) === null || _w === void 0 ? void 0 : _w.sampleIncidents) || []);
    const participation = (0, participation_1.buildParticipationSnapshot)(((_x = config.participation) === null || _x === void 0 ? void 0 : _x.sampleActors) || []);
    const cardiaAdaptive = (0, cardia_adaptive_1.buildCardiaAdaptiveSnapshot)(((_y = config.cardiaAdaptive) === null || _y === void 0 ? void 0 : _y.sampleState) || {
        reserveRatioPercent: 0,
        minReserveRatioPercent: 20,
        portfolioDrawdownPct: 0,
        volatilityRegime: 'low',
        liquidityStress: false,
    }, ((_z = config.cardiaAdaptive) === null || _z === void 0 ? void 0 : _z.sampleCandidates) || [], (_0 = config.cardiaAdaptive) === null || _0 === void 0 ? void 0 : _0.coefficients);
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
        title: ((_1 = config.mandate) === null || _1 === void 0 ? void 0 : _1.title) || 'First bounded ecosystem-seeded internal mandate',
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
        tier3Operational: (_2 = config.revenue) === null || _2 === void 0 ? void 0 : _2.tier3Operational,
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
exports.buildRuntimeSnapshot = buildRuntimeSnapshot;
//# sourceMappingURL=coordinator.js.map