import { AzureFunction, Context } from "@azure/functions";
import { getContainer } from "../hepar-lead-scan/cosmos-config";
import { logExecution } from "../shared/logger";
import { trackEvent, trackMetric, trackException, flushTelemetry } from "../shared/telemetry";

/**
 * Follow-Up Engine
 * Timer trigger — runs every 12 hours.
 * Queries the outreach-log for records that are past their follow-up due date
 * and have not been closed, then logs follow-up actions.
 */
const followup: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
    context.log(`[${new Date().toISOString()}] [Follow-up] Follow-up engine triggered`);
    trackEvent("hepar.followup.triggered");

    await logExecution(context.executionContext.functionName, 'STARTED');

    try {
        const outreachContainer = await getContainer("outreach-queue");
        const now = new Date().toISOString();

        // Query for outreach records that are past follow-up due date and still open
        const { resources: pendingFollowups } = await outreachContainer.items
            .query({
                query: "SELECT * FROM c WHERE c.followUpDue <= @now AND c.status = 'OUTREACH_SENT'",
                parameters: [{ name: "@now", value: now }]
            })
            .fetchAll();

        context.log(`[Follow-up] Found ${pendingFollowups.length} pending follow-up(s)`);

        for (const record of pendingFollowups) {
            context.log(`[Follow-up] Following up on ${record.protocolName} (${record.daoId}) — originally sent ${record.sentAt}`);

            // Update the record to reflect follow-up attempt
            record.status = "FOLLOW_UP_SENT";
            record.followUpCount = (record.followUpCount || 0) + 1;
            record.lastFollowUpAt = now;
            record.followUpDue = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(); // next follow-up in 5 days

            // After 3 follow-ups without response, mark as cold
            if (record.followUpCount >= 3) {
                record.status = "COLD";
                context.log(`[Follow-up] ⚠️ ${record.protocolName} marked COLD after ${record.followUpCount} follow-ups`);
            }

            await outreachContainer.items.upsert(record);
            context.log(`[Follow-up] ✅ Follow-up #${record.followUpCount} sent for ${record.protocolName}`);
        }

        trackMetric("hepar.followups.processed", pendingFollowups.length);
        trackEvent("hepar.followup.completed", { processed: String(pendingFollowups.length) });
        context.log(`[${new Date().toISOString()}] [Follow-up] Follow-up engine run complete. ${pendingFollowups.length} records processed.`);
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

export default followup;
