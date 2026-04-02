import { Kafka, Consumer, Producer, EachMessagePayload } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from './config';
import { createLogger } from './utils/logger';
import { ChainAPriceSnapshot, ChainBPriceSnapshot, SpreadSignal, EventMeta } from './models/events';

const logger = createLogger('scanner');

export class SpreadScanner {
  private kafka: Kafka;
  private consumer: Consumer;
  private producer: Producer;
  private config: ReturnType<typeof getConfig>;
  private latestPrices: Map<string, { chainA?: ChainAPriceSnapshot; chainB?: ChainBPriceSnapshot }> = new Map();
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
        state.chainA = data as ChainAPriceSnapshot;
      } else {
        state.chainB = data as ChainBPriceSnapshot;
      }

      // Check if we have both prices for this asset
      if (state.chainA && state.chainB) {
        const spread = this.calculateSpread(state.chainA, state.chainB);
        if (spread) {
          await this.emitSpreadSignalIfChanged(spread);
        }
      }
    } catch (error) {
      logger.error({ error, topic }, 'Error processing message');
    }
  }

  private calculateSpread(chainA: ChainAPriceSnapshot, chainB: ChainBPriceSnapshot): SpreadSignal | null {
    const spreadBps = (10000 * (chainA.priceMid - chainB.priceMid)) / chainB.priceMid;
    const absSpreadBps = Math.abs(spreadBps);

    // Filter by minimum spread
    if (absSpreadBps < this.config.minSpreadBps) return null;

    // Calculate capacity (min of both sides)
    const capA = parseFloat(chainA.liquidity10bps);
    const capB = parseFloat(chainB.liquidity10bps);

    if (capA < this.config.minLiquidity10bpsUsd || capB < this.config.minLiquidity10bpsUsd) {
      return null;
    }

    const capacity = Math.min(capA, capB);

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
      asset: chainA.baseAsset,
      marketM: chainA.marketId,
      marketE: chainB.marketId,
      priceM: chainA.priceMid,
      priceE: chainB.priceMid,
      spreadBps,
      direction: spreadBps > 0 ? 'buy_M_sell_E' : 'buy_E_sell_M',
      notionalCapacity: capacity.toFixed(2),
      volM5m: chainA.realizedVol5m,
      volE5m: chainB.realizedVol5m,
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
