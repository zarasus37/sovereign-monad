import { generatePneumaIntelligence, RawMarketData } from './pneuma-core';
import { getPneumaContainer } from './cosmosClient';

// Integration mockup connecting Pneuma to Hepar, Cortex and Synapse
export async function triggerPneumaForHeparAssessment(mandateId: string, rawMarketData: RawMarketData) {
    console.log(`[Pneuma] Triggering market snapshot for mandate: ${mandateId}`);
    
    const intelligence = generatePneumaIntelligence(rawMarketData);
    
    // Write to Pneuma containers
    const marketContainer = await getPneumaContainer('pneuma-market');
    const execContainer = await getPneumaContainer('pneuma-execution');
    const regimeContainer = await getPneumaContainer('pneuma-regime');

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
