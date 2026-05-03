import { AzureFunction, Context } from "@azure/functions";
import { runMonitoringNotificationEngine } from "../../../src/hepar/commercial/6-monitoring-notification-engine";
import { logExecution, logFounderReview } from "../shared/logger";

const timerTrigger: AzureFunction = async function (context: Context, myTimer: any): Promise<void> {
    context.log(`[${new Date().toISOString()}] ${context.executionContext.functionName} triggered.`);
    
    await logExecution(context.executionContext.functionName, 'STARTED');

    try {
        // Execute the underlying engine
        await runMonitoringNotificationEngine();

        // If the function handles events that require founder review, we log it.
        // E.g., HTTP webhook for payment, or tracking Cosmos changes.
        

        
        // In reality, monitoring engine might detect a HARDBLOCK, the wrapper can't easily know unless it reads Cosmos
        // but we ensure the wrapper logs its completion successfully.
        
        
        await logExecution(context.executionContext.functionName, 'COMPLETED');
    } catch (error) {
        context.log.error(`[${new Date().toISOString()}] Error in ${context.executionContext.functionName}: `, error);
        await logExecution(context.executionContext.functionName, 'FAILED', { error: error.message });
        throw error;
    }
};

export default timerTrigger;\n