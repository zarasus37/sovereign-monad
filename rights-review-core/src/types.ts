export type RightsDisposition =
  | 'deny'
  | 'eligible_if_thresholds_met'
  | 'redact_and_retain_internal'
  | 'manual_review';

export type RightsResolution =
  | 'deny_internal'
  | 'hold_internal_until_thresholds'
  | 'redact_and_retain_internal'
  | 'approved_for_externalization';

export interface RightsResolutionRecord {
  eventId: string;
  closed: boolean;
  resolution: RightsResolution;
  notes: string;
}

export interface RightsReviewCase {
  eventId: string;
  disposition: RightsDisposition;
  reasons: string[];
  requiredActions: string[];
  open: boolean;
  resolution?: RightsResolution;
  resolutionNotes?: string;
}

export interface RightsReviewSnapshot {
  implemented: true;
  reviewCaseCount: number;
  openCaseCount: number;
  resolvedCaseCount: number;
  blockedCount: number;
  conditionalCount: number;
  manualReviewCount: number;
  cases: RightsReviewCase[];
}
