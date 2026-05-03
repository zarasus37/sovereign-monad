import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { runCloseAndOnboardingEngine } from "../../../src/hepar/commercial/7-close-onboarding-engine";
import { logExecution, logFounderReview } from "../shared/logger";

const timerTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log(`[${new Date().toISOString()}] ${context.executionContext.functionName} triggered.`);
    
    await logExecution(context.executionContext.functionName, 'STARTED');

    try {
        // Execute the underlying engine
        await runCloseAndOnboardingEngine();

        // If the function handles events that require founder review, we log it.
        // E.g., HTTP webhook for payment, or tracking Cosmos changes.
        
        if (req && req.body && req.body.paymentStatus === 'confirmed') {
            await logFounderReview('PAYMENT_CONFIRMED', 'Payment received via Stripe', req.body);
        }
        

        
        
        await logExecution(context.executionContext.functionName, 'COMPLETED');
    } catch (error) {
        context.log.error(`[${new Date().toISOString()}] Error in ${context.executionContext.functionName}: `, error);
        await logExecution(context.executionContext.functionName, 'FAILED', { error: error.message });
        throw error;
    }
};

export default timerTrigger;\n