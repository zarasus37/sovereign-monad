/**
 * Aerodrome V2 contract adapter
 * Uses router.getAmountOut for price quotes (more reliable than direct pool queries)
 */

import { ethers, Contract, getAddress } from 'ethers';
import { createLogger } from '../utils/logger';

const logger = createLogger('aerodrome-adapter');

// Aerodrome V2 Router (checksummed)
const ROUTER_ADDRESS = '0x1F4C763bE1d762D981dDa1ea4d3302EEb4F2A23F';

// Standard tokens on Base (checksummed)
const WETH_BASE = '0x4200000000000000000000000000000000000006';  // WETH
const USDC_BASE = '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'; // USDC

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

// Router ABI
const ROUTER_ABI = [
  'function getAmountOut(uint256 amountIn, address tokenIn, address tokenOut) view returns (uint256)',
  'function poolByPair(address tokenA, address tokenB) view returns (address)',
];

// ERC20 ABI
const ERC20_ABI = [
  'function decimals() view returns (uint8)',
];

// Pool ABI
const POOL_ABI = [
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

/**
 * Try to get pool address
 */
async function getPoolAddress(
  provider: ethers.Provider,
  tokenA: string,
  tokenB: string
): Promise<string | null> {
  const router = new Contract(ROUTER_ADDRESS, ROUTER_ABI, provider);
  try {
    return await router.poolByPair(tokenA, tokenB);
  } catch {
    return null;
  }
}

/**
 * Get pool liquidity
 */
async function getPoolLiquidity(
  provider: ethers.Provider,
  poolAddress: string
): Promise<number> {
  if (!poolAddress || poolAddress === ethers.ZeroAddress) {
    return 0;
  }
  try {
    const pool = new Contract(poolAddress, POOL_ABI, provider);
    const liquidity = await pool.liquidity();
    return Number(liquidity);
  } catch {
    return 0;
  }
}

/**
 * Get current market data from Aerodrome using router quotes
 */
export async function getMarketData(
  provider: ethers.Provider
): Promise<AerodromeMarketData> {
  const router = new Contract(ROUTER_ADDRESS, ROUTER_ABI, provider);
  const weth = new Contract(getAddress(WETH_BASE), ERC20_ABI, provider);
  const usdc = new Contract(getAddress(USDC_BASE), ERC20_ABI, provider);
  
  const [wethDecimals, usdcDecimals] = await Promise.all([
    weth.decimals(),
    usdc.decimals(),
  ]);
  
  // Use 1 WETH to get quote
  const amountIn = ethers.parseUnits('1', wethDecimals);
  const amountOut = await router.getAmountOut(amountIn, WETH_BASE, USDC_BASE);
  
  // Calculate price: 1 WETH = ? USDC
  const price = Number(ethers.formatUnits(amountOut, usdcDecimals));
  
  // Get pool address for liquidity
  const poolAddress = await getPoolAddress(provider, WETH_BASE, USDC_BASE);
  const liquidity = await getPoolLiquidity(provider, poolAddress || ethers.ZeroAddress);
  
  // Estimate liquidity in USD
  const liquidity10Bps = liquidity > 0 ? liquidity * price * 0.001 : 0;
  
  // Estimate bid/ask
  const spread = price * 0.001;
  const bestBid = price - spread / 2;
  const bestAsk = price + spread / 2;
  
  const blockNumber = await provider.getBlockNumber();
  
  logger.info({ price, liquidity, liquidity10Bps, poolAddress }, 'Aerodrome market data');
  
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

/**
 * Aerodrome Adapter class
 */
export class AerodromeAdapter {
  private provider: ethers.Provider;

  constructor(provider: ethers.Provider) {
    this.provider = provider;
  }

  async getMarketData(): Promise<AerodromeMarketData> {
    return getMarketData(this.provider);
  }
}

/**
 * Factory function
 */
export function createAerodromeAdapter(
  provider: ethers.Provider,
  _poolAddress?: string
): AerodromeAdapter {
  return new AerodromeAdapter(provider);
}
