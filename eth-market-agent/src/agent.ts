import { v4 as uuidv4 } from 'uuid';
import { Provider } from 'ethers';
import { getConfig } from './config';
import { createRpcClient, RpcClient } from './adapters/rpc';
import { createUniswapAdapter, UniswapAdapter } from './adapters/uniswap';
import { createKafkaProducer, KafkaProducerClient } from './adapters/kafka';
import { VolatilityTracker } from './utils/vol';
import { createLogger } from './utils/logger';
import { EthereumPriceSnapshot, EventMeta, EVENT_VERSION, EVENT_SOURCE, MarketConfig } from './models/events';

const logger = createLogger('agent');

export class EthereumMarketAgent {
  private rpcClient: RpcClient;
  private uniswapAdapter: UniswapAdapter;
  private kafkaProducer: KafkaProducerClient;
  private volatilityTracker: VolatilityTracker;
  private config: ReturnType<typeof getConfig>;
  private isRunning: boolean = false;
  private lastBlockNumber: number = 0;
  private currentProvider: Provider | null = null;

  constructor() {
    this.config = getConfig();
    this.rpcClient = createRpcClient(this.config.ethWsUrl);
    this.kafkaProducer = createKafkaProducer({
      brokers: this.config.kafkaBrokers,
      clientId: this.config.kafkaClientId,
      topic: this.config.kafkaTopic,
    });
    this.volatilityTracker = new VolatilityTracker(9000, this.config.blockTimeMs);
    this.uniswapAdapter = null as unknown as UniswapAdapter;
  }

  async initialize(): Promise<void> {
    logger.info('Initializing Ethereum Market Agent');
    await this.rpcClient.connect();
    await this.rebuildAdapter();
    await this.kafkaProducer.connect();
    logger.info('Agent initialized');
  }

  private async rebuildAdapter(): Promise<void> {
    const provider = this.rpcClient.getProvider()!;
    this.currentProvider = provider;
    this.uniswapAdapter = createUniswapAdapter(provider);
    for (const market of this.config.markets) {
      await this.uniswapAdapter.registerPool(market.id, market.poolAddress, market.fee);
    }
  }

  private async ensureAdapterProvider(): Promise<void> {
    const provider = this.rpcClient.getProvider();
    if (provider && provider !== this.currentProvider) {
      logger.info('Provider changed after reconnect, rebuilding adapter');
      await this.rebuildAdapter();
    }
  }

  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.rpcClient.onBlock(async (blockNumber: number) => {
      await this.handleNewBlock(blockNumber);
    });
    logger.info('Agent started');
  }

  private async handleNewBlock(blockNumber: number): Promise<void> {
    if (blockNumber <= this.lastBlockNumber) return;
    this.lastBlockNumber = blockNumber;
    logger.debug({ blockNumber }, 'Processing block');

    try {
      await this.ensureAdapterProvider();

      const [poolDataList, gasPrice] = await Promise.all([
        this.uniswapAdapter.fetchAllPools(),
        this.rpcClient.getGasPrice(),
      ]);

      for (const poolData of poolDataList) {
        this.volatilityTracker.addPrice(poolData.marketId, poolData.priceMid);
        const vols = this.volatilityTracker.getVolatilities(poolData.marketId);
        const snapshot = this.buildSnapshot(poolData, vols, blockNumber, gasPrice);
        await this.kafkaProducer.publish(poolData.marketId, snapshot);
        logger.debug({ marketId: snapshot.marketId, priceMid: snapshot.priceMid }, 'Published');
      }
    } catch (error: any) {
      logger.error({ blockNumber, err: error?.message ?? String(error) }, 'Error processing block');
    }
  }

  private buildSnapshot(
    poolData: { marketId: string; priceMid: number; bestBid: number; bestAsk: number; liquidity10bps: string; liquidity50bps: string },
    vols: { vol1m: number; vol5m: number; vol1h: number },
    blockNumber: number,
    gasPrice: number
  ): EthereumPriceSnapshot {
    const meta: EventMeta = {
      eventId: uuidv4(),
      eventType: 'EthereumPriceSnapshot',
      version: EVENT_VERSION,
      timestampMs: Date.now(),
      source: EVENT_SOURCE,
    };
    const marketConfig = this.config.markets.find((m: MarketConfig) => m.id === poolData.marketId);
    return {
      meta,
      chainId: 'ETHEREUM',
      marketId: poolData.marketId,
      baseAsset: marketConfig?.baseAsset || '',
      quoteAsset: marketConfig?.quoteAsset || '',
      priceMid: poolData.priceMid,
      bestBid: poolData.bestBid,
      bestAsk: poolData.bestAsk,
      liquidity10bps: poolData.liquidity10bps,
      liquidity50bps: poolData.liquidity50bps,
      realizedVol1m: vols.vol1m,
      realizedVol5m: vols.vol5m,
      realizedVol1h: vols.vol1h,
      blockNumber,
      gasPriceGwei: gasPrice,
    };
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;
    this.isRunning = false;
    this.rpcClient.removeBlockListener();
    await this.kafkaProducer.disconnect();
    await this.rpcClient.disconnect();
    logger.info('Agent stopped');
  }
}

export function createAgent(): EthereumMarketAgent {
  return new EthereumMarketAgent();
}
