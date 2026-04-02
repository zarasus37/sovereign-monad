export interface EventMeta {
  eventId: string;
  eventType: string;
  version: number;
  timestampMs: number;
  source: string;
}

export type StressSeverity = 'low' | 'medium' | 'high' | 'critical';
export type StressMetricType = 'liquidation_spike' | 'lst_depeg' | 'pool_drain' | 'spread_widen' | 'bridge_queue' | 'gas_spike' | 'block_delay';

export interface StressSignal {
  meta: EventMeta;
  protocolId: string;
  metricType: StressMetricType;
  severity: StressSeverity;
  assets: string[];
  values: Record<string, number>;
  suggestedState: 'INJECTION' | 'ACCUMULATION' | 'TIGHTENING' | 'STRESS';
  timestampMs: number;
}
