"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.packageNarrative = exports.buildVoxSnapshot = exports.buildVoxNarrativeIntelligenceSnapshot = exports.OrganRuntime = exports.routeSignal = exports.buildSynapseSnapshot = exports.buildSynapseAdaptiveSnapshot = exports.buildRevenueSnapshot = exports.qualifyLead = exports.buildPneumaSnapshot = exports.buildPneumaMarketSnapshot = exports.buildParticipationSnapshot = exports.buildOrchestrationSnapshot = exports.buildFirstMandateSnapshot = exports.screenOpportunity = exports.buildHeparSnapshot = exports.buildHeparConsensusSnapshot = exports.buildCortexStrategicSnapshot = exports.synthesizeBrief = exports.buildCortexSnapshot = exports.buildSignalingSnapshot = exports.buildImmuneSnapshot = exports.buildHomeostasisSnapshot = exports.buildCardiaAdaptiveSnapshot = exports.buildCardiaSnapshot = exports.buildRuntimeSnapshot = exports.ORGAN_DEFINITIONS = void 0;
const runtime_1 = require("./runtime");
var organs_1 = require("./organs");
Object.defineProperty(exports, "ORGAN_DEFINITIONS", { enumerable: true, get: function () { return organs_1.ORGAN_DEFINITIONS; } });
var coordinator_1 = require("./coordinator");
Object.defineProperty(exports, "buildRuntimeSnapshot", { enumerable: true, get: function () { return coordinator_1.buildRuntimeSnapshot; } });
var cardia_1 = require("./cardia");
Object.defineProperty(exports, "buildCardiaSnapshot", { enumerable: true, get: function () { return cardia_1.buildCardiaSnapshot; } });
var cardia_adaptive_1 = require("./cardia-adaptive");
Object.defineProperty(exports, "buildCardiaAdaptiveSnapshot", { enumerable: true, get: function () { return cardia_adaptive_1.buildCardiaAdaptiveSnapshot; } });
var controls_1 = require("./controls");
Object.defineProperty(exports, "buildHomeostasisSnapshot", { enumerable: true, get: function () { return controls_1.buildHomeostasisSnapshot; } });
Object.defineProperty(exports, "buildImmuneSnapshot", { enumerable: true, get: function () { return controls_1.buildImmuneSnapshot; } });
Object.defineProperty(exports, "buildSignalingSnapshot", { enumerable: true, get: function () { return controls_1.buildSignalingSnapshot; } });
var cortex_1 = require("./cortex");
Object.defineProperty(exports, "buildCortexSnapshot", { enumerable: true, get: function () { return cortex_1.buildCortexSnapshot; } });
Object.defineProperty(exports, "synthesizeBrief", { enumerable: true, get: function () { return cortex_1.synthesizeBrief; } });
var cortex_strategic_1 = require("./cortex-strategic");
Object.defineProperty(exports, "buildCortexStrategicSnapshot", { enumerable: true, get: function () { return cortex_strategic_1.buildCortexStrategicSnapshot; } });
var hepar_consensus_1 = require("./hepar-consensus");
Object.defineProperty(exports, "buildHeparConsensusSnapshot", { enumerable: true, get: function () { return hepar_consensus_1.buildHeparConsensusSnapshot; } });
var hepar_1 = require("./hepar");
Object.defineProperty(exports, "buildHeparSnapshot", { enumerable: true, get: function () { return hepar_1.buildHeparSnapshot; } });
Object.defineProperty(exports, "screenOpportunity", { enumerable: true, get: function () { return hepar_1.screenOpportunity; } });
var mandate_1 = require("./mandate");
Object.defineProperty(exports, "buildFirstMandateSnapshot", { enumerable: true, get: function () { return mandate_1.buildFirstMandateSnapshot; } });
var orchestration_1 = require("./orchestration");
Object.defineProperty(exports, "buildOrchestrationSnapshot", { enumerable: true, get: function () { return orchestration_1.buildOrchestrationSnapshot; } });
var participation_1 = require("./participation");
Object.defineProperty(exports, "buildParticipationSnapshot", { enumerable: true, get: function () { return participation_1.buildParticipationSnapshot; } });
var pneuma_market_1 = require("./pneuma-market");
Object.defineProperty(exports, "buildPneumaMarketSnapshot", { enumerable: true, get: function () { return pneuma_market_1.buildPneumaMarketSnapshot; } });
var pneuma_1 = require("./pneuma");
Object.defineProperty(exports, "buildPneumaSnapshot", { enumerable: true, get: function () { return pneuma_1.buildPneumaSnapshot; } });
Object.defineProperty(exports, "qualifyLead", { enumerable: true, get: function () { return pneuma_1.qualifyLead; } });
var revenue_1 = require("./revenue");
Object.defineProperty(exports, "buildRevenueSnapshot", { enumerable: true, get: function () { return revenue_1.buildRevenueSnapshot; } });
var synapse_adaptive_1 = require("./synapse-adaptive");
Object.defineProperty(exports, "buildSynapseAdaptiveSnapshot", { enumerable: true, get: function () { return synapse_adaptive_1.buildSynapseAdaptiveSnapshot; } });
var synapse_1 = require("./synapse");
Object.defineProperty(exports, "buildSynapseSnapshot", { enumerable: true, get: function () { return synapse_1.buildSynapseSnapshot; } });
Object.defineProperty(exports, "routeSignal", { enumerable: true, get: function () { return synapse_1.routeSignal; } });
var runtime_2 = require("./runtime");
Object.defineProperty(exports, "OrganRuntime", { enumerable: true, get: function () { return runtime_2.OrganRuntime; } });
var vox_intelligence_1 = require("./vox-intelligence");
Object.defineProperty(exports, "buildVoxNarrativeIntelligenceSnapshot", { enumerable: true, get: function () { return vox_intelligence_1.buildVoxNarrativeIntelligenceSnapshot; } });
var vox_1 = require("./vox");
Object.defineProperty(exports, "buildVoxSnapshot", { enumerable: true, get: function () { return vox_1.buildVoxSnapshot; } });
Object.defineProperty(exports, "packageNarrative", { enumerable: true, get: function () { return vox_1.packageNarrative; } });
// Hepar-core: modular forensic stack (Stages A–D)
__exportStar(require("./hepar-core"), exports);
function main() {
    const runtime = new runtime_1.OrganRuntime();
    const snapshot = runtime.run();
    process.stdout.write(`${JSON.stringify(snapshot, null, 2)}\n`);
}
if (require.main === module) {
    try {
        main();
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(message);
        process.exitCode = 1;
    }
}
//# sourceMappingURL=index.js.map