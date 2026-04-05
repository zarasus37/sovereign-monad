import path from 'path';
import {
  PopulationGap,
  PopulationGrowthEvent,
  PopulationGrowthMetrics,
  PopulationGrowthRecommendation,
  PopulationGrowthSnapshot,
  PopulationGrowthThresholds,
} from './types';

function buildRecommendations(
  gaps: PopulationGap[],
  events: PopulationGrowthEvent[],
): PopulationGrowthRecommendation[] {
  const recommendations: PopulationGrowthRecommendation[] = [];
  const actorClasses = new Set(events.map((event) => event.actorClass));
  const surfaces = new Set(events.map((event) => event.surface));
  const outcomes = new Set(events.map((event) => event.outcome));

  for (const gap of gaps) {
    switch (gap.dimension) {
      case 'event_count':
        recommendations.push({
          priority: 'high',
          action: `capture at least ${gap.missing} more attributable behavioral events before any externalization review`,
          targetDimension: gap.dimension,
        });
        break;
      case 'distinct_actors':
        recommendations.push({
          priority: 'high',
          action: `add ${gap.missing} distinct contributors to reduce single-threaded population risk`,
          targetDimension: gap.dimension,
        });
        break;
      case 'actor_classes':
        recommendations.push({
          priority: 'high',
          action: `expand participation beyond current classes (${Array.from(actorClasses).join(', ')})`,
          targetDimension: gap.dimension,
        });
        break;
      case 'surfaces':
        recommendations.push({
          priority: 'medium',
          action: `capture activity on additional surfaces beyond ${Array.from(surfaces).join(', ')}`,
          targetDimension: gap.dimension,
        });
        break;
      case 'outcomes':
        recommendations.push({
          priority: 'medium',
          action: `increase behavioral diversity beyond outcomes ${Array.from(outcomes).join(', ')}`,
          targetDimension: gap.dimension,
        });
        break;
      case 'actor_concentration':
        recommendations.push({
          priority: 'high',
          action: 'dilute single-actor dominance by growing contributions from other actors rather than increasing the dominant actor',
          targetDimension: gap.dimension,
        });
        break;
      case 'population_mix':
        recommendations.push({
          priority: 'high',
          action: 'establish both ecosystem-native and non-native contribution windows before any external rights activation',
          targetDimension: gap.dimension,
        });
        break;
    }
  }

  return recommendations;
}

export function buildPopulationGrowthSnapshot(
  metrics: PopulationGrowthMetrics,
  thresholds: PopulationGrowthThresholds,
  events: PopulationGrowthEvent[],
): PopulationGrowthSnapshot {
  const gaps: PopulationGap[] = [];

  if (metrics.totalEvents < thresholds.minimumEventCount) {
    gaps.push({
      dimension: 'event_count',
      current: metrics.totalEvents,
      target: thresholds.minimumEventCount,
      missing: thresholds.minimumEventCount - metrics.totalEvents,
      reason: 'total behavioral volume is below the minimum threshold',
    });
  }

  if (metrics.distinctActors < thresholds.minimumDistinctActors) {
    gaps.push({
      dimension: 'distinct_actors',
      current: metrics.distinctActors,
      target: thresholds.minimumDistinctActors,
      missing: thresholds.minimumDistinctActors - metrics.distinctActors,
      reason: 'not enough distinct actors are represented',
    });
  }

  if (metrics.actorClassCount < thresholds.minimumActorClasses) {
    gaps.push({
      dimension: 'actor_classes',
      current: metrics.actorClassCount,
      target: thresholds.minimumActorClasses,
      missing: thresholds.minimumActorClasses - metrics.actorClassCount,
      reason: 'behavioral population does not span enough actor classes',
    });
  }

  if (metrics.surfaceCount < thresholds.minimumSurfaces) {
    gaps.push({
      dimension: 'surfaces',
      current: metrics.surfaceCount,
      target: thresholds.minimumSurfaces,
      missing: thresholds.minimumSurfaces - metrics.surfaceCount,
      reason: 'behavioral evidence does not span enough surfaces',
    });
  }

  if (metrics.outcomeCount < thresholds.minimumOutcomes) {
    gaps.push({
      dimension: 'outcomes',
      current: metrics.outcomeCount,
      target: thresholds.minimumOutcomes,
      missing: thresholds.minimumOutcomes - metrics.outcomeCount,
      reason: 'behavioral evidence does not span enough outcomes',
    });
  }

  if (metrics.largestActorShare > thresholds.maximumSingleActorShare) {
    gaps.push({
      dimension: 'actor_concentration',
      current: metrics.largestActorShare,
      target: thresholds.maximumSingleActorShare,
      missing: metrics.largestActorShare - thresholds.maximumSingleActorShare,
      reason: 'one actor still represents too much of the sample',
    });
  }

  if (
    thresholds.requireEcosystemNativeAndNonNativeMix &&
    (metrics.ecosystemNativeShare === 0 || metrics.nonNativeShare === 0)
  ) {
    gaps.push({
      dimension: 'population_mix',
      current: `native=${metrics.ecosystemNativeShare}, non_native=${metrics.nonNativeShare}`,
      target: 'native>0 and non_native>0',
      missing: 'mixed participation',
      reason: 'ecosystem-native and non-native contribution mix is missing',
    });
  }

  return {
    implemented: true,
    thresholdsDefined: true,
    thresholdsMet: gaps.length === 0,
    metrics,
    gapCount: gaps.length,
    gaps,
    recommendations: buildRecommendations(gaps, events),
    executedActions:
      gaps.length === 0
        ? [
            `population now spans ${metrics.totalEvents} attributable events`,
            `population now spans ${metrics.distinctActors} distinct actors across ${metrics.actorClassCount} actor classes`,
            `population now spans ${metrics.surfaceCount} surfaces and ${metrics.outcomeCount} outcomes`,
          ]
        : [],
  };
}

export function loadLocalPopulationGrowthSnapshot(packageRoot: string): PopulationGrowthSnapshot {
  const governanceModulePath = path.resolve(packageRoot, 'data-rail-governance', 'dist', 'src', 'index.js');
  const dataRailModulePath = path.resolve(packageRoot, 'data-rail-core', 'dist', 'src', 'index.js');
  const thresholdsPath = path.resolve(packageRoot, 'data-rail-governance', 'dist', 'config', 'thresholds.json');
  const { buildGovernanceSnapshot } = require(governanceModulePath) as {
    buildGovernanceSnapshot: (events: PopulationGrowthEvent[]) => {
      diversity: { metrics: PopulationGrowthMetrics };
    };
  };
  const { buildDataRailSnapshot, loadExampleEvents } = require(dataRailModulePath) as {
    buildDataRailSnapshot: (events: PopulationGrowthEvent[]) => { events: PopulationGrowthEvent[] };
    loadExampleEvents: () => PopulationGrowthEvent[];
  };
  const thresholds = require(thresholdsPath) as PopulationGrowthThresholds;

  const events = loadExampleEvents();
  const dataRail = buildDataRailSnapshot(events);
  const governance = buildGovernanceSnapshot(dataRail.events);
  return buildPopulationGrowthSnapshot(governance.diversity.metrics, thresholds, dataRail.events);
}
