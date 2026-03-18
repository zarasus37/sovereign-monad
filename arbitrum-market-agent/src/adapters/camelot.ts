/**
 * Camelot V3 contract adapter
 * Uses router.getAmountOut for price quotes (more reliable than direct pool queries)
 */

import { ethers, Contract, getAddress } from 'ethers';
import { createLogger } from '../utils/logger';

const logger = createLogger('camelot-adapter');

// Camelot V3 Router
const ROUTER_ADDRESS = '0xC873c1d8B534333fDb404C8C9dDd61fC1B2434E6';

// Standard tokens on Arbitrum
const WETH_ARB = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1';  // WETH
const USDC_ARB = '0xaf88d065d77C12c01f107111f6d4d05b17e8D84b'; // USDC

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

// Router ABI
const ROUTER_ABI = [
  'function getAmountOut(uint256 amountIn, address tokenIn, address tokenOut) view returns (uint256)',
  'function getPoolAddress(address tokenA, address tokenB) view returns (address)',
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
    return await router.getPoolAddress(tokenA, tokenB);
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
 * Get current market data from Camelot using router quotes
 */
export async function getMarketData(
  provider: ethers.Provider
): Promise<CamelotMarketData> {
  const router = new Contract(ROUTER_ADDRESS, ROUTER_ABI, provider);
  const weth = new Contract(getAddress(WETH_ARB), ERC20_ABI, provider);
  const usdc = new Contract(getAddress(USDC_ARB), ERC20_ABI, provider);
  
  const [wethDecimals, usdcDecimals] = await Promise.all([
    weth.decimals(),
    usdc.decimals(),
  ]);
  
  // Use 1 WETH to get quote
  const amountIn = ethers.parseUnits('1', wethDecimals);
  const amountOut = await router.getAmountOut(amountIn, WETH_ARB, USDC_ARB);
  
  // Calculate price: 1 WETH = ? USDC
  const price = Number(ethers.formatUnits(amountOut, usdcDecimals));
  
  // Get pool address for liquidity
  const poolAddress = await getPoolAddress(provider, WETH_ARB, USDC_ARB);
  const liquidity = await getPoolLiquidity(provider, poolAddress || ethers.ZeroAddress);
  
  // Estimate liquidity in USD
  const liquidity10Bps = liquidity > 0 ? liquidity * price * 0.001 : 0;
  
  // Estimate bid/ask
  const spread = price * 0.001;
  const bestBid = price - spread / 2;
  const bestAsk = price + spread / 2;
  
  const blockNumber = await provider.getBlockNumber();
  
  logger.info({ price, liquidity, liquidity10Bps, poolAddress }, 'Camelot market data');
  
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

/**
 * Camelot Adapter class
 */
export class CamelotAdapter {
  private provider: ethers.Provider;

  constructor(provider: ethers.Provider) {
    this.provider = provider;
  }

  async getMarketData(): Promise<CamelotMarketData> {
    return getMarketData(this.provider);
  }
}

/**
 * Factory function
 */
export function createCamelotAdapter(
  provider: ethers.Provider,
  _poolAddress?: string
): CamelotAdapter {
  return new CamelotAdapter(provider);
}
