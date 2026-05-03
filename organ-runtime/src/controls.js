"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildImmuneSnapshot = exports.buildSignalingSnapshot = exports.buildHomeostasisSnapshot = void 0;
function buildBreach(metric) {
    return {
        name: metric.name,
        current: metric.current,
        range: `${metric.min}-${metric.max} ${metric.unit}`.trim(),
        correctiveAction: metric.correctiveAction,
    };
}
function buildHomeostasisSnapshot(metrics) {
    const breaches = metrics
        .filter((metric) => metric.current < metric.min || metric.current > metric.max)
        .map(buildBreach);
    return {
        implemented: true,
        healthy: breaches.length === 0,
        metricCount: metrics.length,
        breaches,
    };
}
exports.buildHomeostasisSnapshot = buildHomeostasisSnapshot;
function buildSignalingSnapshot(signals) {
    const fastLaneSignalIds = signals
        .filter((signal) => signal.latency === 'urgent' || signal.latency === 'immediate')
        .map((signal) => signal.id);
    const slowLaneSignalIds = signals
        .filter((signal) => signal.latency === 'normal' || signal.latency === 'slow')
        .map((signal) => signal.id);
    return {
        implemented: true,
        fastLaneSignalIds,
        slowLaneSignalIds,
    };
}
exports.buildSignalingSnapshot = buildSignalingSnapshot;
function buildImmuneDecision(incident) {
    const barrierTriggered = incident.selfBoundaryViolated || incident.severity === 'critical';
    const containmentAction = barrierTriggered
        ? 'trigger barrier and quarantine the affected lane'
        : incident.contained
            ? 'containment already in place; monitor and preserve memory'
            : 'raise alert and apply bounded containment';
    const repairAction = incident.needsRepair
        ? 'open repair loop with postmortem, tightened controls, and controlled re-entry'
        : null;
    return {
        incidentId: incident.id,
        barrierTriggered,
        containmentAction,
        repairAction,
    };
}
function buildImmuneSnapshot(incidents) {
    const decisions = incidents.map(buildImmuneDecision);
    return {
        implemented: true,
        incidentCount: incidents.length,
        barrierTriggerCount: decisions.filter((decision) => decision.barrierTriggered).length,
        repairQueueCount: decisions.filter((decision) => decision.repairAction !== null).length,
        decisions,
    };
}
exports.buildImmuneSnapshot = buildImmuneSnapshot;
//# sourceMappingURL=controls.js.map