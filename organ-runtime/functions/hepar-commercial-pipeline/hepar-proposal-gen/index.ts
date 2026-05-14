import { AzureFunction, Context } from "@azure/functions";
import { getContainer } from "../hepar-lead-scan/cosmos-config";
import { logExecution } from "../shared/logger";
import { buildProposalDocument } from "./proposal-builder";
import { trackEvent, trackMetric, trackException, flushTelemetry } from "../shared/telemetry";

/**
 * Proposal Generation Engine
 * Triggered by new documents in the `enriched-leads` Cosmos container.
 * Consumes the full organ-enriched lead (Cortex, Synapse, Vox, Pneuma, Cardia)
 * and generates an institutional-quality proposal document.
 */
const proposalGen: AzureFunction = async function (context: Context, documents: any[]): Promise<void> {
    context.log(`[${new Date().toISOString()}] [Proposal Gen] Triggered with ${documents.length} enriched lead(s)`);
    trackEvent("hepar.proposal-gen.triggered", { count: String(documents.length) });

    await logExecution(context.executionContext.functionName, 'STARTED');

    try {
        const proposalsContainer = await getContainer("proposals");
        let generated = 0;

        for (const enrichedLead of documents) {
            if (enrichedLead.status !== "ORGAN_ENRICHED") {
                context.log(`[Proposal Gen] Skipping lead ${enrichedLead.daoId} — status: ${enrichedLead.status}`);
                continue;
            }

            context.log(`[Proposal Gen] Building proposal for ${enrichedLead.protocolName} (${enrichedLead.daoId})`);

            // Build full structured proposal from organ intelligence
            const proposal = buildProposalDocument(enrichedLead);

            await proposalsContainer.items.upsert(proposal);
            generated++;

            context.log(`[Proposal Gen] ✅ Proposal generated: ${proposal.proposalId} | Tier: ${proposal.proposalTier} | Protocol: ${enrichedLead.protocolName}`);
            context.log(`[Proposal Gen]    Executive: ${proposal.executiveSummary.riskPosture}`);
            context.log(`[Proposal Gen]    Engagement: ${proposal.engagementTerms.estimatedValue}`);
        }

        trackMetric("hepar.proposals.generated", generated);
        trackEvent("hepar.proposal-gen.completed", { generated: String(generated) });
        await logExecution(context.executionContext.functionName, 'COMPLETED');
        await flushTelemetry();
    } catch (error: any) {
        context.log.error(`[${new Date().toISOString()}] Error in ${context.executionContext.functionName}: `, error);
        trackException(error);
        await logExecution(context.executionContext.functionName, 'FAILED', { error: error.message });
        await flushTelemetry();
        throw error;
    }
};

export default proposalGen;
