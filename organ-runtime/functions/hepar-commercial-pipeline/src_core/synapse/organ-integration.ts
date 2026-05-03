import { classifySignal, routeSignal, coordinateCrossOrgan, RawSignal } from './synapse-core';
import { getSynapseContainer } from './cosmosClient';

// Mock hook to demonstrate integration wired properly
export async function processIncomingEcosystemSignal(raw: RawSignal) {
    const classified = classifySignal(raw);
    const decision = routeSignal(classified);

    const routingContainer = await getSynapseContainer('synapse-routing');
    await routingContainer.items.upsert(decision);

    if (decision.action === 'DISPATCH_HEPAR') {
        console.log(`[Organ Integration] Triggered Hepar Assessment for ${raw.protocolName}`);
    } else if (decision.action === 'DISPATCH_CORTEX') {
        console.log(`[Organ Integration] Triggered Cortex Synthesis for ${raw.protocolName}`);
    } else if (decision.action === 'ESCALATED') {
        console.log(`[Organ Integration] Triggered Founder Review directly due to Capital Escalation`);
    } else if (decision.action === 'DISPATCH_BOTH') {
        console.log(`[Organ Integration] Triggered Hepar then Cortex systematically for ${raw.protocolName}`);
    }
}

export async function processCoordination(heparOutput: any, cortexOutput: any) {
    const coord = coordinateCrossOrgan(heparOutput.score, heparOutput.classification, cortexOutput.executive);
    const coordContainer = await getSynapseContainer('synapse-coordination');
    
    if (coord.conflict) {
        console.log("[Organ Integration] Conflict detected, triggering Founder Review.");
        await coordContainer.items.upsert({ id: `coord-${Date.now()}`, conflict: true, unifiedOutput: 'CONFLICT-FLAGGED', timestamp: new Date().toISOString() });
    } else {
        await coordContainer.items.upsert({ id: `coord-${Date.now()}`, conflict: false, unifiedOutput: coord.unifiedOutput, timestamp: new Date().toISOString() });
    }
}
