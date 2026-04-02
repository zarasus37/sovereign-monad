export interface EventMeta {
  eventId: string;
  eventType: string;
  version: number;
  timestampMs: number;
  source: string;
}

export interface BridgeRequest {
  meta: EventMeta;
  requestId: string;
  asset: string;
  amount: string;
  fromChain: 'ETHEREUM' | 'MONAD';
  toChain: 'ETHEREUM' | 'MONAD';
  recipient: string;
  deadlineMs: number;
}

export interface BridgeResult {
  meta: EventMeta;
  requestId: string;
  success: boolean;
  txHash?: string;
  bridgeLatencyMs?: number;
  error?: string;
  timestampMs: number;
}
