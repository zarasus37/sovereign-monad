export interface EventMeta {
  eventId: string;
  eventType: string;
  version: number;
  timestampMs: number;
  source: string;
}

export interface ChainAPriceSnapshot {
  meta: EventMeta;
  chainId: 'BASE';
  marketId: string;
  baseAsset: string;
  quoteAsset: string;
  priceMid: number;
  bestBid: number;
  bestAsk: number;
  liquidity10bps: string;
  liquidity50bps: string;
  realizedVol1m: number;
  realizedVol5m: number;
  realizedVol1h: number;
  blockNumber: number;
}

export interface ChainBPriceSnapshot {
  meta: EventMeta;
  chainId: 'ARBITRUM';
  marketId: string;
  baseAsset: string;
  quoteAsset: string;
  priceMid: number;
  bestBid: number;
  bestAsk: number;
  liquidity10bps: string;
  liquidity50bps: string;
  realizedVol1m: number;
  realizedVol5m: number;
  realizedVol1h: number;
  blockNumber: number;
  gasPriceGwei: number;
}

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
