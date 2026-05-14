import { AzureFunction, Context } from "@azure/functions";
import { getContainer } from "../hepar-lead-scan/cosmos-config";
import { logExecution } from "../shared/logger";
import { sendDiscordNotification } from "./discord-sender";
import { trackEvent, trackMetric, trackException, flushTelemetry } from "../shared/telemetry";

/**
 * Outreach Engine
 * Triggered by new documents in the `proposals` Cosmos container.
 * Picks up generated proposals and executes real outreach via Discord webhook.
 */
const outreach: AzureFunction = async function (context: Context, documents: any[]): Promise<void> {
    context.log(`[${new Date().toISOString()}] [Outreach] Triggered with ${documents.length} proposal(s)`);
    trackEvent("hepar.outreach.triggered", { count: String(documents.length) });

    await logExecution(context.executionContext.functionName, 'STARTED');

    try {
        const outreachContainer = await getContainer("outreach-queue");
        let sent = 0;
        let failed = 0;

        for (const proposal of documents) {
            if (proposal.status !== "PROPOSAL_GENERATED") {
                context.log(`[Outreach] Skipping ${proposal.daoId} — status: ${proposal.status}`);
                continue;
            }

            context.log(`[Outreach] Preparing outreach for ${proposal.protocolName} | Tier: ${proposal.proposalTier}`);

            // Determine outreach channel based on proposal tier
            let channels: string[];
            let priority: string;
            switch (proposal.proposalTier) {
                case "FULL_ENGAGEMENT":
                    channels = ["discord", "direct-email", "dao-forum"];
                    priority = "HIGH";
                    break;
                case "ADVISORY_ONLY":
                    channels = ["discord"];
                    priority = "LOW";
                    break;
                default:
                    channels = ["discord", "dao-forum"];
                    priority = "MEDIUM";
            }

            // Build outreach record
            const outreachRecord = {
                id: `outreach-${proposal.daoId}-${Date.now()}`,
                proposalId: proposal.proposalId,
                daoId: proposal.daoId,
                protocolName: proposal.protocolName,
                proposalTier: proposal.proposalTier,
                channels,
                priority,
                organSummary: proposal.organSummary || proposal.executiveSummary,
                engagementTerms: proposal.engagementTerms,
                status: "PENDING",
                sentAt: new Date().toISOString(),
                followUpDue: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days
                deliveryStatus: "PENDING"
            };

            // ── REAL OUTREACH: Send Discord notification ──
            const delivered = await sendDiscordNotification(outreachRecord);
            outreachRecord.deliveryStatus = delivered ? "DELIVERED" : "DELIVERY_FAILED";
            outreachRecord.status = delivered ? "OUTREACH_SENT" : "OUTREACH_FAILED";

            if (delivered) {
                sent++;
                context.log(`[Outreach] ✅ Discord notification DELIVERED for ${proposal.protocolName} | Priority: ${priority}`);
            } else {
                failed++;
                context.log(`[Outreach] ⚠️ Discord delivery FAILED for ${proposal.protocolName} (webhook not configured or request failed)`);
            }

            await outreachContainer.items.upsert(outreachRecord);
        }

        trackMetric("hepar.outreach.sent", sent);
        trackMetric("hepar.outreach.failed", failed);
        trackEvent("hepar.outreach.completed", { sent: String(sent), failed: String(failed) });
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

export default outreach;
