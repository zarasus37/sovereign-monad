/**
 * Gas Price Oracle for Risk Engine
 * 
 * Fetches real-time gas prices from the configured execution-chain RPC and
 * caches them briefly to avoid excessive calls during bursty opportunity flow.
 */

import { createLogger } from './utils/logger';

const logger = createLogger('gas-oracle');

export class GasPriceOracle {
  private readonly rpcUrl: string;
  private cachedGasPriceGwei: number = 30; // conservative fallback for L2 execution
  private lastFetchMs: number = 0;
  private readonly cacheTtlMs: number = 12_000; // short cache window for repeated evaluations

  constructor(rpcUrl: string) {
    this.rpcUrl = rpcUrl;
  }

  /**
   * Get current gas price in gwei (cached for 12s)
   */
  async getGasPriceGwei(): Promise<number> {
    const now = Date.now();
    if (now - this.lastFetchMs < this.cacheTtlMs) {
      return this.cachedGasPriceGwei;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5_000);

      const response = await fetch(this.rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_gasPrice',
          params: [],
          id: 1,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);
      const data = await response.json() as { result?: string };

      if (data.result) {
        this.cachedGasPriceGwei = parseInt(data.result, 16) / 1e9;
        this.lastFetchMs = now;
        logger.debug({ gasPriceGwei: this.cachedGasPriceGwei.toFixed(2) }, 'Gas price updated');
      }
    } catch (err) {
      logger.warn({ error: (err as Error).message }, 'Failed to fetch gas price, using cached');
    }

    return this.cachedGasPriceGwei;
  }

  /**
   * Convert gas price to USD cost for a transaction
   * 
   * @param gasPriceGwei Gas price in gwei
   * @param gasLimit Estimated gas units for the transaction
   * @param ethPriceUsd Current ETH price in USD
   * @returns Gas cost in USD
   */
  static gasCostUsd(gasPriceGwei: number, gasLimit: number, ethPriceUsd: number): number {
    return (gasPriceGwei * gasLimit * ethPriceUsd) / 1e9;
  }
}
