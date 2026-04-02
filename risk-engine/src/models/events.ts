/**
 * Event interfaces for risk-engine (Phase 5)
 * Consumes: OpportunityCandidate
 * Produces: OpportunityEvaluation
 */

export interface EventMeta {
  eventId: string;
  eventType: string;
  version: number;
  timestampMs: number;
  source: string;
}

// Input: From opportunity-constructor
export interface OpportunityCandidate {
  meta: EventMeta;
  id: string;
  asset: string;
  direction: 'buy_M_sell_E' | 'buy_E_sell_M';
  sizeSuggestion: string;
  entryMarket: string;
  exitMarket: string;
  entryPrice: number;
  exitPrice: number;
  modeOptions: readonly ('inventory_based' | 'bridge_based')[];
  timeWindowEstimateMs: number;
  spreadBps: number;
  volM5m: number;
  volE5m: number;
  sourceSignalId: string;
}

// Output: To portfolio-manager
export interface OpportunityEvaluation {
  meta: EventMeta;
  opportunityId: string;
  asset: string;
  direction: 'buy_M_sell_E' | 'buy_E_sell_M';
  entryVenue: string;
  exitVenue: string;
  entryPrice: number;
  exitPrice: number;
  spreadBps: number;
  sourceSignalId: string;
  mode: 'inventory_based' | 'bridge_based';
  evMean: number;
  evStd: number;
  sharpeLike: number;
  pLossGtX: number;
  p01Pnl: number;
  // Legacy alias retained for downstream compatibility.
  maxDrawdownEstimate: number;
  approved: boolean;
  size: string;
  timeWindowMs: number;
}

export const EVENT_VERSION = 1;
export const EVENT_SOURCE = 'risk-engine';
