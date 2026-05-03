export interface RawSignal {
    id: string;
    protocolName: string;
    description: string;
    confidence: number;
    capitalSeverity?: number; // 1-10
}

export interface ClassifiedSignal {
    signalId: string;
    type: 'protocol-event' | 'governance-activity' | 'market-regime' | 'exploit-alert' | 'ecosystem-state' | 'unverified';
    urgency: 'IMMEDIATE' | 'STANDARD' | 'LONGITUDINAL' | 'HOLD';
    target: 'HEPAR' | 'CORTEX' | 'BOTH' | 'HOLD';
    confidence: number;
    capitalSeverity?: number;
    raw: RawSignal;
}

export interface RoutingDecision {
    routingId: string;
    signalId: string;
    action: 'DISPATCH_HEPAR' | 'DISPATCH_CORTEX' | 'DISPATCH_BOTH' | 'BLOCKED' | 'ESCALATED' | 'ACCUMULATED';
    reason: string;
    timestamp: string;
    calibrationRun?: string;
}

export const POLICY = {
    conflictSeverityGap: 3,
    lowConfidenceBlockThreshold: 0.45,
    capitalEscalationMinSeverity: 2
};

export function classifySignal(raw: RawSignal): ClassifiedSignal {
    const desc = raw.description.toLowerCase();
    
    if (raw.confidence < POLICY.lowConfidenceBlockThreshold) {
        return { signalId: raw.id, type: 'unverified', urgency: 'HOLD', target: 'HOLD', confidence: raw.confidence, raw };
    }

    if (raw.capitalSeverity !== undefined && raw.capitalSeverity > POLICY.capitalEscalationMinSeverity) {
        return { signalId: raw.id, type: 'ecosystem-state', urgency: 'IMMEDIATE', target: 'BOTH', confidence: raw.confidence, capitalSeverity: raw.capitalSeverity, raw };
    }

    if (desc.includes("exploit")) {
        return { signalId: raw.id, type: 'exploit-alert', urgency: 'IMMEDIATE', target: 'HEPAR', confidence: raw.confidence, raw };
    }

    if (desc.includes("governance")) {
        return { signalId: raw.id, type: 'governance-activity', urgency: 'STANDARD', target: 'CORTEX', confidence: raw.confidence, raw };
    }

    if (desc.includes("series of low-severity signals")) {
        return { signalId: raw.id, type: 'protocol-event', urgency: 'LONGITUDINAL', target: 'HOLD', confidence: raw.confidence, raw };
    }

    return { signalId: raw.id, type: 'ecosystem-state', urgency: 'STANDARD', target: 'BOTH', confidence: raw.confidence, raw };
}

export function routeSignal(signal: ClassifiedSignal, accumulatedSignalsCount: number = 0): RoutingDecision {
    if (signal.confidence < POLICY.lowConfidenceBlockThreshold) {
        return {
            routingId: `route-${signal.signalId}`, signalId: signal.signalId, action: 'BLOCKED',
            reason: `Confidence ${signal.confidence} below threshold ${POLICY.lowConfidenceBlockThreshold}`, timestamp: new Date().toISOString()
        };
    }

    if (signal.capitalSeverity !== undefined && signal.capitalSeverity > POLICY.capitalEscalationMinSeverity) {
        return {
            routingId: `route-${signal.signalId}`, signalId: signal.signalId, action: 'ESCALATED',
            reason: `Capital severity ${signal.capitalSeverity} exceeds minimum ${POLICY.capitalEscalationMinSeverity}`, timestamp: new Date().toISOString()
        };
    }

    if (signal.urgency === 'LONGITUDINAL') {
        if (accumulatedSignalsCount >= 7) {
            return {
                routingId: `route-${signal.signalId}`, signalId: signal.signalId, action: 'DISPATCH_BOTH',
                reason: "Accumulated signals crossed routing threshold", timestamp: new Date().toISOString()
            };
        }
        return {
            routingId: `route-${signal.signalId}`, signalId: signal.signalId, action: 'ACCUMULATED',
            reason: "Held in accumulation", timestamp: new Date().toISOString()
        };
    }

    if (signal.urgency === 'IMMEDIATE') {
        return {
            routingId: `route-${signal.signalId}`, signalId: signal.signalId, action: 'DISPATCH_HEPAR',
            reason: "IMMEDIATE signal triggers Hepar execution within one cycle", timestamp: new Date().toISOString()
        };
    }

    if (signal.urgency === 'STANDARD') {
        return {
            routingId: `route-${signal.signalId}`, signalId: signal.signalId, action: 'DISPATCH_CORTEX',
            reason: "STANDARD signal triggers Cortex synthesis before Hepar", timestamp: new Date().toISOString()
        };
    }

    return { routingId: `route-${signal.signalId}`, signalId: signal.signalId, action: 'BLOCKED', reason: "Unclassified", timestamp: new Date().toISOString() };
}

export function coordinateCrossOrgan(heparScore: number, heparOutput: string, cortexOutput: string): { conflict: boolean; gap: number; unifiedOutput: string } {
    let gap = 0;
    if (heparOutput === 'ALLOW' && cortexOutput === 'RESTRICTED') gap = 4;
    else if (heparOutput === 'RESTRICTED' && cortexOutput === 'ALLOW') gap = 4;

    if (gap >= POLICY.conflictSeverityGap) {
        return { conflict: true, gap, unifiedOutput: 'CONFLICT-FLAGGED' };
    }
    return { conflict: false, gap, unifiedOutput: `COORDINATED: ${cortexOutput}` };
}
