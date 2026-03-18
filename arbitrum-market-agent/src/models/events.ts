/**
 * Event interfaces for arbitrum-market-agent
 */

export interface EventMeta {
  eventId: string;
  eventType: string;
  version: number;
  timestampMs: number;
  source: string;
}

export interface ArbitrumPriceSnapshot {
  meta: EventMeta;
  chainId: 'ARBITRUM';
  marketId: string;
  baseAsset: string;
  quoteAsset: string;
  priceMid: number;
  bestBid: number | null;
  bestAsk: number | null;
  liquidity10bps: string;
  liquidity50bps: string;
  realizedVol1m: number;
  realizedVol5m: number;
  realizedVol1h: number;
  blockNumber: number;
  gasPriceGwei: number;
}

export interface MarketConfig {
  id: string;
  baseAsset: string;
  quoteAsset: string;
  poolAddress: string;
  fee: number; // Camelot fee tier
}

export const EVENT_VERSION = 1;
export const EVENT_SOURCE = 'arbitrum-market-agent';
