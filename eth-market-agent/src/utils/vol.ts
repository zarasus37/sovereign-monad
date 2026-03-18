export class RollingVolCalculator {
  private prices: number[] = [];
  private readonly maxSamples: number;
  private readonly blockTimeMs: number;

  constructor(maxSamples: number = 9000, blockTimeMs: number = 12000) {
    this.maxSamples = maxSamples;
    this.blockTimeMs = blockTimeMs;
  }

  addPrice(price: number): void {
    this.prices.push(price);
    if (this.prices.length > this.maxSamples) this.prices.shift();
  }

  getSampleCount(): number {
    return this.prices.length;
  }

  private logReturn(p1: number, p2: number): number {
    if (p1 <= 0 || p2 <= 0) return 0;
    return Math.log(p2 / p1);
  }

  private computeVol(windowSamples: number): number {
    if (this.prices.length < windowSamples + 1) return 0;
    const relevantPrices = this.prices.slice(-(windowSamples + 1));
    const returns: number[] = [];
    for (let i = 1; i < relevantPrices.length; i++) {
      returns.push(this.logReturn(relevantPrices[i - 1], relevantPrices[i]));
    }
    if (returns.length === 0) return 0;
    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.map((r) => Math.pow(r - mean, 2)).reduce((a, b) => a + b, 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const eventsPerYear = (365 * 24 * 60 * 60 * 1000) / this.blockTimeMs;
    return stdDev * Math.sqrt(eventsPerYear);
  }

  getVolatilities(): { vol1m: number; vol5m: number; vol1h: number } {
    // Ethereum: 12s blocks -> 1m = 5 samples, 5m = 25 samples, 1h = 300 samples
    return {
      vol1m: this.computeVol(5),
      vol5m: this.computeVol(25),
      vol1h: this.computeVol(300),
    };
  }

  reset(): void {
    this.prices = [];
  }
}

export class VolatilityTracker {
  private calculators: Map<string, RollingVolCalculator> = new Map();
  constructor(
    private readonly maxSamples: number = 9000,
    private readonly blockTimeMs: number = 12000
  ) {}

  getCalculator(marketId: string): RollingVolCalculator {
    let calc = this.calculators.get(marketId);
    if (!calc) {
      calc = new RollingVolCalculator(this.maxSamples, this.blockTimeMs);
      this.calculators.set(marketId, calc);
    }
    return calc;
  }

  addPrice(marketId: string, price: number): void {
    this.getCalculator(marketId).addPrice(price);
  }

  getVolatilities(marketId: string) {
    return this.getCalculator(marketId).getVolatilities();
  }
}
