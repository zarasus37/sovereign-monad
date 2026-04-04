import path from 'path';
import { DataRailPolicyInput, DataRailRoutingSnapshot, RouteDecision, RoutedBehaviorEvent } from './types';

function shouldRouteToOracle(event: RoutedBehaviorEvent) {
  return (
    event.surface === 'organ_runtime' ||
    event.surface === 'signal_layer' ||
    event.outcome === 'accepted' ||
    event.outcome === 'qualified'
  );
}

function shouldRouteToGnosis(event: RoutedBehaviorEvent) {
  return (
    event.blockedReasons.length > 0 ||
    event.outcome === 'contained' ||
    event.outcome === 'blocked' ||
    event.tags.includes('identity')
  );
}

function shouldRouteToGovernance(event: RoutedBehaviorEvent) {
  return (
    event.blockedReasons.length > 0 ||
    event.tags.includes('review') ||
    event.tags.includes('sensitive') ||
    event.surface === 'keys'
  );
}

export function routeBehaviorEvent(
  event: RoutedBehaviorEvent,
  policy: DataRailPolicyInput,
): RouteDecision {
  const approvedDestinations: RouteDecision['approvedDestinations'] = [];
  const blockedDestinations: RouteDecision['blockedDestinations'] = [];
  const reasons: string[] = [];

  if (event.blockedReasons.length === 0) {
    approvedDestinations.push('internal_behavioral_archive');
  } else {
    blockedDestinations.push({
      destination: 'internal_behavioral_archive',
      reason: 'event failed capture policy and cannot enter the internal behavioral archive as reward-grade data',
    });
  }

  if (shouldRouteToOracle(event) && event.blockedReasons.length === 0) {
    approvedDestinations.push('oracle_memory');
  }

  if (shouldRouteToGnosis(event)) {
    approvedDestinations.push('gnosis_memory');
  }

  if (shouldRouteToGovernance(event)) {
    approvedDestinations.push('governance_review');
  }

  if (event.rewardEligible) {
    approvedDestinations.push('internal_reward_ledger');
  } else {
    blockedDestinations.push({
      destination: 'internal_reward_ledger',
      reason: 'event is not reward eligible under the current Data Rail policy',
    });
  }

  if (policy.internalOnly || !policy.diversityThresholdsDefined) {
    blockedDestinations.push({
      destination: 'external_product_surface',
      reason: 'external productization remains blocked until diversity thresholds are defined and met',
    });
    reasons.push('external productization remains blocked');
  }

  if (approvedDestinations.length === 0) {
    reasons.push('event was contained to review-only handling');
  }

  return {
    eventId: event.id,
    approvedDestinations: [...new Set(approvedDestinations)],
    blockedDestinations,
    reasons,
  };
}

export function buildRoutingSnapshot(
  events: RoutedBehaviorEvent[],
  policy: DataRailPolicyInput,
): DataRailRoutingSnapshot {
  return {
    implemented: true,
    internalOnly: true,
    routeCount: events.length,
    externalProductizationBlocked: true,
    decisions: events.map((event) => routeBehaviorEvent(event, policy)),
  };
}

export function loadLocalRoutingSnapshot(packageRoot: string): DataRailRoutingSnapshot {
  const modulePath = path.resolve(packageRoot, '..', 'data-rail-core', 'dist', 'src', 'core.js');
  const { buildDataRailSnapshot, loadExampleEvents } = require(modulePath) as {
    buildDataRailSnapshot: (events: RoutedBehaviorEvent[]) => {
      internalOnly: true;
      diversityThresholdsDefined: boolean;
      events: RoutedBehaviorEvent[];
    };
    loadExampleEvents: () => RoutedBehaviorEvent[];
  };

  const exampleEvents = loadExampleEvents();
  const snapshot = buildDataRailSnapshot(exampleEvents);
  return buildRoutingSnapshot(snapshot.events, {
    internalOnly: snapshot.internalOnly,
    diversityThresholdsDefined: snapshot.diversityThresholdsDefined,
  });
}
