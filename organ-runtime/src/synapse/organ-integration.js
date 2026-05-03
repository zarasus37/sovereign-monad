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
exports.processCoordination = exports.processIncomingEcosystemSignal = void 0;
const synapse_core_1 = require("./synapse-core");
const cosmosClient_1 = require("./cosmosClient");
// Mock hook to demonstrate integration wired properly
function processIncomingEcosystemSignal(raw) {
    return __awaiter(this, void 0, void 0, function* () {
        const classified = (0, synapse_core_1.classifySignal)(raw);
        const decision = (0, synapse_core_1.routeSignal)(classified);
        const routingContainer = yield (0, cosmosClient_1.getSynapseContainer)('synapse-routing');
        yield routingContainer.items.upsert(decision);
        if (decision.action === 'DISPATCH_HEPAR') {
            console.log(`[Organ Integration] Triggered Hepar Assessment for ${raw.protocolName}`);
        }
        else if (decision.action === 'DISPATCH_CORTEX') {
            console.log(`[Organ Integration] Triggered Cortex Synthesis for ${raw.protocolName}`);
        }
        else if (decision.action === 'ESCALATED') {
            console.log(`[Organ Integration] Triggered Founder Review directly due to Capital Escalation`);
        }
        else if (decision.action === 'DISPATCH_BOTH') {
            console.log(`[Organ Integration] Triggered Hepar then Cortex systematically for ${raw.protocolName}`);
        }
    });
}
exports.processIncomingEcosystemSignal = processIncomingEcosystemSignal;
function processCoordination(heparOutput, cortexOutput) {
    return __awaiter(this, void 0, void 0, function* () {
        const coord = (0, synapse_core_1.coordinateCrossOrgan)(heparOutput.score, heparOutput.classification, cortexOutput.executive);
        const coordContainer = yield (0, cosmosClient_1.getSynapseContainer)('synapse-coordination');
        if (coord.conflict) {
            console.log("[Organ Integration] Conflict detected, triggering Founder Review.");
            yield coordContainer.items.upsert({ id: `coord-${Date.now()}`, conflict: true, unifiedOutput: 'CONFLICT-FLAGGED', timestamp: new Date().toISOString() });
        }
        else {
            yield coordContainer.items.upsert({ id: `coord-${Date.now()}`, conflict: false, unifiedOutput: coord.unifiedOutput, timestamp: new Date().toISOString() });
        }
    });
}
exports.processCoordination = processCoordination;
//# sourceMappingURL=organ-integration.js.map