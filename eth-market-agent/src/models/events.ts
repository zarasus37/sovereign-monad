/**
 * Event interfaces for eth-market-agent
 */

export interface EventMeta {
  eventId: string;
  eventType: string;
  version: number;
  timestampMs: number;
  source: string;
}

export interface EthereumPriceSnapshot {
  meta: EventMeta;
  chainId: 'ETHEREUM';
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
  fee: number; // Uniswap fee tier
}

export const EVENT_VERSION = 1;
export const EVENT_SOURCE = 'eth-market-agent';
