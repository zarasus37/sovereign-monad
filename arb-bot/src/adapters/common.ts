import { parseUnits } from 'ethers';
import {
  ParsedVenue,
  SupportedAsset,
  SupportedChain,
  SupportedVenue,
} from './types';

export const BASE_WETH = '0x4200000000000000000000000000000000000006';
export const BASE_USDC = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
export const ARBITRUM_WETH = '0x82af49447d8a07e3bd95bd0d56f35241523fbab1';
export const ARBITRUM_USDC = '0xaf88d065e77c8cc2239327c5edb3a432268e5831';

export function parseVenue(raw: string): ParsedVenue | null {
  const parts = raw.split(':');
  if (parts.length !== 3) {
    return null;
  }

  const [protocolRaw, pairRaw, marketTypeRaw] = parts;
  const [baseAssetRaw, quoteAssetRaw] = pairRaw.split('/');

  const protocol = protocolRaw as SupportedVenue;
  const baseAsset = baseAssetRaw as SupportedAsset;
  const quoteAsset = quoteAssetRaw as SupportedAsset;
  const marketType = marketTypeRaw as 'spot';

  if (!['aerodrome', 'camelot'].includes(protocol)) {
    return null;
  }

  if (!['ETH', 'USDC'].includes(baseAsset) || !['ETH', 'USDC'].includes(quoteAsset)) {
    return null;
  }

  if (marketType !== 'spot') {
    return null;
  }

  return {
    protocol,
    baseAsset,
    quoteAsset,
    marketType,
    raw,
  };
}

export function tokenAddress(chain: SupportedChain, asset: SupportedAsset): string {
  if (chain === 'base' && asset === 'ETH') {
    return BASE_WETH;
  }
  if (chain === 'base' && asset === 'USDC') {
    return BASE_USDC;
  }
  if (chain === 'arbitrum' && asset === 'ETH') {
    return ARBITRUM_WETH;
  }
  return ARBITRUM_USDC;
}

export function amountToUnits(asset: SupportedAsset, value: number): string {
  const decimals = asset === 'USDC' ? 6 : 18;
  return parseUnits(value.toFixed(asset === 'USDC' ? 6 : 18), decimals).toString();
}

export function applySlippage(value: number, slippageBps: number): number {
  const factor = Math.max(0, 1 - slippageBps / 10_000);
  return value * factor;
}
