import { AzureFunction, Context } from "@azure/functions";
import { runMonitoringNotificationEngine } from "../src_core/hepar/commercial/6-monitoring-notification-engine";
import { logExecution, logFounderReview } from "../shared/logger";
import { trackEvent, trackMetric, trackException, flushTelemetry } from "../shared/telemetry";

const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
    context.log(`[${new Date().toISOString()}] ${context.executionContext.functionName} triggered.`);
    trackEvent("hepar.monitor.triggered");
    
    await logExecution(context.executionContext.functionName, 'STARTED');

    try {
        // Execute the underlying engine
        await runMonitoringNotificationEngine();

        // If the function handles events that require founder review, we log it.
        // E.g., HTTP webhook for payment, or tracking Cosmos changes.
        
        // In reality, monitoring engine might detect a HARDBLOCK, the wrapper can't easily know unless it reads Cosmos
        // but we ensure the wrapper logs its completion successfully.
        
        trackEvent("hepar.monitor.completed");
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

export default timerTrigger;

