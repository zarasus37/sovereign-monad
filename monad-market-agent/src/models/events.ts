/**
 * Event interfaces for monad-market-agent
 */

export interface EventMeta {
  eventId: string;
  eventType: string;
  version: number;
  timestampMs: number;
  source: string;
}

export interface MonadPriceSnapshot {
  meta: EventMeta;
  chainId: 'MONAD';
  marketId: string;
  baseAsset: string;
  quoteAsset: string;
  priceMid: number;
  bestBid: number | null;
  bestAsk: number | null;
  baseReserve?: string;
  quoteReserve?: string;
  liquidity10bps: string;
  liquidity50bps: string;
  realizedVol1m: number;
  realizedVol5m: number;
  realizedVol1h: number;
  blockNumber: number;
  txCountInBlock?: number;
}

export interface MarketConfig {
  id: string;
  baseAsset: string;
  quoteAsset: string;
  contractAddress: string;
}

export const EVENT_VERSION = 1;
export const EVENT_SOURCE = 'monad-market-agent';
