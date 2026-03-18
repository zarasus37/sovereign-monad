/**
 * Main agent logic for base-market-agent
 * Subscribes to Base blocks and publishes price snapshots from Aerodrome
 */

import { v4 as uuidv4 } from 'uuid';
import { getConfig } from './config';
import { createRpcClient, RpcClient } from './adapters/rpc';
import { createAerodromeAdapter, AerodromeAdapter, AerodromeMarketData } from './adapters/aerodrome';
import { createKafkaProducer, KafkaProducerClient } from './adapters/kafka';
import { VolatilityTracker } from './utils/vol';
import { createLogger } from './utils/logger';
import {
  BasePriceSnapshot,
  EventMeta,
  EVENT_VERSION,
  EVENT_SOURCE,
} from './models/events';

const logger = createLogger('agent');

// Aerodrome ETH/USDC market ID
const ETH_USDC_MARKET_ID = 'aerodrome:ETH/USDC:spot';

export class BaseMarketAgent {
  private rpcClient: RpcClient;
  private aerodromeAdapter: AerodromeAdapter;
  private kafkaProducer: KafkaProducerClient;
  private volatilityTracker: VolatilityTracker;
  private config: ReturnType<typeof getConfig>;
  private isRunning: boolean = false;
  private lastBlockNumber: number = 0;
  private lastFetchMs: number = 0;
  private readonly MIN_FETCH_INTERVAL_MS = 2000;

  // Pool address from env
  private readonly poolAddress: string;
  constructor() {
    this.config = getConfig();
    this.poolAddress = this.config.aerodromeEthUsdcPool;

    // Initialize adapters
    this.rpcClient = createRpcClient(this.config.baseWsUrl);
    this.kafkaProducer = createKafkaProducer({
      brokers: this.config.kafkaBrokers,
      clientId: this.config.kafkaClientId,
      topic: this.config.kafkaTopic,
    });

    // Volatility tracker with config
    this.volatilityTracker = new VolatilityTracker(
      this.config.volWindow1h,
      this.config.blockTimeMs
    );

    // Aerodrome adapter - placeholder, will be initialized in initialize()
    this.aerodromeAdapter = null as unknown as AerodromeAdapter;
  }

  /**
   * Initialize the agent (connect to services)
   */
  async initialize(): Promise<void> {
    logger.info('Initializing Base Market Agent with Aerodrome');

    // Connect to RPC
    await this.rpcClient.connect();

    // Initialize Aerodrome adapter with provider
    this.aerodromeAdapter = createAerodromeAdapter(
      this.rpcClient.getProvider()!,
      this.poolAddress
    );

    // Connect to Kafka
    await this.kafkaProducer.connect();

    logger.info('Base Market Agent initialized successfully');
  }

  /**
   * Start the agent (subscribe to blocks)
   */
  start(): void {
    if (this.isRunning) {
      logger.warn('Agent already running');
      return;
    }

    this.isRunning = true;

    // Subscribe to new blocks
    this.rpcClient.onBlock(async (blockNumber: number) => {
      await this.handleNewBlock(blockNumber);
    });

    logger.info('Base Market Agent started, listening for new blocks');
  }

  /**
   * Handle a new block event
   */
  private async handleNewBlock(blockNumber: number): Promise<void> {
    // Skip if we've already processed this block
    if (blockNumber <= this.lastBlockNumber) {
      return;
    }

    // Throttle fetches to stay under RPC rate limits
    const now = Date.now();
    if (now - this.lastFetchMs < this.MIN_FETCH_INTERVAL_MS) {
      return;
    }
    this.lastFetchMs = now;

    this.lastBlockNumber = blockNumber;
    logger.debug({ blockNumber }, 'Processing new block');

    try {
      // Fetch market data from Aerodrome
      const marketData = await this.aerodromeAdapter.getMarketData();

      await this.publishSnapshot(this.buildSnapshot(marketData, blockNumber));
    } catch (error: any) {
      logger.error({ blockNumber, err: error?.message ?? String(error) }, 'Error processing block');
    }
  }

  private async publishSnapshot(snapshot: BasePriceSnapshot): Promise<void> {
    this.volatilityTracker.addPrice(snapshot.marketId, snapshot.priceMid);
    const vols = this.volatilityTracker.getVolatilities(snapshot.marketId);

    const fullSnapshot: BasePriceSnapshot = {
      ...snapshot,
      realizedVol1m: vols.vol1m,
      realizedVol5m: vols.vol5m,
      realizedVol1h: vols.vol1h,
    };

    await this.kafkaProducer.publish(fullSnapshot.marketId, fullSnapshot);

    logger.debug({
      marketId: fullSnapshot.marketId,
      priceMid: fullSnapshot.priceMid,
      blockNumber: fullSnapshot.blockNumber,
    }, 'Published price snapshot');
  }

  /**
   * Build a BasePriceSnapshot from market data
   */
  private buildSnapshot(
    marketData: AerodromeMarketData,
    blockNumber: number
  ): BasePriceSnapshot {
    const meta: EventMeta = {
      eventId: uuidv4(),
      eventType: 'BasePriceSnapshot',
      version: EVENT_VERSION,
      timestampMs: Date.now(),
      source: EVENT_SOURCE,
    };

    return {
      meta,
      chainId: 'BASE',
      marketId: marketData.marketId || ETH_USDC_MARKET_ID,
      baseAsset: 'ETH',
      quoteAsset: 'USDC',
      priceMid: marketData.priceMid,
      bestBid: marketData.bestBid,
      bestAsk: marketData.bestAsk,
      liquidity10bps: marketData.liquidity10bps,
      liquidity50bps: marketData.liquidity50bps,
      realizedVol1m: 0,
      realizedVol5m: 0,
      realizedVol1h: 0,
      blockNumber,
    };
  }

  /**
   * Stop the agent
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping Base Market Agent');
    this.isRunning = false;

    // Remove block listener
    this.rpcClient.removeBlockListener();

    // Disconnect from services
    await this.kafkaProducer.disconnect();
    await this.rpcClient.disconnect();

    logger.info('Agent stopped');
  }
}

export function createAgent(): BaseMarketAgent {
  return new BaseMarketAgent();
}
