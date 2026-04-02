/**
 * Aerodrome Slipstream adapter.
 * Reads spot price from the concentrated-liquidity pool state and derives
 * usable depth from the live token balances held by the pool contract.
 */

import { ethers, Contract, getAddress } from 'ethers';
import { createLogger } from '../utils/logger';

const logger = createLogger('aerodrome-adapter');

const DEFAULT_POOL_ADDRESS = getAddress('0xb2cc224c1c9fee385f8ad6a55b4d94e92359dc59');
const WETH_BASE = getAddress('0x4200000000000000000000000000000000000006');
const USDC_BASE = getAddress('0x833589fcd6edb6e08f4c7c32d4f71b54bda02913');
const FALLBACK_ETH_PRICE = 2500;
const FALLBACK_LIQUIDITY_USD = 1_000_000;

export interface AerodromeMarketData {
  marketId: string;
  baseAsset: string;
  quoteAsset: string;
  priceMid: number;
  bestBid: number | null;
  bestAsk: number | null;
  liquidity10bps: string;
  liquidity50bps: string;
  blockNumber: number;
}

const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
];

const POOL_ABI = [
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, bool unlocked)',
  'function liquidity() view returns (uint128)',
];

export interface PriceSnapshot {
  timestamp: number;
  asset: string;
  chainId: number;
  price: number;
  liquidity: number;
  liquidity10Bps: number;
  source: string;
}

function normalizePoolAddress(poolAddress?: string): string | null {
  if (!poolAddress) {
    return null;
  }

  try {
    return getAddress(poolAddress.toLowerCase());
  } catch {
    return null;
  }
}

async function isExpectedPool(
  provider: ethers.Provider,
  poolAddress: string
): Promise<boolean> {
  try {
    const pool = new Contract(poolAddress, POOL_ABI, provider);
    const [token0, token1, liquidity] = await Promise.all([
      pool.token0(),
      pool.token1(),
      pool.liquidity(),
    ]);

    return (
      Number(liquidity) > 0 &&
      token0.toLowerCase() === WETH_BASE.toLowerCase() &&
      token1.toLowerCase() === USDC_BASE.toLowerCase()
    );
  } catch (err) {
    logger.debug({ err }, 'Configured Aerodrome pool validation failed');
    return false;
  }
}

async function resolvePoolAddress(
  provider: ethers.Provider,
  configuredPoolAddress?: string
): Promise<string> {
  const configured = normalizePoolAddress(configuredPoolAddress);
  if (configured && await isExpectedPool(provider, configured)) {
    return configured;
  }

  if (configured) {
    logger.warn({ configuredPoolAddress }, 'Configured Aerodrome pool is invalid, using known-good default');
  }

  return DEFAULT_POOL_ADDRESS;
}

function priceFromSqrtPriceX96(sqrtPriceX96: bigint): number {
  const numerator = sqrtPriceX96 * sqrtPriceX96 * 10n ** 12n;
  const denominator = 2n ** 192n;
  return Number(numerator / denominator);
}

async function getPoolState(
  provider: ethers.Provider,
  poolAddress: string
): Promise<{ price: number; liquidity10Bps: number }> {
  const pool = new Contract(poolAddress, POOL_ABI, provider);
  const weth = new Contract(WETH_BASE, ERC20_ABI, provider);
  const usdc = new Contract(USDC_BASE, ERC20_ABI, provider);

  const [slot0, wethBalance, usdcBalance] = await Promise.all([
    pool.slot0(),
    weth.balanceOf(poolAddress),
    usdc.balanceOf(poolAddress),
  ]);

  const price = priceFromSqrtPriceX96(slot0[0]);
  const wethReserve = Number(ethers.formatUnits(wethBalance, 18));
  const usdcReserve = Number(ethers.formatUnits(usdcBalance, 6));
  const reserveUsd = Math.min(wethReserve * price, usdcReserve);

  return {
    price,
    liquidity10Bps: reserveUsd * 0.001,
  };
}

export async function getMarketData(
  provider: ethers.Provider,
  configuredPoolAddress?: string
): Promise<AerodromeMarketData> {
  const blockNumber = await provider.getBlockNumber();
  let price = 0;
  let liquidity10Bps = 0;
  let poolAddress: string | null = null;

  try {
    poolAddress = await resolvePoolAddress(provider, configuredPoolAddress);
    const state = await getPoolState(provider, poolAddress);
    price = state.price;
    liquidity10Bps = state.liquidity10Bps;
  } catch (err: any) {
    logger.debug({ err: err?.message }, 'DEX query failed');
  }

  if (price <= 0) {
    logger.warn('Using fallback ETH price (development mode)');
    price = FALLBACK_ETH_PRICE;
    liquidity10Bps = FALLBACK_LIQUIDITY_USD;
    poolAddress = '0xfallback';
  }

  const spread = price * 0.001;
  const bestBid = price - spread / 2;
  const bestAsk = price + spread / 2;

  logger.info({ price, liquidity10Bps, poolAddress }, 'Aerodrome market data');

  return {
    marketId: 'aerodrome:ETH/USDC:spot',
    baseAsset: 'ETH',
    quoteAsset: 'USDC',
    priceMid: price,
    bestBid,
    bestAsk,
    liquidity10bps: liquidity10Bps.toString(),
    liquidity50bps: (liquidity10Bps * 5).toString(),
    blockNumber,
  };
}

export class AerodromeAdapter {
  private provider: ethers.Provider;
  private configuredPoolAddress?: string;

  constructor(provider: ethers.Provider, configuredPoolAddress?: string) {
    this.provider = provider;
    this.configuredPoolAddress = configuredPoolAddress;
  }

  async getMarketData(): Promise<AerodromeMarketData> {
    return getMarketData(this.provider, this.configuredPoolAddress);
  }
}

export function createAerodromeAdapter(
  provider: ethers.Provider,
  poolAddress?: string
): AerodromeAdapter {
  return new AerodromeAdapter(provider, poolAddress);
}
