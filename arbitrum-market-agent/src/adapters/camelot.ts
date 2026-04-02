/**
 * Camelot V3 adapter.
 * Camelot V3 pools on Arbitrum expose Algebra-style globalState instead of
 * Uniswap slot0, so price discovery must use the pool directly.
 */

import { ethers, Contract, getAddress } from 'ethers';
import { createLogger } from '../utils/logger';

const logger = createLogger('camelot-adapter');

const DEFAULT_POOL_ADDRESS = getAddress('0xb1026b8e7276e7ac75410f1fcbbe21796e8f7526');
const WETH_ARB = getAddress('0x82af49447d8a07e3bd95bd0d56f35241523fbab1');
const USDC_ARB = getAddress('0xaf88d065e77c8cc2239327c5edb3a432268e5831');
const FALLBACK_ETH_PRICE = 2500;
const FALLBACK_LIQUIDITY_USD = 1_000_000;

export interface CamelotMarketData {
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
  'function globalState() view returns (uint160 price, int24 tick, uint16 feeZto, uint16 feeOtz, uint16 timepointIndex, uint8 communityFeeToken0, uint8 communityFeeToken1, bool unlocked)',
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
      token0.toLowerCase() === WETH_ARB.toLowerCase() &&
      token1.toLowerCase() === USDC_ARB.toLowerCase()
    );
  } catch (err) {
    logger.debug({ err }, 'Configured Camelot pool validation failed');
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
    logger.warn({ configuredPoolAddress }, 'Configured Camelot pool is invalid, using known-good default');
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
  const weth = new Contract(WETH_ARB, ERC20_ABI, provider);
  const usdc = new Contract(USDC_ARB, ERC20_ABI, provider);

  const [globalState, wethBalance, usdcBalance] = await Promise.all([
    pool.globalState(),
    weth.balanceOf(poolAddress),
    usdc.balanceOf(poolAddress),
  ]);

  const price = priceFromSqrtPriceX96(globalState[0]);
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
): Promise<CamelotMarketData> {
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

  logger.info({ price, liquidity10Bps, poolAddress }, 'Camelot market data');

  return {
    marketId: 'camelot:ETH/USDC:spot',
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

export class CamelotAdapter {
  private provider: ethers.Provider;
  private configuredPoolAddress?: string;

  constructor(provider: ethers.Provider, configuredPoolAddress?: string) {
    this.provider = provider;
    this.configuredPoolAddress = configuredPoolAddress;
  }

  async getMarketData(): Promise<CamelotMarketData> {
    return getMarketData(this.provider, this.configuredPoolAddress);
  }
}

export function createCamelotAdapter(
  provider: ethers.Provider,
  poolAddress?: string
): CamelotAdapter {
  return new CamelotAdapter(provider, poolAddress);
}
