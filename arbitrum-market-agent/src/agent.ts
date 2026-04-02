/**
 * Main agent logic for arbitrum-market-agent
 * Subscribes to Arbitrum blocks and publishes price snapshots from Camelot
 */

import { v4 as uuidv4 } from 'uuid';
import { getConfig } from './config';
import { createRpcClient, RpcClient } from './adapters/rpc';
import { createCamelotAdapter, CamelotAdapter, CamelotMarketData } from './adapters/camelot';
import { createKafkaProducer, KafkaProducerClient } from './adapters/kafka';
import { VolatilityTracker } from './utils/vol';
import { createLogger } from './utils/logger';
import {
  ArbitrumPriceSnapshot,
  EventMeta,
  EVENT_VERSION,
  EVENT_SOURCE,
} from './models/events';

const logger = createLogger('agent');

const ETH_USDC_MARKET_ID = 'camelot:ETH/USDC:spot';

export class ArbitrumMarketAgent {
  private rpcClient: RpcClient;
  private camelotAdapter: CamelotAdapter;
  private adapterProvider = null as ReturnType<RpcClient['getProvider']>;
  private kafkaProducer: KafkaProducerClient;
  private volatilityTracker: VolatilityTracker;
  private config: ReturnType<typeof getConfig>;
  private isRunning = false;
  private lastBlockNumber = 0;
  private lastFetchMs = 0;
  private readonly minFetchIntervalMs = 2000;
  private readonly poolAddress: string;

  constructor() {
    this.config = getConfig();
    this.poolAddress = this.config.camelotEthUsdcPool;
    this.rpcClient = createRpcClient(this.config.arbitrumWsUrl);
    this.kafkaProducer = createKafkaProducer({
      brokers: this.config.kafkaBrokers,
      clientId: this.config.kafkaClientId,
      topic: this.config.kafkaTopic,
    });
    this.volatilityTracker = new VolatilityTracker(
      this.config.volWindow1h,
      this.config.blockTimeMs
    );
    this.camelotAdapter = null as unknown as CamelotAdapter;
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Arbitrum Market Agent with Camelot');
    await this.rpcClient.connect();
    this.refreshAdapter();
    await this.kafkaProducer.connect();
    logger.info('Arbitrum Market Agent initialized successfully');
  }

  start(): void {
    if (this.isRunning) {
      logger.warn('Agent already running');
      return;
    }

    this.isRunning = true;
    this.rpcClient.onBlock(async (blockNumber: number) => {
      await this.handleNewBlock(blockNumber);
    });
    logger.info('Arbitrum Market Agent started, listening for new blocks');
  }

  private async handleNewBlock(blockNumber: number): Promise<void> {
    if (blockNumber <= this.lastBlockNumber) {
      return;
    }

    const now = Date.now();
    if (now - this.lastFetchMs < this.minFetchIntervalMs) {
      return;
    }
    this.lastFetchMs = now;
    this.lastBlockNumber = blockNumber;

    logger.debug({ blockNumber }, 'Processing new block');

    try {
      this.refreshAdapter();
      const marketData = await this.camelotAdapter.getMarketData();
      await this.publishSnapshot(this.buildSnapshot(marketData, blockNumber));
    } catch (error: unknown) {
      logger.error({ blockNumber, err: error instanceof Error ? error.message : String(error) }, 'Error processing block');
    }
  }

  private refreshAdapter(): void {
    const provider = this.rpcClient.getProvider();
    if (!provider) {
      throw new Error('RPC provider unavailable');
    }

    if (provider !== this.adapterProvider) {
      this.camelotAdapter = createCamelotAdapter(provider, this.poolAddress);
      this.adapterProvider = provider;
      logger.info('Refreshed Camelot adapter for current RPC provider');
    }
  }

  private async publishSnapshot(snapshot: ArbitrumPriceSnapshot): Promise<void> {
    this.volatilityTracker.addPrice(snapshot.marketId, snapshot.priceMid);
    const vols = this.volatilityTracker.getVolatilities(snapshot.marketId);

    const fullSnapshot: ArbitrumPriceSnapshot = {
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

  private buildSnapshot(
    marketData: CamelotMarketData,
    blockNumber: number
  ): ArbitrumPriceSnapshot {
    const meta: EventMeta = {
      eventId: uuidv4(),
      eventType: 'ArbitrumPriceSnapshot',
      version: EVENT_VERSION,
      timestampMs: Date.now(),
      source: EVENT_SOURCE,
    };

    return {
      meta,
      chainId: 'ARBITRUM',
      marketId: marketData.marketId || ETH_USDC_MARKET_ID,
      baseAsset: marketData.baseAsset,
      quoteAsset: marketData.quoteAsset,
      priceMid: marketData.priceMid,
      bestBid: marketData.bestBid,
      bestAsk: marketData.bestAsk,
      liquidity10bps: marketData.liquidity10bps,
      liquidity50bps: marketData.liquidity50bps,
      realizedVol1m: 0,
      realizedVol5m: 0,
      realizedVol1h: 0,
      blockNumber,
      gasPriceGwei: 0,
    };
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    logger.info('Stopping Arbitrum Market Agent');
    this.isRunning = false;
    this.rpcClient.removeBlockListener();
    await this.kafkaProducer.disconnect();
    await this.rpcClient.disconnect();
    logger.info('Agent stopped');
  }
}

export function createAgent(): ArbitrumMarketAgent {
  return new ArbitrumMarketAgent();
}
