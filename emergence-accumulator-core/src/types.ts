export interface EmergenceObservationWindow {
  windowId: string;
  timestampMs: number;
  readiness: 'insufficient' | 'forming' | 'observable';
  markerLevels: Record<string, 'absent' | 'partial' | 'present'>;
}

export interface EmergenceAccumulationPolicy {
  schemaVersion: string;
  minimumWindowCountForReview: number;
  targetWindowCount: number;
  minimumObservableWindowCount: number;
  minimumFormingOrBetterStreak: number;
  cadenceHours: number;
}

export interface EmergenceAccumulationSnapshot {
  implemented: true;
  observationOnly: true;
  status: 'collecting' | 'review_ready' | 'target_met';
  currentWindowCount: number;
  targetWindowCount: number;
  remainingWindowCount: number;
  observableWindowCount: number;
  formingOrBetterCount: number;
  currentStreak: number;
  cadenceHours: number;
  recommendedNextCollectionAtMs: number;
  reasons: string[];
  nextCollectionTargets: string[];
  windows: EmergenceObservationWindow[];
}
