"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerPneumaForHeparAssessment = triggerPneumaForHeparAssessment;
const pneuma_core_1 = require("./pneuma-core");
const cosmosClient_1 = require("./cosmosClient");
// Integration mockup connecting Pneuma to Hepar, Cortex and Synapse
async function triggerPneumaForHeparAssessment(mandateId, rawMarketData) {
    console.log(`[Pneuma] Triggering market snapshot for mandate: ${mandateId}`);
    const intelligence = (0, pneuma_core_1.generatePneumaIntelligence)(rawMarketData);
    // Write to Pneuma containers
    const marketContainer = await (0, cosmosClient_1.getPneumaContainer)('pneuma-market');
    const execContainer = await (0, cosmosClient_1.getPneumaContainer)('pneuma-execution');
    const regimeContainer = await (0, cosmosClient_1.getPneumaContainer)('pneuma-regime');
    await marketContainer.items.upsert(intelligence.snapshot);
    await execContainer.items.upsert(intelligence.execution);
    await regimeContainer.items.upsert(intelligence.regime);
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
}
