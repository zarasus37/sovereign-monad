import { CardiaCapitalState, CardiaDecision, CardiaRuntimeSnapshot } from './types';

function laneDecision(state: CardiaCapitalState, lane: CardiaCapitalState['lanes'][number]): CardiaDecision {
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

export function buildCardiaSnapshot(state: CardiaCapitalState): CardiaRuntimeSnapshot {
  const reserveHealthy = state.reserveRatioPercent >= state.minReserveRatioPercent;
  const decisions = state.lanes.map((lane) => laneDecision(state, lane));
  const lanesHealthy = decisions.every((decision) => decision.healthy);

  let deploymentMode: CardiaRuntimeSnapshot['deploymentMode'] = 'blocked';
  if (reserveHealthy && lanesHealthy && state.deploymentReadiness === 'ready') {
    deploymentMode = 'bounded_ready';
  } else if (state.deploymentReadiness === 'bounded' || state.deploymentReadiness === 'blocked') {
    deploymentMode = 'analysis_only';
  }

  return {
    implemented: true,
    reserveHealthy,
    deploymentMode,
    decisions,
  };
}
