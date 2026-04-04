import fs from 'fs';
import path from 'path';
import events from '../config/events.example.json';
import policy from '../config/policy.json';
import {
  BehavioralCaptureEvent,
  DataRailPolicy,
  DataRailSnapshot,
  NormalizedBehaviorEvent,
  RewardPreview,
} from './types';

export function normalizeBehaviorEvent(
  event: BehavioralCaptureEvent,
  activePolicy: DataRailPolicy = policy as DataRailPolicy,
): NormalizedBehaviorEvent {
  const blockedReasons: string[] = [];

  if (activePolicy.requiresAttribution && !event.attributable) {
    blockedReasons.push('event is not attributable');
  }

  if (activePolicy.blockSensitivePayloads && event.containsSensitivePayload) {
    blockedReasons.push('event contains sensitive payload');
  }

  if (event.contributionScore < activePolicy.minimumContributionScore) {
    blockedReasons.push('contribution score is below the minimum reward threshold');
  }

  if (!activePolicy.rewardEligibleOutcomes.includes(event.outcome)) {
    blockedReasons.push('outcome is not reward eligible');
  }

  return {
    ...event,
    blockedReasons,
    rewardEligible: blockedReasons.length === 0,
  };
}

export function buildRewardPreview(
  event: NormalizedBehaviorEvent,
  activePolicy: DataRailPolicy = policy as DataRailPolicy,
): RewardPreview {
  const reasons: string[] = [];

  if (activePolicy.internalOnly) {
    reasons.push(
      'Data Rail remains internal-only until diversity thresholds are met and rights gates are satisfied',
    );
  }

  if (!activePolicy.diversityThresholdsDefined) {
    reasons.push('population diversity thresholds are not defined yet');
  }

  if (!event.rewardEligible) {
    reasons.push(...event.blockedReasons);
  }

  let rewardBand: RewardPreview['rewardBand'] = 'none';
  if (event.rewardEligible && event.contributionScore >= 80) {
    rewardBand = 'acknowledge';
  } else if (event.rewardEligible) {
    rewardBand = 'observe';
  }

  return {
    eventId: event.id,
    rewardEligible: event.rewardEligible,
    rewardBand,
    reasons,
  };
}

export function buildDataRailSnapshot(
  eventList: BehavioralCaptureEvent[] = events as BehavioralCaptureEvent[],
  activePolicy: DataRailPolicy = policy as DataRailPolicy,
): DataRailSnapshot {
  const normalizedEvents = eventList.map((event) => normalizeBehaviorEvent(event, activePolicy));
  const rewards = normalizedEvents.map((event) => buildRewardPreview(event, activePolicy));

  return {
    implemented: true,
    internalOnly: true,
    schemaVersion: activePolicy.schemaVersion,
    diversityThresholdsDefined: activePolicy.diversityThresholdsDefined,
    normalizedCount: normalizedEvents.length,
    rewardEligibleCount: normalizedEvents.filter((event) => event.rewardEligible).length,
    events: normalizedEvents,
    rewards,
  };
}

export function loadExampleEvents() {
  return JSON.parse(
    fs.readFileSync(path.resolve(__dirname, '..', 'config', 'events.example.json'), 'utf8'),
  ) as BehavioralCaptureEvent[];
}
