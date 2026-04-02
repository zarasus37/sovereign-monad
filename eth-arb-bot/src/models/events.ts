export interface EventMeta {
  eventId: string;
  eventType: string;
  version: number;
  timestampMs: number;
  source: string;
}

export interface EthExecutionPlan {
  meta: EventMeta;
  planId: string;
  opportunityId: string;
  asset: string;
  direction: 'buy' | 'sell';
  size: string;
  poolAddress: string;
  fee: number;
  expectedPnl: number;
}

export interface EthExecutionResult {
  meta: EventMeta;
  planId: string;
  success: boolean;
  executedSize: string;
  realizedPnl: number;
  gasUsed: string;
  gasCostUsd: number;
  slippageBps: number;
  txHash?: string;
  error?: string;
  timestampMs: number;
}
