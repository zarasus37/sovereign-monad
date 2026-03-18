import { Kafka, Consumer, Producer, EachMessagePayload } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from './config';
import { createLogger } from './utils/logger';
import { MonadPriceSnapshot, EthereumPriceSnapshot, SpreadSignal, EventMeta } from './models/events';

const logger = createLogger('scanner');

export class SpreadScanner {
  private kafka: Kafka;
  private consumer: Consumer;
  private producer: Producer;
  private config: ReturnType<typeof getConfig>;
  private latestPrices: Map<string, { monad?: MonadPriceSnapshot; eth?: EthereumPriceSnapshot }> = new Map();
  private lastSignalFingerprint: Map<string, string> = new Map();

  constructor() {
    this.config = getConfig();
    this.kafka = new Kafka({
      clientId: this.config.clientId,
      brokers: this.config.kafkaBrokers,
    });
    this.consumer = this.kafka.consumer({ groupId: `${this.config.clientId}-group` });
    this.producer = this.kafka.producer();
  }

  async start(): Promise<void> {
    await this.consumer.connect();
    await this.producer.connect();

    for (const topic of this.config.inputTopics) {
      await this.consumer.subscribe({ topic, fromBeginning: false });
    }

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleMessage(payload);
      },
    });

    logger.info({ topics: this.config.inputTopics }, 'Scanner started');
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, message } = payload;
    if (!message.value) return;

    try {
      const data = JSON.parse(message.value.toString());
      const marketKey = data.baseAsset; // e.g., "ETH"

      let state = this.latestPrices.get(marketKey);
      if (!state) {
        state = {};
        this.latestPrices.set(marketKey, state);
      }

      if (topic === this.config.inputTopics[0]) {
        state.monad = data as MonadPriceSnapshot;
      } else {
        state.eth = data as EthereumPriceSnapshot;
      }

      // Check if we have both prices for this asset
      if (state.monad && state.eth) {
        const spread = this.calculateSpread(state.monad, state.eth);
        if (spread) {
          await this.emitSpreadSignalIfChanged(spread);
        }
      }
    } catch (error) {
      logger.error({ error, topic }, 'Error processing message');
    }
  }

  private calculateSpread(monad: MonadPriceSnapshot, eth: EthereumPriceSnapshot): SpreadSignal | null {
    const spreadBps = (10000 * (monad.priceMid - eth.priceMid)) / eth.priceMid;
    const absSpreadBps = Math.abs(spreadBps);

    // Filter by minimum spread
    if (absSpreadBps < this.config.minSpreadBps) return null;

    // Calculate capacity (min of both sides)
    const capM = parseFloat(monad.liquidity10bps);
    const capE = parseFloat(eth.liquidity10bps);

    if (capM < this.config.minLiquidity10bpsUsd || capE < this.config.minLiquidity10bpsUsd) {
      return null;
    }

    const capacity = Math.min(capM, capE);

    if (capacity < this.config.minCapacityUsd) return null;

    const meta: EventMeta = {
      eventId: uuidv4(),
      eventType: 'SpreadSignal',
      version: 1,
      timestampMs: Date.now(),
      source: 'spread-scanner',
    };

    return {
      meta,
      asset: monad.baseAsset,
      marketM: monad.marketId,
      marketE: eth.marketId,
      priceM: monad.priceMid,
      priceE: eth.priceMid,
      spreadBps,
      direction: spreadBps > 0 ? 'buy_M_sell_E' : 'buy_E_sell_M',
      notionalCapacity: capacity.toFixed(2),
      volM5m: monad.realizedVol5m,
      volE5m: eth.realizedVol5m,
      timestampMs: Date.now(),
    };
  }

  private async emitSpreadSignal(signal: SpreadSignal): Promise<void> {
    await this.producer.send({
      topic: this.config.outputTopic,
      messages: [{ key: signal.asset, value: JSON.stringify(signal) }],
    });
    logger.info({
      asset: signal.asset,
      spreadBps: signal.spreadBps.toFixed(2),
      direction: signal.direction,
    }, 'Emitted spread signal');
  }

  private async emitSpreadSignalIfChanged(signal: SpreadSignal): Promise<void> {
    const fingerprint = this.buildSignalFingerprint(signal);
    const previousFingerprint = this.lastSignalFingerprint.get(signal.asset);

    if (previousFingerprint === fingerprint) {
      return;
    }

    this.lastSignalFingerprint.set(signal.asset, fingerprint);
    await this.emitSpreadSignal(signal);
  }

  private buildSignalFingerprint(signal: SpreadSignal): string {
    return [
      signal.asset,
      signal.marketM,
      signal.marketE,
      signal.direction,
      signal.priceM.toFixed(4),
      signal.priceE.toFixed(4),
      signal.spreadBps.toFixed(2),
      signal.notionalCapacity,
    ].join('|');
  }

  async stop(): Promise<void> {
    await this.consumer.disconnect();
    await this.producer.disconnect();
    logger.info('Scanner stopped');
  }
}
