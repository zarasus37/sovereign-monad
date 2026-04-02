/**
 * Opportunity Constructor Service (Phase 4)
 * 
 * Purpose: synthesize spread signals into tradeable opportunity candidates
 * that the Monte Carlo risk engine will evaluate.
 * 
 * Input: SpreadSignal (from spread-scanner)
 * Output: OpportunityCandidate (to risk-engine)
 */

import { v4 as uuidv4 } from 'uuid';
import { Kafka, Consumer, Producer, EachMessagePayload } from 'kafkajs';
import { getConfig, Config } from './config';
import { createLogger } from './utils/logger';
import { SpreadSignal, OpportunityCandidate, EventMeta, EVENT_VERSION, EVENT_SOURCE } from './models/events';

const logger = createLogger('opportunity-constructor');

export class OpportunityConstructorService {
  private kafka: Kafka;
  private consumer: Consumer;
  private producer: Producer;
  private config: Config;
  private messageCount: number = 0;
  private opportunityCount: number = 0;

  constructor() {
    this.config = getConfig();
    this.kafka = new Kafka({
      clientId: this.config.clientId,
      brokers: this.config.kafkaBrokers,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });
    this.consumer = this.kafka.consumer({ groupId: `${this.config.clientId}-group` });
    this.producer = this.kafka.producer();
  }

  /**
   * Initialize and start the service
   */
  async start(): Promise<void> {
    logger.info('Starting Opportunity Constructor Service');

    await this.consumer.connect();
    await this.producer.connect();

    await this.consumer.subscribe({
      topic: this.config.inputTopic,
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleMessage(payload);
      },
    });

    logger.info(
      { inputTopic: this.config.inputTopic, outputTopic: this.config.outputTopic },
      'Opportunity Constructor started'
    );
  }

  /**
   * Handle incoming SpreadSignal and construct OpportunityCandidate
   */
  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, message } = payload;
    this.messageCount++;

    if (!message.value) {
      logger.warn({ topic }, 'Received empty message');
      return;
    }

    try {
      const spreadSignal: SpreadSignal = JSON.parse(message.value.toString());
      
      logger.debug({
        asset: spreadSignal.asset,
        spreadBps: spreadSignal.spreadBps,
        direction: spreadSignal.direction,
      }, 'Received spread signal');

      const opportunity = this.constructOpportunity(spreadSignal);
      
      if (opportunity) {
        await this.emitOpportunity(opportunity);
        this.opportunityCount++;
      }

      if (this.messageCount % 100 === 0) {
        logger.info(
          { messagesProcessed: this.messageCount, opportunitiesCreated: this.opportunityCount },
          'Service progress'
        );
      }
    } catch (error) {
      logger.error({ error, topic }, 'Error processing message');
    }
  }

  /**
   * Construct OpportunityCandidate from SpreadSignal
   * 
   * Per spec:
   * - Compute suggested size = min(capacity * defaultSizePercent, minSizeUsd)
   * - timeWindowEstimateMs based on volatility
   * - Both modes available
   */
  private constructOpportunity(spreadSignal: SpreadSignal): OpportunityCandidate | null {
    const capacity = parseFloat(spreadSignal.notionalCapacity);

    if (!Number.isFinite(capacity) || capacity <= 0) {
      logger.debug({
        asset: spreadSignal.asset,
        capacity: spreadSignal.notionalCapacity,
        spreadBps: spreadSignal.spreadBps,
      }, 'Skipping spread signal with no executable capacity');
      return null;
    }
    
    // Compute suggested size from executable capacity.
    const sizedBasedOnCapacity = capacity * (this.config.defaultSizePercent / 100);
    const suggestedSize = Math.min(sizedBasedOnCapacity, capacity);

    if (suggestedSize < this.config.minSizeUsd) {
      logger.debug({
        asset: spreadSignal.asset,
        suggestedSize: suggestedSize.toFixed(2),
        minSizeUsd: this.config.minSizeUsd,
      }, 'Skipping spread signal below minimum trade size');
      return null;
    }

    // Estimate time window based on volatility
    // Higher vol = faster spread decay = shorter window
    const avgVol = (spreadSignal.volM5m + spreadSignal.volE5m) / 2;
    // Base: 30s, scales down with vol (vol of 0.5 -> 30s, vol of 2 -> 7.5s)
    const timeWindowEstimateMs = Math.max(5000, Math.min(60000, 30000 / (avgVol + 0.1)));

    const meta: EventMeta = {
      eventId: uuidv4(),
      eventType: 'OpportunityCandidate',
      version: EVENT_VERSION,
      timestampMs: Date.now(),
      source: EVENT_SOURCE,
    };

    // Per spec: entry/exit markets based on direction
    const isBuyMSellE = spreadSignal.direction === 'buy_M_sell_E';

    return {
      meta,
      id: uuidv4(),
      asset: spreadSignal.asset,
      direction: spreadSignal.direction,
      sizeSuggestion: suggestedSize.toFixed(2),
      entryMarket: isBuyMSellE ? spreadSignal.marketM : spreadSignal.marketE,
      exitMarket: isBuyMSellE ? spreadSignal.marketE : spreadSignal.marketM,
      modeOptions: ['inventory_based', 'bridge_based'], // Both modes available
      timeWindowEstimateMs: Math.floor(timeWindowEstimateMs),
      spreadBps: spreadSignal.spreadBps,
      volM5m: spreadSignal.volM5m,
      volE5m: spreadSignal.volE5m,
      sourceSignalId: spreadSignal.meta.eventId,
    };
  }

  /**
   * Emit OpportunityCandidate to output topic
   */
  private async emitOpportunity(opportunity: OpportunityCandidate): Promise<void> {
    await this.producer.send({
      topic: this.config.outputTopic,
      messages: [
        {
          key: opportunity.asset,
          value: JSON.stringify(opportunity),
        },
      ],
    });

    logger.info(
      {
        id: opportunity.id,
        asset: opportunity.asset,
        size: opportunity.sizeSuggestion,
        modeOptions: opportunity.modeOptions,
      },
      'Emitted OpportunityCandidate'
    );
  }

  /**
   * Graceful shutdown
   */
  async stop(): Promise<void> {
    logger.info('Stopping Opportunity Constructor');
    
    await this.consumer.disconnect();
    await this.producer.disconnect();
    
    logger.info(
      { messagesProcessed: this.messageCount, opportunitiesCreated: this.opportunityCount },
      'Opportunity Constructor stopped'
    );
  }
}
