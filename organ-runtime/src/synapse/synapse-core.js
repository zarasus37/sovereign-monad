"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coordinateCrossOrgan = exports.routeSignal = exports.classifySignal = exports.POLICY = void 0;
exports.POLICY = {
    conflictSeverityGap: 3,
    lowConfidenceBlockThreshold: 0.45,
    capitalEscalationMinSeverity: 2
};
function classifySignal(raw) {
    const desc = raw.description.toLowerCase();
    if (raw.confidence < exports.POLICY.lowConfidenceBlockThreshold) {
        return { signalId: raw.id, type: 'unverified', urgency: 'HOLD', target: 'HOLD', confidence: raw.confidence, raw };
    }
    if (raw.capitalSeverity !== undefined && raw.capitalSeverity > exports.POLICY.capitalEscalationMinSeverity) {
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
exports.classifySignal = classifySignal;
function routeSignal(signal, accumulatedSignalsCount = 0) {
    if (signal.confidence < exports.POLICY.lowConfidenceBlockThreshold) {
        return {
            routingId: `route-${signal.signalId}`, signalId: signal.signalId, action: 'BLOCKED',
            reason: `Confidence ${signal.confidence} below threshold ${exports.POLICY.lowConfidenceBlockThreshold}`, timestamp: new Date().toISOString()
        };
    }
    if (signal.capitalSeverity !== undefined && signal.capitalSeverity > exports.POLICY.capitalEscalationMinSeverity) {
        return {
            routingId: `route-${signal.signalId}`, signalId: signal.signalId, action: 'ESCALATED',
            reason: `Capital severity ${signal.capitalSeverity} exceeds minimum ${exports.POLICY.capitalEscalationMinSeverity}`, timestamp: new Date().toISOString()
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
exports.routeSignal = routeSignal;
function coordinateCrossOrgan(heparScore, heparOutput, cortexOutput) {
    let gap = 0;
    if (heparOutput === 'ALLOW' && cortexOutput === 'RESTRICTED')
        gap = 4;
    else if (heparOutput === 'RESTRICTED' && cortexOutput === 'ALLOW')
        gap = 4;
    if (gap >= exports.POLICY.conflictSeverityGap) {
        return { conflict: true, gap, unifiedOutput: 'CONFLICT-FLAGGED' };
    }
    return { conflict: false, gap, unifiedOutput: `COORDINATED: ${cortexOutput}` };
}
exports.coordinateCrossOrgan = coordinateCrossOrgan;
//# sourceMappingURL=synapse-core.js.map