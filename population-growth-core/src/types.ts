export interface PopulationGrowthMetrics {
  totalEvents: number;
  distinctActors: number;
  actorClassCount: number;
  surfaceCount: number;
  outcomeCount: number;
  ecosystemNativeShare: number;
  nonNativeShare: number;
  largestActorShare: number;
}

export interface PopulationGrowthThresholds {
  minimumEventCount: number;
  minimumDistinctActors: number;
  minimumActorClasses: number;
  minimumSurfaces: number;
  minimumOutcomes: number;
  maximumSingleActorShare: number;
  requireEcosystemNativeAndNonNativeMix: boolean;
}

export interface PopulationGrowthEvent {
  id: string;
  actorId: string;
  actorClass: 'ecosystem_native' | 'delegated_human' | 'operator_review' | 'user_linked';
  surface: 'organ_runtime' | 'signal_layer' | 'oracle' | 'gnosis' | 'platform' | 'keys';
  outcome: 'accepted' | 'rejected' | 'blocked' | 'published' | 'contained' | 'qualified';
}

export interface PopulationGap {
  dimension:
    | 'event_count'
    | 'distinct_actors'
    | 'actor_classes'
    | 'surfaces'
    | 'outcomes'
    | 'actor_concentration'
    | 'population_mix';
  current: number | string;
  target: number | string;
  missing: number | string;
  reason: string;
}

export interface PopulationGrowthRecommendation {
  priority: 'high' | 'medium' | 'low';
  action: string;
  targetDimension: PopulationGap['dimension'];
}

export interface PopulationGrowthSnapshot {
  implemented: true;
  thresholdsDefined: true;
  thresholdsMet: boolean;
  gapCount: number;
  gaps: PopulationGap[];
  recommendations: PopulationGrowthRecommendation[];
}
