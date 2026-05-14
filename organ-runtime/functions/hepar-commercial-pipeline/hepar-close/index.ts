import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { runCloseAndOnboardingEngine } from "../src_core/hepar/commercial/7-close-onboarding-engine";
import { logExecution, logFounderReview } from "../shared/logger";
import { trackEvent, trackException, flushTelemetry } from "../shared/telemetry";

const timerTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log(`[${new Date().toISOString()}] ${context.executionContext.functionName} triggered.`);
    trackEvent("hepar.close.triggered");
    
    await logExecution(context.executionContext.functionName, 'STARTED');

    try {
        // Execute the underlying engine
        await runCloseAndOnboardingEngine();

        // If the function handles events that require founder review, we log it.
        // E.g., HTTP webhook for payment, or tracking Cosmos changes.
        
        if (req && req.body && req.body.paymentStatus === 'confirmed') {
            await logFounderReview('PAYMENT_CONFIRMED', 'Payment received via Stripe', req.body);
            trackEvent("hepar.close.payment_confirmed");
        }
        
        trackEvent("hepar.close.completed");
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

