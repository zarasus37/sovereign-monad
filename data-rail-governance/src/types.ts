export type GovernedActorClass =
  | 'ecosystem_native'
  | 'delegated_human'
  | 'operator_review'
  | 'user_linked';

export type GovernedSurface =
  | 'organ_runtime'
  | 'signal_layer'
  | 'oracle'
  | 'gnosis'
  | 'platform'
  | 'keys';

export type GovernedOutcome =
  | 'accepted'
  | 'rejected'
  | 'blocked'
  | 'published'
  | 'contained'
  | 'qualified';

export interface GovernedBehaviorEvent {
  id: string;
  actorId: string;
  actorClass: GovernedActorClass;
  surface: GovernedSurface;
  outcome: GovernedOutcome;
  attributable: boolean;
  containsSensitivePayload: boolean;
  contributionScore: number;
  rewardEligible: boolean;
  blockedReasons: string[];
  tags: string[];
}

export interface DiversityThresholds {
  schemaVersion: string;
  minimumEventCount: number;
  minimumDistinctActors: number;
  minimumActorClasses: number;
  minimumSurfaces: number;
  minimumOutcomes: number;
  maximumSingleActorShare: number;
  requireEcosystemNativeAndNonNativeMix: boolean;
}

export interface RightsPolicy {
  schemaVersion: string;
  implemented: true;
  requiresAttribution: boolean;
  prohibitsSensitivePayloads: boolean;
  externallyEligibleActorClasses: GovernedActorClass[];
  externallyEligibleSurfaces: GovernedSurface[];
  externallyEligibleOutcomes: GovernedOutcome[];
  blockedTags: string[];
  requiresReviewableAuditTrail: true;
}

export interface DiversityPopulationMetrics {
  totalEvents: number;
  distinctActors: number;
  actorClassCount: number;
  surfaceCount: number;
  outcomeCount: number;
  ecosystemNativeShare: number;
  nonNativeShare: number;
  largestActorShare: number;
}

export interface DiversityThresholdEvaluation {
  thresholdsDefined: true;
  thresholdsMet: boolean;
  metrics: DiversityPopulationMetrics;
  unmetThresholds: string[];
}

export interface ExternalizationDecision {
  eventId: string;
  allowed: boolean;
  reasons: string[];
}

export interface DataRailGovernanceSnapshot {
  implemented: true;
  thresholdsDefined: true;
  thresholdsMet: boolean;
  rightsPolicyImplemented: true;
  externalizationAllowed: boolean;
  diversity: DiversityThresholdEvaluation;
  rightsPolicy: RightsPolicy;
  reasons: string[];
}
