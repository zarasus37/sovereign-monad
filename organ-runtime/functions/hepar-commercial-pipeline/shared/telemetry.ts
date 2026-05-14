import * as appInsights from "applicationinsights";

// Initialize Application Insights (no-op if key is not set)
const instrumentationKey = process.env["APPINSIGHTS_INSTRUMENTATIONKEY"] || "";
let client: appInsights.TelemetryClient | null = null;

if (instrumentationKey) {
    appInsights.setup(instrumentationKey)
        .setAutoCollectRequests(true)
        .setAutoCollectPerformance(true)
        .setAutoCollectExceptions(true)
        .setAutoCollectDependencies(true)
        .start();
    client = appInsights.defaultClient;
}

/**
 * Track a named event with optional properties.
 */
export function trackEvent(name: string, properties?: Record<string, string>) {
    if (client) {
        client.trackEvent({ name, properties });
    }
}

/**
 * Track a numeric metric (e.g., lead count, success rate).
 */
export function trackMetric(name: string, value: number) {
    if (client) {
        client.trackMetric({ name, value });
    }
}

/**
 * Track an exception for error monitoring.
 */
export function trackException(error: Error, properties?: Record<string, string>) {
    if (client) {
        client.trackException({ exception: error, properties });
    }
}

/**
 * Flush all pending telemetry. Call at function completion.
 */
export function flushTelemetry(): Promise<void> {
    return new Promise((resolve) => {
        if (client) {
            client.flush({ callback: () => resolve() });
        } else {
            resolve();
        }
    });
}
