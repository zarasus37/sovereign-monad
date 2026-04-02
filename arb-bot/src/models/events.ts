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
  sourceSignalId: string;
  asset: string;
  direction: 'buy_M_sell_E' | 'buy_E_sell_M';
  size: string;
  mode: 'inventory_based' | 'bridge_based';
  entryVenue: string;
  exitVenue: string;
  entryPrice: number;
  exitPrice: number;
  spreadBps: number;
  expectedEv: number;
  approved: boolean;
  timeWindowMs: number;
  executionDeadlineMs: number;
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
  executionPath?: string;
  error?: string;
  submittedTransactions?: Array<{
    chain: string;
    venue: string;
    hash: string;
  }>;
  settlement?: {
    status: 'filled' | 'partial_failure' | 'no_transfers';
    realizedPnlUsd: number;
    usdcSpent: number;
    usdcReceived: number;
    completedTransactions: number;
    attemptedTransactions: number;
  };
  timestampMs: number;
}
