export interface EventMeta {
  eventId: string;
  eventType: string;
  version: number;
  timestampMs: number;
  source: string;
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

export interface ExecutionResult {
  meta: EventMeta;
  planId: string;
  success: boolean;
  executedSize: string;
  realizedPnl: number;
  gasUsed: string;
  slippageBps: number;
  error?: string;
  timestampMs: number;
}
