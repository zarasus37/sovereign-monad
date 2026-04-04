export type InternalDataRailDestination =
  | 'internal_behavioral_archive'
  | 'oracle_memory'
  | 'gnosis_memory'
  | 'governance_review'
  | 'internal_reward_ledger';

export type DataRailDestination = InternalDataRailDestination | 'external_product_surface';

export interface RoutedBehaviorEvent {
  id: string;
  actorId: string;
  actorClass: 'ecosystem_native' | 'delegated_human' | 'operator_review' | 'user_linked';
  surface: string;
  outcome: string;
  attributable: boolean;
  containsSensitivePayload: boolean;
  rewardEligible: boolean;
  blockedReasons: string[];
  tags: string[];
}

export interface DataRailPolicyInput {
  internalOnly: true;
  diversityThresholdsDefined: boolean;
  externalizationAllowed: boolean;
}

export interface RouteDecision {
  eventId: string;
  approvedDestinations: InternalDataRailDestination[];
  blockedDestinations: Array<{ destination: DataRailDestination; reason: string }>;
  reasons: string[];
}

export interface DataRailRoutingSnapshot {
  implemented: true;
  internalOnly: true;
  routeCount: number;
  externalProductizationBlocked: boolean;
  thresholdsDefined: boolean;
  externalizationAllowed: boolean;
  decisions: RouteDecision[];
}
