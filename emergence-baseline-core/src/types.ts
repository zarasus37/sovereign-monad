export interface EmergenceObservationWindow {
  windowId: string;
  timestampMs: number;
  readiness: 'insufficient' | 'forming' | 'observable';
  markerLevels: Record<string, 'absent' | 'partial' | 'present'>;
}

export interface EmergenceBaselineSnapshot {
  implemented: true;
  observationOnly: true;
  windowCount: number;
  baselineStatus: 'seed' | 'forming' | 'stable';
  readinessTrend: 'flat' | 'improving' | 'mixed';
  continuityTrend: 'thin' | 'forming' | 'stable';
  notes: string[];
}
