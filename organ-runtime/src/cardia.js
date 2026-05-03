"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCardiaSnapshot = void 0;
function laneDecision(state, lane) {
    if (lane.allocatedPercent > lane.maxPercent) {
        return {
            lane: lane.name,
            healthy: false,
            reason: `allocation ${lane.allocatedPercent}% exceeds max ${lane.maxPercent}%`,
        };
    }
    return {
        lane: lane.name,
        healthy: true,
        reason: `allocation ${lane.allocatedPercent}% remains within max ${lane.maxPercent}%`,
    };
}
function buildCardiaSnapshot(state) {
    const reserveHealthy = state.reserveRatioPercent >= state.minReserveRatioPercent;
    const decisions = state.lanes.map((lane) => laneDecision(state, lane));
    const lanesHealthy = decisions.every((decision) => decision.healthy);
    let deploymentMode = 'blocked';
    if (reserveHealthy && lanesHealthy && state.deploymentReadiness === 'ready') {
        deploymentMode = 'bounded_ready';
    }
    else if (state.deploymentReadiness === 'bounded' || state.deploymentReadiness === 'blocked') {
        deploymentMode = 'analysis_only';
    }
    return {
        implemented: true,
        reserveHealthy,
        deploymentMode,
        decisions,
    };
}
exports.buildCardiaSnapshot = buildCardiaSnapshot;
//# sourceMappingURL=cardia.js.map