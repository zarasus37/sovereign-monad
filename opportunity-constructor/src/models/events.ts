/**
 * Event interfaces for opportunity-constructor (Phase 4)
 * Consumes: SpreadSignal
 * Produces: OpportunityCandidate
 */

export interface EventMeta {
  eventId: string;
  eventType: string;
  version: number;
  timestampMs: number;
  source: string;
}

// Input: From spread-scanner
export interface SpreadSignal {
  meta: EventMeta;
  asset: string;
  marketM: string;
  marketE: string;
  priceM: number;
  priceE: number;
  spreadBps: number;
  direction: 'buy_M_sell_E' | 'buy_E_sell_M';
  notionalCapacity: string;
  volM5m: number;
  volE5m: number;
  timestampMs: number;
}

// Output: To risk-engine
export type TradeMode = 'inventory_based' | 'bridge_based';

export interface OpportunityCandidate {
  meta: EventMeta;
  id: string;
  asset: string;
  direction: 'buy_M_sell_E' | 'buy_E_sell_M';
  sizeSuggestion: string;
  entryMarket: string;
  exitMarket: string;
  modeOptions: [TradeMode, TradeMode]; // Tuple: [inventory_based, bridge_based]
  timeWindowEstimateMs: number;
  spreadBps: number;
  volM5m: number;
  volE5m: number;
  sourceSignalId: string;
}

export const EVENT_VERSION = 1;
export const EVENT_SOURCE = 'opportunity-constructor';
