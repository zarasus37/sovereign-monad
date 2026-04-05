export interface PopulationExpansionMetrics {
  totalEvents: number;
  distinctActors: number;
  actorClassCount: number;
  surfaceCount: number;
  outcomeCount: number;
  ecosystemNativeShare: number;
  nonNativeShare: number;
  largestActorShare: number;
}

export interface PopulationExpansionTarget {
  schemaVersion: string;
  targetEventCount: number;
  targetDistinctActors: number;
  targetActorClasses: number;
  targetSurfaceCount: number;
  targetOutcomeCount: number;
  maximumSingleActorShare: number;
  focusWindows: string[];
}

export interface PopulationExpansionGap {
  dimension:
    | 'event_count'
    | 'distinct_actors'
    | 'actor_classes'
    | 'surfaces'
    | 'outcomes'
    | 'actor_concentration';
  current: number;
  target: number;
  missing: number;
  reason: string;
}

export interface PopulationExpansionSnapshot {
  implemented: true;
  targetDefined: true;
  status: 'ready_to_expand' | 'target_met';
  currentMetrics: PopulationExpansionMetrics;
  target: PopulationExpansionTarget;
  gapCount: number;
  gaps: PopulationExpansionGap[];
  remainingEventCount: number;
  remainingActorCount: number;
  nextWaveTargets: string[];
  plannedWindows: string[];
}
