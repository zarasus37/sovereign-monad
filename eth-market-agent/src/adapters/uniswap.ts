import { ethers, Contract, BigNumberish, Provider } from 'ethers';
import { createLogger } from '../utils/logger';

const logger = createLogger('uniswap-adapter');

const UNISWAP_V3_FACTORY_ABI = ['function getPool(address tokenA, address tokenB, uint24 fee) view returns (address pool)'];
const UNISWAP_V3_POOL_ABI = [
  'function slot0() view returns (uint160 sqrtPriceX96, int24 tick, uint16 observationIndex, uint16 observationCardinality, uint16 observationCardinalityNext, uint8 feeProtocol, bool unlocked)',
  'function token0() view returns (address)',
  'function token1() view returns (address)',
  'function liquidity() view returns (uint128)',
  'function observe(uint32[] secondsAgos) view returns (int56[] tickCumulatives, uint160[] secondsPerLiquidityCumulativeX128s)',
];

// Well-known stablecoin addresses (mainnet) used to determine quote direction
const STABLECOINS = new Set([
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
  '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
  '0x6b175474e89094c44da98b954eedeac495271d0f', // DAI
]);

export interface UniswapPoolData {
  marketId: string;
  priceMid: number;
  bestBid: number;
  bestAsk: number;
  liquidity: string;
  liquidity10bps: string;
  liquidity50bps: string;
}

export class UniswapPool {
  private contract: Contract;
  private token0Decimals: number = 18;
  private token1Decimals: number = 6;
  private invertPrice: boolean = false; // true when token0 is the quote asset (e.g. USDC)

  constructor(
    private poolAddress: string,
    private provider: ethers.Provider,
    private marketId: string,
    private fee: number
  ) {
    this.contract = new Contract(poolAddress, UNISWAP_V3_POOL_ABI, provider);
  }

  async initialize(): Promise<void> {
    try {
      const [token0, token1] = await Promise.all([
        this.contract.token0(),
        this.contract.token1(),
      ]);
      const token0Contract = new Contract(token0, ['function decimals() view returns (uint8)'], this.provider);
      const token1Contract = new Contract(token1, ['function decimals() view returns (uint8)'], this.provider);
      [this.token0Decimals, this.token1Decimals] = await Promise.all([
        token0Contract.decimals().then(Number),
        token1Contract.decimals().then(Number),
      ]);

      // If token0 is a stablecoin, the raw price gives USDC/WETH — we must invert
      this.invertPrice = STABLECOINS.has(token0.toLowerCase());
      logger.info({
        poolAddress: this.poolAddress,
        token0,
        token1,
        token0Decimals: this.token0Decimals,
        token1Decimals: this.token1Decimals,
        invertPrice: this.invertPrice,
      }, 'Pool initialized');
    } catch (error: any) {
      logger.error({ poolAddress: this.poolAddress, err: error?.message ?? String(error) }, 'Failed to initialize pool');
      throw error;
    }
  }

  /**
   * Convert sqrtPriceX96 (uint160 bigint) to a human-readable price.
   *
   * Uniswap V3 stores price as sqrt(token1/token0) * 2^96.
   * We compute: price = (sqrtPriceX96² / 2^192) * 10^(token0Decimals - token1Decimals)
   *
   * Because sqrtPriceX96 is up to 160 bits, squaring can produce 320-bit values.
   * We keep everything in bigint arithmetic and only convert to Number at the end
   * once we've applied the decimal shift to a manageable range.
   */
  private sqrtPriceX96ToPrice(sqrtPriceX96: bigint): number {
    // price_raw = sqrtPriceX96² / 2^192  (token1 per token0, raw integers)
    const Q192 = 1n << 192n;
    const sqrtPriceSq = sqrtPriceX96 * sqrtPriceX96;

    // Apply decimal adjustment: multiply by 10^token0Decimals and divide by 10^token1Decimals
    // to get the price in a "normalised" form.
    const decimalDiff = this.token0Decimals - this.token1Decimals;

    let price: number;
    if (decimalDiff >= 0) {
      const scale = 10n ** BigInt(decimalDiff);
      price = Number((sqrtPriceSq * scale) / Q192);
    } else {
      const scale = 10n ** BigInt(-decimalDiff);
      price = Number(sqrtPriceSq / (Q192 * scale));
    }

    // For large prices, the above bigint division may still overflow Number
    // Use a high-precision approach: split into quotient and remainder
    if (!Number.isFinite(price) || price === 0) {
      // Fallback: compute in floating point from separate components
      const sqrtPrice = Number(sqrtPriceX96) / 2 ** 96;
      price = sqrtPrice * sqrtPrice * 10 ** decimalDiff;
    }

    return this.invertPrice ? 1 / price : price;
  }

  async fetchPoolData(): Promise<UniswapPoolData> {
    try {
      const [slot0, liquidity] = await Promise.all([
        this.contract.slot0(),
        this.contract.liquidity(),
      ]);

      const sqrtPriceX96 = slot0.sqrtPriceX96 as bigint;
      const priceMid = this.sqrtPriceX96ToPrice(sqrtPriceX96);
      const spread = priceMid * (this.fee / 1_000_000); // fee is in hundredths-of-bps (500 = 0.05%)
      
      return {
        marketId: this.marketId,
        priceMid,
        bestBid: priceMid - spread / 2,
        bestAsk: priceMid + spread / 2,
        liquidity: liquidity.toString(),
        liquidity10bps: liquidity.toString(),
        liquidity50bps: liquidity.toString(),
      };
    } catch (error: any) {
      logger.error({ marketId: this.marketId, err: error?.message ?? String(error) }, 'Failed to fetch pool data');
      throw error;
    }
  }
}

export class UniswapAdapter {
  private pools: Map<string, UniswapPool> = new Map();

  constructor(private provider: ethers.Provider) {}

  async registerPool(marketId: string, poolAddress: string, fee: number): Promise<void> {
    const pool = new UniswapPool(poolAddress, this.provider, marketId, fee);
    this.pools.set(marketId, pool);
    await pool.initialize();
  }

  async fetchAllPools(): Promise<UniswapPoolData[]> {
    const promises = Array.from(this.pools.values()).map((p) =>
      p.fetchPoolData().catch((err: any) => {
        logger.error({ err: err?.message ?? String(err) }, 'Error fetching pool');
        return null;
      })
    );
    const results = await Promise.all(promises);
    return results.filter((r): r is UniswapPoolData => r !== null);
  }
}

export function createUniswapAdapter(provider: ethers.Provider): UniswapAdapter {
  return new UniswapAdapter(provider);
}

