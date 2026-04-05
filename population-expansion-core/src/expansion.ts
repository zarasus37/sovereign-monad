import path from 'path';
import {
  PopulationExpansionGap,
  PopulationExpansionMetrics,
  PopulationExpansionSnapshot,
  PopulationExpansionTarget,
} from './types';

const ALL_SURFACES = ['organ_runtime', 'signal_layer', 'oracle', 'gnosis', 'platform', 'keys'];
const ALL_OUTCOMES = ['accepted', 'rejected', 'blocked', 'published', 'contained', 'qualified'];

function buildGapList(
  metrics: PopulationExpansionMetrics,
  target: PopulationExpansionTarget,
): PopulationExpansionGap[] {
  const gaps: PopulationExpansionGap[] = [];

  if (metrics.totalEvents < target.targetEventCount) {
    gaps.push({
      dimension: 'event_count',
      current: metrics.totalEvents,
      target: target.targetEventCount,
      missing: target.targetEventCount - metrics.totalEvents,
      reason: 'the next-wave population target needs more attributable events',
    });
  }

  if (metrics.distinctActors < target.targetDistinctActors) {
    gaps.push({
      dimension: 'distinct_actors',
      current: metrics.distinctActors,
      target: target.targetDistinctActors,
      missing: target.targetDistinctActors - metrics.distinctActors,
      reason: 'the next-wave population target needs more distinct actors',
    });
  }

  if (metrics.actorClassCount < target.targetActorClasses) {
    gaps.push({
      dimension: 'actor_classes',
      current: metrics.actorClassCount,
      target: target.targetActorClasses,
      missing: target.targetActorClasses - metrics.actorClassCount,
      reason: 'the next-wave population target needs broader actor-class coverage',
    });
  }

  if (metrics.surfaceCount < target.targetSurfaceCount) {
    gaps.push({
      dimension: 'surfaces',
      current: metrics.surfaceCount,
      target: target.targetSurfaceCount,
      missing: target.targetSurfaceCount - metrics.surfaceCount,
      reason: 'the next-wave population target needs more behavioral surfaces',
    });
  }

  if (metrics.outcomeCount < target.targetOutcomeCount) {
    gaps.push({
      dimension: 'outcomes',
      current: metrics.outcomeCount,
      target: target.targetOutcomeCount,
      missing: target.targetOutcomeCount - metrics.outcomeCount,
      reason: 'the next-wave population target needs a broader outcome profile',
    });
  }

  if (metrics.largestActorShare > target.maximumSingleActorShare) {
    gaps.push({
      dimension: 'actor_concentration',
      current: metrics.largestActorShare,
      target: target.maximumSingleActorShare,
      missing: metrics.largestActorShare - target.maximumSingleActorShare,
      reason: 'the next-wave population target should keep actor concentration lower',
    });
  }

  return gaps;
}

export function buildPopulationExpansionSnapshot(
  metrics: PopulationExpansionMetrics,
  target: PopulationExpansionTarget,
  events: Array<{ actorId: string; surface: string; outcome: string }>,
): PopulationExpansionSnapshot {
  const gaps = buildGapList(metrics, target);
  const presentSurfaces = new Set(events.map((event) => event.surface));
  const presentOutcomes = new Set(events.map((event) => event.outcome));

  const missingSurfaces = ALL_SURFACES.filter((surface) => !presentSurfaces.has(surface));
  const missingOutcomes = ALL_OUTCOMES.filter((outcome) => !presentOutcomes.has(outcome));

  const nextWaveTargets = [
    `add ${Math.max(0, target.targetEventCount - metrics.totalEvents)} more attributable events`,
    `add ${Math.max(0, target.targetDistinctActors - metrics.distinctActors)} more distinct actors`,
    ...missingSurfaces.map((surface) => `capture one attributable ${surface} event`),
    ...missingOutcomes.map((outcome) => `capture one attributable ${outcome} outcome`),
  ].filter((item) => !item.startsWith('add 0'));

  return {
    implemented: true,
    targetDefined: true,
    status: gaps.length === 0 ? 'target_met' : 'ready_to_expand',
    currentMetrics: metrics,
    target,
    gapCount: gaps.length,
    gaps,
    remainingEventCount: Math.max(0, target.targetEventCount - metrics.totalEvents),
    remainingActorCount: Math.max(0, target.targetDistinctActors - metrics.distinctActors),
    nextWaveTargets,
    plannedWindows: target.focusWindows,
  };
}

export function loadLocalPopulationExpansionSnapshot(
  packageRoot: string,
): PopulationExpansionSnapshot {
  const governanceModulePath = path.resolve(packageRoot, 'data-rail-governance', 'dist', 'src', 'index.js');
  const dataRailModulePath = path.resolve(packageRoot, 'data-rail-core', 'dist', 'src', 'index.js');
  const targetPath = path.resolve(packageRoot, 'population-expansion-core', 'config', 'targets.json');

  const { buildGovernanceSnapshot } = require(governanceModulePath) as {
    buildGovernanceSnapshot: (events: any[]) => { diversity: { metrics: PopulationExpansionMetrics } };
  };
  const { buildDataRailSnapshot, loadExampleEvents } = require(dataRailModulePath) as {
    buildDataRailSnapshot: (events: any[]) => { events: any[] };
    loadExampleEvents: () => any[];
  };

  const target = require(targetPath) as PopulationExpansionTarget;
  const dataRail = buildDataRailSnapshot(loadExampleEvents());
  const governance = buildGovernanceSnapshot(dataRail.events);
  return buildPopulationExpansionSnapshot(governance.diversity.metrics, target, dataRail.events);
}
