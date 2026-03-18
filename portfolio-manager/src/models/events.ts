export interface EventMeta {
  eventId: string;
  eventType: string;
  version: number;
  timestampMs: number;
  source: string;
}

export interface OpportunityEvaluation {
  meta: EventMeta;
  opportunityId: string;
  mode: 'inventory_based' | 'bridge_based';
  evMean: number;
  evStd: number;
  sharpeLike: number;
  pLossGtX: number;
  maxDrawdownEstimate: number;
  approved: boolean;
  size: string;
  timeWindowMs: number;
}

export interface ExecutionPlan {
  meta: EventMeta;
  planId: string;
  opportunityId: string;
  asset: string;
  direction: 'buy_M_sell_E' | 'buy_E_sell_M';
  size: string;
  mode: 'inventory_based' | 'bridge_based';
  entryVenue: string;
  exitVenue: string;
  expectedEv: number;
  approved: boolean;
  timestampMs: number;
}

export interface PortfolioState {
  totalValueUsd: number;
  bridgeExposure: { bridge: string; percent: number }[];
  chainExposure: { chain: string; percent: number }[];
  openPositions: string[];
}
