import { getContainer } from "./cosmos-config";
import { buildCortexStrategicSnapshot } from "../../../src/cortex";
import { buildSynapseAdaptiveSnapshot } from "../../../src/synapse";
import { buildVoxNarrativeIntelligenceSnapshot } from "../../../src/vox";
import { buildPneumaMarketSnapshot } from "../../../src/pneuma";
import { buildCardiaAdaptiveSnapshot } from "../../../src/cardia";

export async function enrichLeadWithOrgans(lead: any, context: any) {
    context.log(`[Hepar Lead Scan] Enriching lead ${lead.daoId} with five assisting organs...`);

    // Cortex: Causal analysis & scenario synthesis
    const cortexReport = buildCortexStrategicSnapshot(lead);
    context.log(`[Cortex] Strategic scenarios generated for ${lead.protocolName}`);

    // Synapse: Routing & conflict arbitration
    const synapseRoute = buildSynapseAdaptiveSnapshot({ lead, cortexReport });
    context.log(`[Synapse] Routed with urgency: ${synapseRoute.urgency}`);

    // Vox: Narrative packaging for proposals/reports
    const voxPackage = buildVoxNarrativeIntelligenceSnapshot({ lead, cortexReport, synapseRoute });
    context.log(`[Vox] Narrative package ready for client delivery`);

    // Pneuma: Execution intelligence & outreach feasibility
    const pneumaDecision = buildPneumaMarketSnapshot({ lead, synapseRoute });
    context.log(`[Pneuma] Execution feasibility scored: ${pneumaDecision.feasibilityScore}`);

    // Cardia: Capital guardrails & allocation caps
    const cardiaGuardrail = buildCardiaAdaptiveSnapshot({ lead, pneumaDecision });
    context.log(`[Cardia] Allocation cap set to ${cardiaGuardrail.maxAllocation} with risk band ${cardiaGuardrail.riskBand}`);

    // Persist enriched data to Cosmos DB (Data Rail)
    const container = await getContainer("enriched-leads");
    await container.items.upsert({
        ...lead,
        cortexReport,
        synapseRoute,
        voxPackage,
        pneumaDecision,
        cardiaGuardrail,
        enrichedTimestamp: new Date().toISOString(),
        status: "ORGAN_ENRICHED"
    });

    context.log(`[Hepar Lead Scan] Lead ${lead.daoId} fully enriched by all five organs and persisted.`);
}
