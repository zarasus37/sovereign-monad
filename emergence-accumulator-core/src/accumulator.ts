import path from 'path';
import seedWindows from '../../emergence-baseline-core/config/windows.example.json';
import {
  EmergenceAccumulationPolicy,
  EmergenceAccumulationSnapshot,
  EmergenceObservationWindow,
} from './types';

function buildCurrentWindows(currentObservation: any): EmergenceObservationWindow[] {
  return [
    ...(seedWindows as EmergenceObservationWindow[]),
    {
      windowId: 'current-window',
      timestampMs: Date.now(),
      readiness: currentObservation.readiness,
      markerLevels: Object.fromEntries(
        currentObservation.markers.map((marker: any) => [marker.marker, marker.level]),
      ),
    },
  ];
}

function formingOrBetter(readiness: string) {
  return readiness === 'forming' || readiness === 'observable';
}

function buildCurrentStreak(windows: EmergenceObservationWindow[]) {
  let streak = 0;
  for (let index = windows.length - 1; index >= 0; index -= 1) {
    if (formingOrBetter(windows[index].readiness)) {
      streak += 1;
      continue;
    }
    break;
  }
  return streak;
}

export function buildEmergenceAccumulatorSnapshot(
  windows: EmergenceObservationWindow[],
  policy: EmergenceAccumulationPolicy,
  nextCollectionTargets: string[],
): EmergenceAccumulationSnapshot {
  const currentWindowCount = windows.length;
  const remainingWindowCount = Math.max(0, policy.targetWindowCount - currentWindowCount);
  const observableWindowCount = windows.filter((window) => window.readiness === 'observable').length;
  const formingOrBetterCount = windows.filter((window) => formingOrBetter(window.readiness)).length;
  const currentStreak = buildCurrentStreak(windows);
  const latestTimestampMs = Math.max(...windows.map((window) => window.timestampMs));

  let status: EmergenceAccumulationSnapshot['status'] = 'collecting';
  if (
    currentWindowCount >= policy.targetWindowCount &&
    observableWindowCount >= policy.minimumObservableWindowCount &&
    currentStreak >= policy.minimumFormingOrBetterStreak
  ) {
    status = 'target_met';
  } else if (
    currentWindowCount >= policy.minimumWindowCountForReview &&
    observableWindowCount >= 1 &&
    currentStreak >= policy.minimumFormingOrBetterStreak
  ) {
    status = 'review_ready';
  }

  const reasons = [
    `${currentWindowCount} windows are available against a target of ${policy.targetWindowCount}`,
    `${observableWindowCount} windows have reached observable readiness`,
    `${currentStreak} consecutive windows are forming-or-better`,
  ];

  if (status !== 'target_met') {
    reasons.push(`${remainingWindowCount} additional windows are still required for the target`);
  }

  return {
    implemented: true,
    observationOnly: true,
    status,
    currentWindowCount,
    targetWindowCount: policy.targetWindowCount,
    remainingWindowCount,
    observableWindowCount,
    formingOrBetterCount,
    currentStreak,
    cadenceHours: policy.cadenceHours,
    recommendedNextCollectionAtMs: latestTimestampMs + policy.cadenceHours * 60 * 60 * 1000,
    reasons,
    nextCollectionTargets,
    windows,
  };
}

export function loadLocalEmergenceAccumulatorSnapshot(
  packageRoot: string,
): EmergenceAccumulationSnapshot {
  const observationModulePath = path.resolve(packageRoot, 'emergence-observer-core', 'dist', 'index.js');
  const policyPath = path.resolve(packageRoot, 'emergence-accumulator-core', 'config', 'policy.json');

  const { loadLocalEmergenceObservationSnapshot } = require(observationModulePath) as {
    loadLocalEmergenceObservationSnapshot: (packageRoot: string) => any;
  };

  const currentObservation = loadLocalEmergenceObservationSnapshot(packageRoot);
  const policy = require(policyPath) as EmergenceAccumulationPolicy;
  const windows = buildCurrentWindows(currentObservation);
  return buildEmergenceAccumulatorSnapshot(windows, policy, currentObservation.nextCollectionTargets);
}
