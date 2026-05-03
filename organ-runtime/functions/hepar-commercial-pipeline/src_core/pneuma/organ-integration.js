"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerPneumaForHeparAssessment = void 0;
const pneuma_core_1 = require("./pneuma-core");
const cosmosClient_1 = require("./cosmosClient");
// Integration mockup connecting Pneuma to Hepar, Cortex and Synapse
function triggerPneumaForHeparAssessment(mandateId, rawMarketData) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`[Pneuma] Triggering market snapshot for mandate: ${mandateId}`);
        const intelligence = (0, pneuma_core_1.generatePneumaIntelligence)(rawMarketData);
        // Write to Pneuma containers
        const marketContainer = yield (0, cosmosClient_1.getPneumaContainer)('pneuma-market');
        const execContainer = yield (0, cosmosClient_1.getPneumaContainer)('pneuma-execution');
        const regimeContainer = yield (0, cosmosClient_1.getPneumaContainer)('pneuma-regime');
        yield marketContainer.items.upsert(intelligence.snapshot);
        yield execContainer.items.upsert(intelligence.execution);
        yield regimeContainer.items.upsert(intelligence.regime);
        // Attach to Assessment Record context (mock)
        console.log(`[Hepar Context] Attached: pneumaRegime=${intelligence.regime.regime}, pneumaSettlementReliability=${intelligence.execution.settlementReliability}`);
        // Synapse integration
        if (intelligence.regime.triggersImmediateSynapse) {
            console.log(`[Synapse Integration] IMMEDIATE signal sent due to CRISIS or Converted Demand.`);
        }
        // Cortex integration
        if (intelligence.regime.regime === 'STRESSED' || intelligence.regime.regime === 'CRISIS') {
            console.log(`[Cortex Integration] Regime data passed to Cortex integration domain -> Elevated urgency.`);
        }
        return intelligence;
    });
}
exports.triggerPneumaForHeparAssessment = triggerPneumaForHeparAssessment;
//# sourceMappingURL=organ-integration.js.map