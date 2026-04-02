export type SupportedChain = 'base' | 'arbitrum';
export type SupportedVenue = 'aerodrome' | 'camelot';
export type SupportedAsset = 'ETH' | 'USDC';
export type MarketType = 'spot';
export type SwapSide = 'buy' | 'sell';

export interface ParsedVenue {
  protocol: SupportedVenue;
  baseAsset: SupportedAsset;
  quoteAsset: SupportedAsset;
  marketType: MarketType;
  raw: string;
}

export interface SwapPreparationInput {
  venue: ParsedVenue;
  chain: SupportedChain;
  side: SwapSide;
  notionalUsd: number;
  assetAmount: number;
  referencePrice: number;
  slippageBps: number;
}

export interface PreparedSwapLeg {
  chain: SupportedChain;
  protocol: SupportedVenue;
  venue: string;
  side: SwapSide;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  minAmountOut: string;
  referencePrice: number;
  routerAddress: string | null;
  routerConfigured: boolean;
  executable: boolean;
  reason?: string;
}

export interface SwapTransactionBuildInput {
  leg: PreparedSwapLeg;
  recipient: string;
  deadline: number;
}

export interface PreparedSwapTransaction {
  chain: SupportedChain;
  protocol: SupportedVenue;
  venue: string;
  method: string;
  routerAddress: string;
  spender: string;
  tokenIn: string;
  amountIn: string;
  value: string;
  data: string;
}

export interface VenueSwapAdapter {
  readonly protocol: SupportedVenue;
  supports(venue: ParsedVenue, chain: SupportedChain): boolean;
  prepareSwap(input: SwapPreparationInput): PreparedSwapLeg;
  buildSwapTransaction(input: SwapTransactionBuildInput): PreparedSwapTransaction;
}
