"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.processIncomingEcosystemSignal = processIncomingEcosystemSignal;
exports.processCoordination = processCoordination;
const synapse_core_1 = require("./synapse-core");
const cosmosClient_1 = require("./cosmosClient");
// Mock hook to demonstrate integration wired properly
async function processIncomingEcosystemSignal(raw) {
    const classified = (0, synapse_core_1.classifySignal)(raw);
    const decision = (0, synapse_core_1.routeSignal)(classified);
    const routingContainer = await (0, cosmosClient_1.getSynapseContainer)('synapse-routing');
    await routingContainer.items.upsert(decision);
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
}
async function processCoordination(heparOutput, cortexOutput) {
    const coord = (0, synapse_core_1.coordinateCrossOrgan)(heparOutput.score, heparOutput.classification, cortexOutput.executive);
    const coordContainer = await (0, cosmosClient_1.getSynapseContainer)('synapse-coordination');
    if (coord.conflict) {
        console.log("[Organ Integration] Conflict detected, triggering Founder Review.");
        await coordContainer.items.upsert({ id: `coord-${Date.now()}`, conflict: true, unifiedOutput: 'CONFLICT-FLAGGED', timestamp: new Date().toISOString() });
    }
    else {
        await coordContainer.items.upsert({ id: `coord-${Date.now()}`, conflict: false, unifiedOutput: coord.unifiedOutput, timestamp: new Date().toISOString() });
    }
}
