export interface EventMeta {
  eventId: string;
  eventType: string;
  version: number;
  timestampMs: number;
  source: string;
}

// Bridge transfer request from arb-bot
export interface BridgeTransferRequest {
  meta: EventMeta;
  requestId: string;
  sourceChainId: number;
  destChainId: number;
  token: string;
  amount: string;
  recipient: string;
  deadlineMs?: number;
}

// Bridge quote response
export interface BridgeQuote {
  meta: EventMeta;
  requestId: string;
  sourceChainId: number;
  destChainId: number;
  token: string;
  amount: string;
  estimatedAmountOut: string;
  bridgeFee: string;
  bridgeFeeUsd: number;
  estimatedTimeMinutes: number;
  route: string;
  quoteExpiry: number;
  spokepool: string;
}

// Bridge transfer result
export interface BridgeTransferResult {
  meta: EventMeta;
  requestId: string;
  success: boolean;
  sourceChainId: number;
  destChainId: number;
  token: string;
  amount: string;
  depositId?: string;
  txHash?: string;
  filledAmount?: string;
  realizedPnl?: number;
  gasUsed?: string;
  gasCostUsd?: number;
  error?: string;
  timestampMs: number;
}

// Supported tokens for bridging
export const SUPPORTED_TOKENS: Record<number, Record<string, string>> = {
  // Base
  8453: {
    ETH: '0x0000000000000000000000000000000000000000', // Native ETH
    WETH: '0x4200000000000000000000000000000000000006',
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    USDT: '0x0555C30dA0F8D75447D5E7df7e7C3D5A5D8E9d3',
    DAI: '0x50c5725949A6F0c72E6C4a29F2aCE9c484E9D8c5',
  },
  // Arbitrum
  42161: {
    ETH: '0x0000000000000000000000000000000000000000',
    WETH: '0x82aF49447D8a07e3bd95BD0d56f78341539f28d',
    USDC: '0xAF88d065e77c8cC2239327C5EDb3A432268e5831',
    USDT: '0xFd086bC7CD5C481DCC93C85BD42c4CeA55e5c0D4',
    DAI: '0xDA10009cBd5D07ddfe49BDEC25AA384228d42e6',
  },
};

// Get token address or native ETH
export function getTokenAddress(chainId: number, symbol: string): string {
  if (symbol === 'ETH') return '0x0000000000000000000000000000000000000000';
  return SUPPORTED_TOKENS[chainId]?.[symbol] || '';
}
