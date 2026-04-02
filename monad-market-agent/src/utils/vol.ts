/**
 * Rolling realized volatility calculator
 * Computes annualized log-return standard deviation over configurable windows
 */

export class RollingVolCalculator {
  private prices: number[] = [];
  private readonly maxSamples: number;
  private readonly blockTimeMs: number;
  private readonly windows: { samples: number; name: string }[];

  constructor(maxSamples: number = 9000, blockTimeMs: number = 400) {
    this.maxSamples = maxSamples;
    this.blockTimeMs = blockTimeMs;
    // Windows in number of samples (blocks)
    this.windows = [
      { samples: 150, name: '1m' },   // ~1 minute
      { samples: 750, name: '5m' },   // ~5 minutes
      { samples: 9000, name: '1h' }, // ~1 hour
    ];
  }

  /**
   * Add a new price observation
   */
  addPrice(price: number): void {
    this.prices.push(price);

    // Keep only maxSamples to bound memory
    if (this.prices.length > this.maxSamples) {
      this.prices.shift();
    }
  }

  /**
   * Get current price history length
   */
  getSampleCount(): number {
    return this.prices.length;
  }

  /**
   * Compute log return between two prices
   */
  private logReturn(p1: number, p2: number): number {
    if (p1 <= 0 || p2 <= 0) {
      return 0;
    }
    return Math.log(p2 / p1);
  }

  /**
   * Compute realized volatility (annualized standard deviation of log returns)
   * @param windowSamples Number of samples to use for calculation
   */
  private computeVol(windowSamples: number): number {
    if (this.prices.length < windowSamples + 1) {
      return 0;
    }

    // Get the last windowSamples + 1 prices to compute windowSamples returns
    const relevantPrices = this.prices.slice(-(windowSamples + 1));
    const returns: number[] = [];

    for (let i = 1; i < relevantPrices.length; i++) {
      const ret = this.logReturn(relevantPrices[i - 1], relevantPrices[i]);
      returns.push(ret);
    }

    if (returns.length === 0) {
      return 0;
    }

    // Compute mean
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;

    // Compute variance
    const squaredDiffs = returns.map((r) => Math.pow(r - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / returns.length;

    // Standard deviation
    const stdDev = Math.sqrt(variance);

    // Annualize: assume blocks are independent, scale by sqrt(time)
    // Events per year = (365 days * 24 hours * 60 minutes * 60 seconds * 1000) / blockTimeMs
    const eventsPerYear = (365 * 24 * 60 * 60 * 1000) / this.blockTimeMs;
    const annualizedVol = stdDev * Math.sqrt(eventsPerYear);

    return annualizedVol;
  }

  /**
   * Get volatility estimates for all windows
   */
  getVolatilities(): { vol1m: number; vol5m: number; vol1h: number } {
    return {
      vol1m: this.computeVol(this.windows[0].samples),
      vol5m: this.computeVol(this.windows[1].samples),
      vol1h: this.computeVol(this.windows[2].samples),
    };
  }

  /**
   * Reset the calculator
   */
  reset(): void {
    this.prices = [];
  }
}

/**
 * Volatility calculator map for multiple markets
 */
export class VolatilityTracker {
  private calculators: Map<string, RollingVolCalculator> = new Map();
  private readonly maxSamples: number;
  private readonly blockTimeMs: number;

  constructor(maxSamples: number = 9000, blockTimeMs: number = 400) {
    this.maxSamples = maxSamples;
    this.blockTimeMs = blockTimeMs;
  }

  /**
   * Get or create calculator for a market
   */
  getCalculator(marketId: string): RollingVolCalculator {
    let calc = this.calculators.get(marketId);
    if (!calc) {
      calc = new RollingVolCalculator(this.maxSamples, this.blockTimeMs);
      this.calculators.set(marketId, calc);
    }
    return calc;
  }

  /**
   * Add price to a market's calculator
   */
  addPrice(marketId: string, price: number): void {
    this.getCalculator(marketId).addPrice(price);
  }

  /**
   * Get volatilities for a market
   */
  getVolatilities(
    marketId: string
  ): { vol1m: number; vol5m: number; vol1h: number } {
    const calc = this.getCalculator(marketId);
    const vols = calc.getVolatilities();
    return {
      vol1m: vols.vol1m,
      vol5m: vols.vol5m,
      vol1h: vols.vol1h,
    };
  }

  /**
   * Get sample count for a market
   */
  getSampleCount(marketId: string): number {
    return this.getCalculator(marketId).getSampleCount();
  }
}
