/**
 * Main agent logic for monad-market-agent
 * Subscribes to Monad blocks and publishes price snapshots
 */

import { v4 as uuidv4 } from 'uuid';
import { getConfig } from './config';
import { createRpcClient, RpcClient } from './adapters/rpc';
import { createKuruAdapter, KuruAdapter, KuruMarketData } from './adapters/kuru';
import { createKafkaProducer, KafkaProducerClient } from './adapters/kafka';
import { VolatilityTracker } from './utils/vol';
import { createLogger } from './utils/logger';
import {
  MonadPriceSnapshot,
  EventMeta,
  EVENT_VERSION,
  EVENT_SOURCE,
  MarketConfig,
} from './models/events';

const logger = createLogger('agent');

export class MonadMarketAgent {
  private rpcClient: RpcClient;
  private kuruAdapter: KuruAdapter;
  private kafkaProducer: KafkaProducerClient;
  private volatilityTracker: VolatilityTracker;
  private config: ReturnType<typeof getConfig>;
  private isRunning: boolean = false;
  private lastBlockNumber: number = 0;
  private lastFetchMs: number = 0;
  private readonly MIN_FETCH_INTERVAL_MS = 2000;

  private static readonly DIRECT_ETH_MARKET_ID = 'kuru:ETH/USDC:spot';
  private static readonly ROUTED_ETH_MARKET_ID = 'kuru:WETH/MON:spot';
  private static readonly STABLE_QUOTED_ETH_MARKET_ID = 'kuru:WETH/AUSD:spot';
  private static readonly MON_USDC_MARKET_ID = 'kuru:MON/USDC:spot';

  constructor() {
    this.config = getConfig();

    // Initialize adapters (provider will be set after RPC connects)
    this.rpcClient = createRpcClient(this.config.monadWsUrl);
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

    // Kuru adapter - placeholder, will be initialized in initialize()
    this.kuruAdapter = null as unknown as KuruAdapter;
  }

  /**
   * Get Kuru adapter (for initialization)
   */
  getKuruAdapter(): KuruAdapter | null {
    return this.kuruAdapter;
  }

  /**
   * Initialize the agent (connect to services)
   */
  async initialize(): Promise<void> {
    logger.info('Initializing Monad Market Agent');

    // Connect to RPC
    await this.rpcClient.connect();

    // Initialize Kuru adapter with provider
    this.kuruAdapter = createKuruAdapter(
      this.rpcClient.getProvider()!
    );

    // Register markets
    for (const market of this.config.markets) {
      this.kuruAdapter.registerMarket(market.id, market.contractAddress);
    }

    // Connect to Kafka
    await this.kafkaProducer.connect();

    logger.info('Agent initialized successfully');
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

    logger.info('Agent started, listening for new blocks');
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
      // Fetch market data for all markets in parallel
      const marketDataList = await this.kuruAdapter.fetchAllMarkets();
      const marketDataById = new Map(marketDataList.map((marketData) => [marketData.marketId, marketData]));
      const publishPromises: Promise<void>[] = [];

      for (const marketData of marketDataList) {
        if (
          marketData.marketId === MonadMarketAgent.ROUTED_ETH_MARKET_ID ||
          marketData.marketId === MonadMarketAgent.STABLE_QUOTED_ETH_MARKET_ID
        ) {
          continue;
        }

        publishPromises.push(this.publishSnapshot(this.buildSnapshot(marketData, blockNumber)));
      }

      const directEthMarket = marketDataById.get(MonadMarketAgent.DIRECT_ETH_MARKET_ID);
      const routedEthMarket = marketDataById.get(MonadMarketAgent.ROUTED_ETH_MARKET_ID);
      const stableQuotedEthMarket = marketDataById.get(MonadMarketAgent.STABLE_QUOTED_ETH_MARKET_ID);
      const monUsdcMarket = marketDataById.get(MonadMarketAgent.MON_USDC_MARKET_ID);

      if (!directEthMarket && routedEthMarket && monUsdcMarket) {
        publishPromises.push(this.publishSnapshot(this.buildDerivedEthSnapshot(routedEthMarket, monUsdcMarket, blockNumber)));
      } else if (!directEthMarket && stableQuotedEthMarket) {
        publishPromises.push(this.publishSnapshot(this.buildStableQuotedEthSnapshot(stableQuotedEthMarket, blockNumber)));
      }

      await Promise.all(publishPromises);
    } catch (error: any) {
      logger.error({ blockNumber, err: error?.message ?? String(error) }, 'Error processing block');
    }
  }

  private async publishSnapshot(snapshot: MonadPriceSnapshot): Promise<void> {
    this.volatilityTracker.addPrice(snapshot.marketId, snapshot.priceMid);
    const vols = this.volatilityTracker.getVolatilities(snapshot.marketId);

    const fullSnapshot: MonadPriceSnapshot = {
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

  private buildDerivedEthSnapshot(
    wethMon: KuruMarketData,
    monUsdc: KuruMarketData,
    blockNumber: number
  ): MonadPriceSnapshot {
    const bestBid = wethMon.bestBid * monUsdc.bestBid;
    const bestAsk = wethMon.bestAsk * monUsdc.bestAsk;
    const priceMid = wethMon.priceMid * monUsdc.priceMid;

    const routedLiquidity10 = parseFloat(wethMon.liquidity10bps) * monUsdc.priceMid;
    const routedLiquidity50 = parseFloat(wethMon.liquidity50bps) * monUsdc.priceMid;

    return {
      meta: {
        eventId: uuidv4(),
        eventType: 'MonadPriceSnapshot',
        version: EVENT_VERSION,
        timestampMs: Date.now(),
        source: EVENT_SOURCE,
      },
      chainId: 'MONAD',
      marketId: MonadMarketAgent.DIRECT_ETH_MARKET_ID,
      baseAsset: 'ETH',
      quoteAsset: 'USDC',
      priceMid,
      bestBid,
      bestAsk,
      baseReserve: wethMon.baseReserve,
      quoteReserve: monUsdc.quoteReserve,
      liquidity10bps: Math.min(routedLiquidity10, parseFloat(monUsdc.liquidity10bps)).toFixed(2),
      liquidity50bps: Math.min(routedLiquidity50, parseFloat(monUsdc.liquidity50bps)).toFixed(2),
      realizedVol1m: 0,
      realizedVol5m: 0,
      realizedVol1h: 0,
      blockNumber,
    };
  }

  private buildStableQuotedEthSnapshot(
    stableQuotedEth: KuruMarketData,
    blockNumber: number
  ): MonadPriceSnapshot {
    return {
      meta: {
        eventId: uuidv4(),
        eventType: 'MonadPriceSnapshot',
        version: EVENT_VERSION,
        timestampMs: Date.now(),
        source: EVENT_SOURCE,
      },
      chainId: 'MONAD',
      marketId: MonadMarketAgent.DIRECT_ETH_MARKET_ID,
      baseAsset: 'ETH',
      quoteAsset: 'USDC',
      priceMid: stableQuotedEth.priceMid,
      bestBid: stableQuotedEth.bestBid,
      bestAsk: stableQuotedEth.bestAsk,
      baseReserve: stableQuotedEth.baseReserve,
      quoteReserve: stableQuotedEth.quoteReserve,
      liquidity10bps: stableQuotedEth.liquidity10bps,
      liquidity50bps: stableQuotedEth.liquidity50bps,
      realizedVol1m: 0,
      realizedVol5m: 0,
      realizedVol1h: 0,
      blockNumber,
    };
  }

  /**
   * Build a MonadPriceSnapshot from market data
   */
  private buildSnapshot(
    marketData: {
      marketId: string;
      bestBid: number;
      bestAsk: number;
      priceMid: number;
      baseReserve: string;
      quoteReserve: string;
      liquidity10bps: string;
      liquidity50bps: string;
    },
    blockNumber: number
  ): MonadPriceSnapshot {
    const meta: EventMeta = {
      eventId: uuidv4(),
      eventType: 'MonadPriceSnapshot',
      version: EVENT_VERSION,
      timestampMs: Date.now(),
      source: EVENT_SOURCE,
    };

    // Parse market config
    const marketConfig = this.config.markets.find(
      (m: MarketConfig) => m.id === marketData.marketId
    );

    return {
      meta,
      chainId: 'MONAD',
      marketId: marketData.marketId,
      baseAsset: marketConfig?.baseAsset || '',
      quoteAsset: marketConfig?.quoteAsset || '',
      priceMid: marketData.priceMid,
      bestBid: marketData.bestBid,
      bestAsk: marketData.bestAsk,
      baseReserve: marketData.baseReserve,
      quoteReserve: marketData.quoteReserve,
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

    logger.info('Stopping agent');
    this.isRunning = false;

    // Remove block listener
    this.rpcClient.removeBlockListener();

    // Disconnect from services
    await this.kafkaProducer.disconnect();
    await this.rpcClient.disconnect();

    logger.info('Agent stopped');
  }
}

export function createAgent(): MonadMarketAgent {
  return new MonadMarketAgent();
}
