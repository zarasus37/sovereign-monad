import { AzureFunction, Context } from "@azure/functions";
import { runProposalGenerationEngine } from "../../../src/hepar/commercial/3-proposal-generation-engine";
import { logExecution, logFounderReview } from "../shared/logger";

const timerTrigger: AzureFunction = async function (context: Context, documents: any[]): Promise<void> {
    context.log(`[${new Date().toISOString()}] ${context.executionContext.functionName} triggered.`);
    
    await logExecution(context.executionContext.functionName, 'STARTED');

    try {
        // Execute the underlying engine
        await runProposalGenerationEngine();

        // If the function handles events that require founder review, we log it.
        // E.g., HTTP webhook for payment, or tracking Cosmos changes.
        

        
        
        await logExecution(context.executionContext.functionName, 'COMPLETED');
    } catch (error) {
        context.log.error(`[${new Date().toISOString()}] Error in ${context.executionContext.functionName}: `, error);
        await logExecution(context.executionContext.functionName, 'FAILED', { error: error.message });
        throw error;
    }
};

export default timerTrigger;\n