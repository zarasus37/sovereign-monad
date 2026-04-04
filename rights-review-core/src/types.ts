export type RightsDisposition =
  | 'deny'
  | 'eligible_if_thresholds_met'
  | 'redact_and_retain_internal'
  | 'manual_review';

export interface RightsReviewCase {
  eventId: string;
  disposition: RightsDisposition;
  reasons: string[];
  requiredActions: string[];
}

export interface RightsReviewSnapshot {
  implemented: true;
  reviewCaseCount: number;
  blockedCount: number;
  conditionalCount: number;
  manualReviewCount: number;
  cases: RightsReviewCase[];
}
