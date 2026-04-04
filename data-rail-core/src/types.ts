export type CaptureActorClass =
  | 'ecosystem_native'
  | 'delegated_human'
  | 'operator_review'
  | 'user_linked';

export type CaptureSurface =
  | 'organ_runtime'
  | 'signal_layer'
  | 'oracle'
  | 'gnosis'
  | 'platform'
  | 'keys';

export type CaptureOutcome =
  | 'accepted'
  | 'rejected'
  | 'blocked'
  | 'published'
  | 'contained'
  | 'qualified';

export interface BehavioralCaptureEvent {
  id: string;
  timestampMs: number;
  actorId: string;
  actorClass: CaptureActorClass;
  surface: CaptureSurface;
  action: string;
  outcome: CaptureOutcome;
  attributable: boolean;
  containsSensitivePayload: boolean;
  contributionScore: number;
  tags: string[];
}

export interface DataRailPolicy {
  schemaVersion: string;
  internalOnly: true;
  diversityThresholdsDefined: boolean;
  minimumContributionScore: number;
  rewardEligibleOutcomes: CaptureOutcome[];
  requiresAttribution: boolean;
  blockSensitivePayloads: boolean;
}

export interface NormalizedBehaviorEvent extends BehavioralCaptureEvent {
  blockedReasons: string[];
  rewardEligible: boolean;
}

export interface RewardPreview {
  eventId: string;
  rewardEligible: boolean;
  rewardBand: 'none' | 'observe' | 'acknowledge';
  reasons: string[];
}

export interface DataRailSnapshot {
  implemented: true;
  internalOnly: true;
  schemaVersion: string;
  diversityThresholdsDefined: boolean;
  normalizedCount: number;
  rewardEligibleCount: number;
  events: NormalizedBehaviorEvent[];
  rewards: RewardPreview[];
}
