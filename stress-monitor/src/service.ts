import { Kafka, Producer } from 'kafkajs';
import { JsonRpcProvider, Contract } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from './config';
import { createLogger } from './utils/logger';
import { StressSignal, EventMeta, StressSeverity, StressMetricType } from './models/events';

const logger = createLogger('stress-monitor');

const ERC20_BALANCE_ABI = ['function balanceOf(address) view returns (uint256)'];

export class StressMonitor {
  private kafka: Kafka;
  private producer: Producer;
  private config: ReturnType<typeof getConfig>;
  private provider: JsonRpcProvider | null = null;
  private isRunning: boolean = false;
  private gasPriceHistory: number[] = [];
  private blockTimestamps: number[] = [];
  private lastPoolBalance: bigint | null = null;
  private pollInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.config = getConfig();
    this.kafka = new Kafka({
      clientId: this.config.clientId,
      brokers: this.config.kafkaBrokers,
    });
    this.producer = this.kafka.producer();
  }

  async start(): Promise<void> {
    await this.producer.connect();

    this.provider = new JsonRpcProvider(this.config.monadRpcUrl);
    logger.info({ rpc: this.config.monadRpcUrl }, 'Connected to Monad RPC');

    this.isRunning = true;
    this.pollInterval = setInterval(() => this.pollStressMetrics(), this.config.pollIntervalMs);
    logger.info({ interval: this.config.pollIntervalMs }, 'Stress monitor started');
  }

  private async pollStressMetrics(): Promise<void> {
    try {
      await this.checkGasSpike();
      await this.checkBlockHealth();
      await this.checkPoolLiquidity();
    } catch (error) {
      logger.error({ error }, 'Error polling stress metrics');
    }
  }

  /**
   * Detect gas price spikes by comparing current gas price to moving average.
   * Gas spikes correlate with liquidation cascades and network congestion.
   */
  private async checkGasSpike(): Promise<void> {
    if (!this.provider) return;

    try {
      const feeData = await this.provider.getFeeData();
      const gasPriceGwei = Number(feeData.gasPrice ?? 0n) / 1e9;

      if (gasPriceGwei <= 0) return;

      this.gasPriceHistory.push(gasPriceGwei);
      if (this.gasPriceHistory.length > 60) {
        this.gasPriceHistory.shift();
      }

      // Need at least 10 samples for meaningful spike detection
      if (this.gasPriceHistory.length < 10) return;

      const avg = this.gasPriceHistory.reduce((a, b) => a + b, 0) / this.gasPriceHistory.length;
      const ratio = gasPriceGwei / Math.max(avg, 0.001);

      if (ratio > this.config.gasSpikeMultiplier) {
        const severity: StressSeverity = ratio > 5.0 ? 'critical' : ratio > 3.0 ? 'high' : 'medium';
        await this.emitStressSignal({
          protocolId: 'monad-network',
          metricType: 'gas_spike',
          severity,
          assets: ['MON'],
          values: { gasPriceGwei, averageGwei: avg, ratio },
        });
      }
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'Failed to fetch gas price');
    }
  }

  /**
   * Detect block production delays by tracking latest block timestamps.
   * Slow blocks indicate consensus stress or validator issues.
   */
  private async checkBlockHealth(): Promise<void> {
    if (!this.provider) return;

    try {
      const block = await this.provider.getBlock('latest');
      if (!block) return;

      this.blockTimestamps.push(block.timestamp);
      if (this.blockTimestamps.length > 30) {
        this.blockTimestamps.shift();
      }

      if (this.blockTimestamps.length < 2) return;

      const lastTwo = this.blockTimestamps.slice(-2);
      const blockGapSec = lastTwo[1] - lastTwo[0];

      if (blockGapSec > this.config.blockDelayThresholdSec) {
        const severity: StressSeverity = blockGapSec > 30 ? 'critical' : blockGapSec > 10 ? 'high' : 'medium';
        await this.emitStressSignal({
          protocolId: 'monad-network',
          metricType: 'block_delay',
          severity,
          assets: ['MON'],
          values: { blockGapSec, thresholdSec: this.config.blockDelayThresholdSec },
        });
      }
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'Failed to check block health');
    }
  }

  /**
   * Detect sudden pool liquidity drains by tracking ERC20 token balance
   * of the configured Kuru pool. A >20% drop between polls = drain signal.
   */
  private async checkPoolLiquidity(): Promise<void> {
    if (!this.provider || !this.config.kuruPoolAddress || !this.config.usdcTokenAddress) return;

    try {
      const usdc = new Contract(this.config.usdcTokenAddress, ERC20_BALANCE_ABI, this.provider);
      const balance: bigint = await usdc.balanceOf(this.config.kuruPoolAddress);

      if (this.lastPoolBalance !== null && this.lastPoolBalance > 0n) {
        const change = Number(balance - this.lastPoolBalance) / Number(this.lastPoolBalance);

        // Detect drain: >20% drop in pool USDC balance
        if (change < -0.20) {
          const drainPercent = Math.abs(change * 100);
          const severity: StressSeverity = drainPercent > 50 ? 'critical' : drainPercent > 30 ? 'high' : 'medium';
          await this.emitStressSignal({
            protocolId: 'kuru-dex',
            metricType: 'pool_drain',
            severity,
            assets: ['MON', 'USDC'],
            values: { drainPercent, balanceBefore: Number(this.lastPoolBalance), balanceAfter: Number(balance) },
          });
        }
      }

      this.lastPoolBalance = balance;
    } catch (error) {
      logger.warn({ error: (error as Error).message }, 'Failed to check pool liquidity');
    }
  }

  private async emitStressSignal(signal: Omit<StressSignal, 'meta' | 'suggestedState' | 'timestampMs'>): Promise<void> {
    // Map severity to suggested state
    const stateMap: Record<StressSeverity, 'INJECTION' | 'ACCUMULATION' | 'TIGHTENING' | 'STRESS'> = {
      low: 'ACCUMULATION',
      medium: 'TIGHTENING',
      high: 'STRESS',
      critical: 'STRESS',
    };

    const meta: EventMeta = {
      eventId: uuidv4(),
      eventType: 'StressSignal',
      version: 1,
      timestampMs: Date.now(),
      source: 'stress-monitor',
    };

    const fullSignal: StressSignal = {
      ...signal,
      meta,
      suggestedState: stateMap[signal.severity],
      timestampMs: Date.now(),
    };

    await this.producer.send({
      topic: this.config.outputTopic,
      messages: [{ key: signal.protocolId, value: JSON.stringify(fullSignal) }],
    });

    logger.warn({
      protocol: signal.protocolId,
      metric: signal.metricType,
      severity: signal.severity,
    }, 'Emitted stress signal');
  }

  async stop(): Promise<void> {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    this.isRunning = false;
    await this.producer.disconnect();
    this.provider = null;
    logger.info('Stress monitor stopped');
  }
}
