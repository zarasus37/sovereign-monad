import path from 'path';
import rightsPolicyConfig from '../config/rights-policy.json';
import thresholdsConfig from '../config/thresholds.json';
import {
  DataRailGovernanceSnapshot,
  DiversityPopulationMetrics,
  DiversityThresholdEvaluation,
  DiversityThresholds,
  ExternalizationDecision,
  GovernedBehaviorEvent,
  RightsPolicy,
} from './types';

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
}

function buildPopulationMetrics(events: GovernedBehaviorEvent[]): DiversityPopulationMetrics {
  const totalEvents = events.length;
  const distinctActors = new Set(events.map((event) => event.actorId)).size;
  const actorClassCount = new Set(events.map((event) => event.actorClass)).size;
  const surfaceCount = new Set(events.map((event) => event.surface)).size;
  const outcomeCount = new Set(events.map((event) => event.outcome)).size;

  const ecosystemNativeCount = events.filter((event) => event.actorClass === 'ecosystem_native').length;
  const nonNativeCount = totalEvents - ecosystemNativeCount;
  const actorCounts = new Map<string, number>();
  for (const event of events) {
    actorCounts.set(event.actorId, (actorCounts.get(event.actorId) || 0) + 1);
  }

  const largestActorShare =
    totalEvents === 0
      ? 0
      : roundToTwo(Math.max(...Array.from(actorCounts.values()), 0) / totalEvents);

  return {
    totalEvents,
    distinctActors,
    actorClassCount,
    surfaceCount,
    outcomeCount,
    ecosystemNativeShare: totalEvents === 0 ? 0 : roundToTwo(ecosystemNativeCount / totalEvents),
    nonNativeShare: totalEvents === 0 ? 0 : roundToTwo(nonNativeCount / totalEvents),
    largestActorShare,
  };
}

export function evaluateDiversityThresholds(
  events: GovernedBehaviorEvent[],
  thresholds: DiversityThresholds = thresholdsConfig as DiversityThresholds,
): DiversityThresholdEvaluation {
  const metrics = buildPopulationMetrics(events);
  const unmetThresholds: string[] = [];

  if (metrics.totalEvents < thresholds.minimumEventCount) {
    unmetThresholds.push(
      `event count ${metrics.totalEvents} is below minimum ${thresholds.minimumEventCount}`,
    );
  }

  if (metrics.distinctActors < thresholds.minimumDistinctActors) {
    unmetThresholds.push(
      `distinct actor count ${metrics.distinctActors} is below minimum ${thresholds.minimumDistinctActors}`,
    );
  }

  if (metrics.actorClassCount < thresholds.minimumActorClasses) {
    unmetThresholds.push(
      `actor class count ${metrics.actorClassCount} is below minimum ${thresholds.minimumActorClasses}`,
    );
  }

  if (metrics.surfaceCount < thresholds.minimumSurfaces) {
    unmetThresholds.push(
      `surface count ${metrics.surfaceCount} is below minimum ${thresholds.minimumSurfaces}`,
    );
  }

  if (metrics.outcomeCount < thresholds.minimumOutcomes) {
    unmetThresholds.push(
      `outcome count ${metrics.outcomeCount} is below minimum ${thresholds.minimumOutcomes}`,
    );
  }

  if (metrics.largestActorShare > thresholds.maximumSingleActorShare) {
    unmetThresholds.push(
      `largest actor share ${metrics.largestActorShare} exceeds maximum ${thresholds.maximumSingleActorShare}`,
    );
  }

  if (
    thresholds.requireEcosystemNativeAndNonNativeMix &&
    (metrics.ecosystemNativeShare === 0 || metrics.nonNativeShare === 0)
  ) {
    unmetThresholds.push('ecosystem-native and non-native participation mix is not present');
  }

  return {
    thresholdsDefined: true,
    thresholdsMet: unmetThresholds.length === 0,
    metrics,
    unmetThresholds,
  };
}

export function buildGovernanceSnapshot(
  events: GovernedBehaviorEvent[],
  thresholds: DiversityThresholds = thresholdsConfig as DiversityThresholds,
  rightsPolicy: RightsPolicy = rightsPolicyConfig as RightsPolicy,
): DataRailGovernanceSnapshot {
  const diversity = evaluateDiversityThresholds(events, thresholds);
  const reasons = [...diversity.unmetThresholds];

  if (!rightsPolicy.implemented) {
    reasons.push('rights policy is not implemented');
  }

  return {
    implemented: true,
    thresholdsDefined: true,
    thresholdsMet: diversity.thresholdsMet,
    rightsPolicyImplemented: rightsPolicy.implemented,
    externalizationAllowed: diversity.thresholdsMet && rightsPolicy.implemented,
    diversity,
    rightsPolicy,
    reasons,
  };
}

export function evaluateExternalizationDecision(
  event: GovernedBehaviorEvent,
  governance: DataRailGovernanceSnapshot,
  rightsPolicy: RightsPolicy = rightsPolicyConfig as RightsPolicy,
): ExternalizationDecision {
  const reasons: string[] = [];

  if (!governance.thresholdsMet) {
    reasons.push('diversity thresholds are defined but not met');
  }

  if (!governance.rightsPolicyImplemented) {
    reasons.push('rights policy is not implemented');
  }

  if (!event.rewardEligible || event.blockedReasons.length > 0) {
    reasons.push('event is not reward-grade under the current internal Data Rail policy');
  }

  if (rightsPolicy.requiresAttribution && !event.attributable) {
    reasons.push('event is not attributable');
  }

  if (rightsPolicy.prohibitsSensitivePayloads && event.containsSensitivePayload) {
    reasons.push('event contains sensitive payload');
  }

  if (!rightsPolicy.externallyEligibleActorClasses.includes(event.actorClass)) {
    reasons.push(`actor class ${event.actorClass} is not eligible for externalization`);
  }

  if (!rightsPolicy.externallyEligibleSurfaces.includes(event.surface)) {
    reasons.push(`surface ${event.surface} is not eligible for externalization`);
  }

  if (!rightsPolicy.externallyEligibleOutcomes.includes(event.outcome)) {
    reasons.push(`outcome ${event.outcome} is not eligible for externalization`);
  }

  const blockedTags = event.tags.filter((tag) => rightsPolicy.blockedTags.includes(tag));
  if (blockedTags.length > 0) {
    reasons.push(`event contains blocked tags: ${blockedTags.join(', ')}`);
  }

  return {
    eventId: event.id,
    allowed: reasons.length === 0,
    reasons,
  };
}

export function loadLocalGovernanceSnapshot(packageRoot: string): DataRailGovernanceSnapshot {
  const modulePath = path.resolve(packageRoot, '..', 'data-rail-core', 'dist', 'src', 'core.js');
  const { buildDataRailSnapshot, loadExampleEvents } = require(modulePath) as {
    buildDataRailSnapshot: (events: GovernedBehaviorEvent[]) => { events: GovernedBehaviorEvent[] };
    loadExampleEvents: () => GovernedBehaviorEvent[];
  };

  const exampleEvents = loadExampleEvents();
  const snapshot = buildDataRailSnapshot(exampleEvents);
  return buildGovernanceSnapshot(snapshot.events);
}
