import path from 'path';
import seedWindows from '../config/windows.example.json';
import { EmergenceBaselineSnapshot, EmergenceObservationWindow } from './types';

const readinessScore: Record<EmergenceObservationWindow['readiness'], number> = {
  insufficient: 0,
  forming: 1,
  observable: 2,
};

function deriveTrend(
  windows: EmergenceObservationWindow[],
): EmergenceBaselineSnapshot['readinessTrend'] {
  if (windows.length < 2) {
    return 'flat';
  }

  const scores = windows.map((window) => readinessScore[window.readiness]);
  const deltas = scores.slice(1).map((score, index) => score - scores[index]);
  if (deltas.every((delta) => delta >= 0) && deltas.some((delta) => delta > 0)) {
    return 'improving';
  }
  if (deltas.every((delta) => delta === 0)) {
    return 'flat';
  }
  return 'mixed';
}

function deriveContinuityTrend(
  windows: EmergenceObservationWindow[],
): EmergenceBaselineSnapshot['continuityTrend'] {
  const continuityLevels = windows.map((window) => window.markerLevels.continuity || 'absent');
  if (continuityLevels.every((level) => level === 'present')) {
    return 'stable';
  }
  if (continuityLevels.some((level) => level === 'partial' || level === 'present')) {
    return 'forming';
  }
  return 'thin';
}

export function buildEmergenceBaselineSnapshot(
  windows: EmergenceObservationWindow[],
): EmergenceBaselineSnapshot {
  const readinessTrend = deriveTrend(windows);
  const continuityTrend = deriveContinuityTrend(windows);

  let baselineStatus: EmergenceBaselineSnapshot['baselineStatus'] = 'seed';
  if (windows.length >= 3 && readinessTrend !== 'mixed') {
    baselineStatus = 'forming';
  }
  if (windows.length >= 5 && readinessTrend === 'improving' && continuityTrend === 'stable') {
    baselineStatus = 'stable';
  }

  return {
    implemented: true,
    observationOnly: true,
    windowCount: windows.length,
    baselineStatus,
    readinessTrend,
    continuityTrend,
    notes: [
      'baseline remains observational and does not claim emergence',
      'seed windows should be extended with real longitudinal captures over time',
    ],
  };
}

export function loadLocalEmergenceBaselineSnapshot(
  packageRoot: string,
): EmergenceBaselineSnapshot {
  const emergenceModulePath = path.resolve(
    packageRoot,
    '..',
    'emergence-observer-core',
    'dist',
    'index.js',
  );
  const { loadLocalEmergenceObservationSnapshot } = require(emergenceModulePath) as {
    loadLocalEmergenceObservationSnapshot: (packageRoot: string) => any;
  };

  const current = loadLocalEmergenceObservationSnapshot(path.resolve(packageRoot, '..'));
  const windows: EmergenceObservationWindow[] = [
    ...(seedWindows as EmergenceObservationWindow[]),
    {
      windowId: 'current-window',
      timestampMs: Date.now(),
      readiness: current.readiness,
      markerLevels: Object.fromEntries(
        current.markers.map((marker: any) => [marker.marker, marker.level]),
      ),
    },
  ];

  return buildEmergenceBaselineSnapshot(windows);
}
