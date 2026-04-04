import path from 'path';
import weights from '../config/weights.json';
import { ActorLedgerBalance, LedgerEntry, RewardLedgerInput, RewardLedgerSnapshot } from './types';

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
}

export function buildLedgerEntry(input: RewardLedgerInput): LedgerEntry | null {
  if (!input.rewardEligible || input.rewardBand === 'none') {
    return null;
  }

  const bandWeight = weights.rewardBands[input.rewardBand];
  const actorMultiplier = weights.actorClassMultipliers[input.actorClass];
  const scoreFactor = input.contributionScore / 100;
  const units = roundToTwo(bandWeight * actorMultiplier * scoreFactor);

  return {
    eventId: input.eventId,
    actorId: input.actorId,
    units,
    unit: 'internal_credit',
    rewardBand: input.rewardBand,
    reasons: [
      'entry is internal-only and not redeemable external revenue',
      'external productization remains blocked until diversity thresholds are defined and met',
    ],
  };
}

export function buildRewardLedgerSnapshot(inputs: RewardLedgerInput[]): RewardLedgerSnapshot {
  const entries = inputs
    .map((input) => buildLedgerEntry(input))
    .filter((entry): entry is LedgerEntry => entry !== null);

  const balancesMap = new Map<string, ActorLedgerBalance>();
  for (const entry of entries) {
    const current = balancesMap.get(entry.actorId) || {
      actorId: entry.actorId,
      units: 0,
      entryCount: 0,
    };

    current.units = roundToTwo(current.units + entry.units);
    current.entryCount += 1;
    balancesMap.set(entry.actorId, current);
  }

  return {
    implemented: true,
    internalOnly: true,
    entryCount: entries.length,
    balances: [...balancesMap.values()],
    entries,
  };
}

export function loadLocalRewardLedgerSnapshot(packageRoot: string): RewardLedgerSnapshot {
  const dataRailModulePath = path.resolve(packageRoot, '..', 'data-rail-core', 'dist', 'src', 'core.js');
  const routerModulePath = path.resolve(packageRoot, '..', 'data-rail-router', 'dist', 'src', 'router.js');
  const { buildDataRailSnapshot, loadExampleEvents } = require(dataRailModulePath) as {
    buildDataRailSnapshot: (events: Array<{
      id: string;
      actorId: string;
      actorClass: RewardLedgerInput['actorClass'];
      surface: string;
      outcome: string;
      contributionScore: number;
      rewardEligible: boolean;
      blockedReasons: string[];
      tags: string[];
    }>) => {
      internalOnly: true;
      diversityThresholdsDefined: boolean;
      events: Array<{
        id: string;
        actorId: string;
        actorClass: RewardLedgerInput['actorClass'];
        surface: string;
        outcome: string;
        contributionScore: number;
        rewardEligible: boolean;
        blockedReasons: string[];
        tags: string[];
      }>;
      rewards: Array<{
        eventId: string;
        rewardBand: RewardLedgerInput['rewardBand'];
      }>;
    };
    loadExampleEvents: () => Array<{
      id: string;
      actorId: string;
      actorClass: RewardLedgerInput['actorClass'];
      surface: string;
      outcome: string;
      contributionScore: number;
      rewardEligible: boolean;
      blockedReasons: string[];
      tags: string[];
    }>;
  };
  const { buildRoutingSnapshot } = require(routerModulePath) as {
    buildRoutingSnapshot: (
      events: Array<{
        id: string;
        actorId: string;
        surface: string;
        outcome: string;
        rewardEligible: boolean;
        blockedReasons: string[];
        tags: string[];
      }>,
      policy: { internalOnly: true; diversityThresholdsDefined: boolean },
    ) => { decisions: Array<{ eventId: string; approvedDestinations: string[] }> };
  };

  const exampleEvents = loadExampleEvents();
  const dataRailSnapshot = buildDataRailSnapshot(exampleEvents);
  const routingSnapshot = buildRoutingSnapshot(dataRailSnapshot.events, {
    internalOnly: dataRailSnapshot.internalOnly,
    diversityThresholdsDefined: dataRailSnapshot.diversityThresholdsDefined,
  });

  const routeMap = new Map(
    routingSnapshot.decisions.map((decision) => [decision.eventId, decision.approvedDestinations]),
  );
  const rewardBandMap = new Map(
    dataRailSnapshot.rewards.map((reward) => [reward.eventId, reward.rewardBand]),
  );

  const inputs: RewardLedgerInput[] = dataRailSnapshot.events
    .filter((event) => (routeMap.get(event.id) || []).includes('internal_reward_ledger'))
    .map((event) => ({
      eventId: event.id,
      actorId: event.actorId,
      actorClass: event.actorClass,
      contributionScore: event.contributionScore,
      rewardEligible: event.rewardEligible,
      rewardBand: rewardBandMap.get(event.id) || 'none',
    }));

  return buildRewardLedgerSnapshot(inputs);
}
