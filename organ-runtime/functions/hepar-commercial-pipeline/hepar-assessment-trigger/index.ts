import { AzureFunction, Context } from "@azure/functions";
import { getContainer } from "../hepar-lead-scan/cosmos-config";
import { logExecution } from "../shared/logger";
import { trackEvent, trackMetric, trackException, flushTelemetry } from "../shared/telemetry";

/**
 * Assessment Trigger
 * Triggered by new documents in the `enriched-leads` Cosmos container.
 * Runs a deep assessment on enriched leads that meet escalation criteria
 * (Cortex stress elevated, Synapse escalations, or Cardia blocks).
 */
const assessmentTrigger: AzureFunction = async function (context: Context, documents: any[]): Promise<void> {
    context.log(`[${new Date().toISOString()}] [Assessment Trigger] Triggered with ${documents.length} enriched lead(s)`);
    trackEvent("hepar.assessment.triggered", { count: String(documents.length) });

    await logExecution(context.executionContext.functionName, 'STARTED');

    try {
        const assessmentsContainer = await getContainer("assessments");
        let assessed = 0;
        let skipped = 0;

        for (const enrichedLead of documents) {
            if (enrichedLead.status !== "ORGAN_ENRICHED") {
                continue;
            }

            // Check if this lead needs deep assessment based on organ signals
            const cortexStress = enrichedLead.cortexReport?.averageStressIndex ?? 0;
            const synapseEscalations = enrichedLead.synapseRoute?.escalations ?? 0;
            const cardiaBlocked = enrichedLead.cardiaGuardrail?.blockedCount ?? 0;
            const hasConflicts = (enrichedLead.synapseRoute?.conflicts?.length ?? 0) > 0;

            const needsDeepAssessment = cortexStress > 0.5 || synapseEscalations > 0 || cardiaBlocked > 0 || hasConflicts;

            if (!needsDeepAssessment) {
                context.log(`[Assessment Trigger] ${enrichedLead.protocolName} — organ signals nominal, skipping deep assessment`);
                skipped++;
                continue;
            }

            context.log(`[Assessment Trigger] Deep assessment triggered for ${enrichedLead.protocolName} (stress=${cortexStress}, escalations=${synapseEscalations}, blocked=${cardiaBlocked})`);

            // Build assessment record with escalation reasons
            const escalationReasons: string[] = [];
            if (cortexStress > 0.5) escalationReasons.push(`Cortex stress elevated (${cortexStress})`);
            if (synapseEscalations > 0) escalationReasons.push(`${synapseEscalations} Synapse escalation(s)`);
            if (cardiaBlocked > 0) escalationReasons.push(`${cardiaBlocked} Cardia block(s)`);
            if (hasConflicts) escalationReasons.push(`${enrichedLead.synapseRoute.conflicts.length} signal conflict(s)`);

            const assessment = {
                id: `assess-${enrichedLead.daoId}-${Date.now()}`,
                daoId: enrichedLead.daoId,
                protocolName: enrichedLead.protocolName,
                heparScore: enrichedLead.heparScore,
                escalationReasons,
                cortexReport: enrichedLead.cortexReport,
                synapseRoute: enrichedLead.synapseRoute,
                cardiaGuardrail: enrichedLead.cardiaGuardrail,
                status: "ASSESSMENT_PENDING",
                triggeredAt: new Date().toISOString(),
                sourceLeadId: enrichedLead.id
            };

            await assessmentsContainer.items.upsert(assessment);
            assessed++;
            context.log(`[Assessment Trigger] ✅ Assessment created for ${enrichedLead.protocolName} — ${escalationReasons.length} escalation reason(s)`);
        }

        trackMetric("hepar.assessments.created", assessed);
        trackMetric("hepar.assessments.skipped", skipped);
        trackEvent("hepar.assessment.completed", { assessed: String(assessed), skipped: String(skipped) });
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

export default assessmentTrigger;
