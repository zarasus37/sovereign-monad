/**
 * Risk Engine Service (Phase 5)
 * 
 * Purpose: Monte Carlo risk evaluation for cross-chain arbitrage
 * 
 * Input: OpportunityCandidate (from opportunity-constructor)
 * Output: OpportunityEvaluation (to portfolio-manager)
 * 
 * Per spec:
 * - Runs Monte Carlo simulation per opportunity
 * - Evaluates both inventory_based and bridge_based modes
 * - Computes EV, std, Sharpe-like, tail risk
 * - Applies decision policy
 */

import { Kafka, Consumer, Producer, EachMessagePayload } from 'kafkajs';
import { getConfig, Config } from './config';
import { createLogger } from './utils/logger';
import { OpportunityCandidate, OpportunityEvaluation } from './models/events';
import { ArbitrageSignal, RiskGnosisEngine, SpreadSnapshot } from './core/rge';
import { GasPriceOracle } from './gas-oracle';
import { shouldApproveEvaluation } from './approval';

const logger = createLogger('risk-engine');

export class RiskEngineService {
  private kafka: Kafka;
  private consumer: Consumer;
  private producer: Producer;
  private config: Config;
  private readonly engine: RiskGnosisEngine;
  private readonly gasOracle: GasPriceOracle;
  private messageCount: number = 0;
  private evaluationCount: number = 0;

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
    this.engine = new RiskGnosisEngine(
      10_000,
      0.30,
      this.config.fixedCostBps,
      this.config.minEffectiveSpreadBps
    );
    this.gasOracle = new GasPriceOracle(this.config.executionRpcUrl);
  }

  /**
   * Initialize and start the service
   */
  async start(): Promise<void> {
    logger.info('Starting Risk Engine Service');

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
      { 
        inputTopic: this.config.inputTopic, 
        outputTopic: this.config.outputTopic,
        simulations: this.config.simulations,
        evThreshold: this.config.evMinThreshold,
        sharpeThreshold: this.config.sharpeLikeThreshold,
        fixedCostBps: this.config.fixedCostBps,
        minEffectiveSpreadBps: this.config.minEffectiveSpreadBps,
      },
      'Risk Engine started'
    );
  }

  /**
   * Handle incoming OpportunityCandidate
   */
  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, message } = payload;
    this.messageCount++;

    if (!message.value) {
      logger.warn({ topic }, 'Received empty message');
      return;
    }

    try {
      const opportunity: OpportunityCandidate = JSON.parse(message.value.toString());
      
      logger.debug({
        opportunityId: opportunity.id,
        asset: opportunity.asset,
        modeOptions: opportunity.modeOptions,
      }, 'Received opportunity candidate');

      // Evaluate each mode (inventory_based and bridge_based)
      for (const mode of opportunity.modeOptions) {
        await this.evaluateMode(opportunity, mode);
        this.evaluationCount++;
      }

      if (this.messageCount % 100 === 0) {
        logger.info(
          { messagesProcessed: this.messageCount, evaluationsCreated: this.evaluationCount },
          'Service progress'
        );
      }
    } catch (error) {
      logger.error({ error, topic }, 'Error processing message');
    }
  }

  /**
   * Evaluate a single mode for an opportunity
   */
  private async evaluateMode(
    opportunity: OpportunityCandidate,
    mode: 'inventory_based' | 'bridge_based'
  ): Promise<void> {
    const snapshot = this.createSnapshot(opportunity, mode);
    const signal = this.engine.generateSignal(snapshot);

    // Dynamic gas cost: fetch real gas price, compute USD cost
    const gasPriceGwei = await this.gasOracle.getGasPriceGwei();
    const gasCostUsd = GasPriceOracle.gasCostUsd(
      gasPriceGwei,
      this.config.gasLimitUnits,
      this.config.ethPriceUsd
    );
    // Bridge mode pays gas on both chains
    const totalGasCostUsd = mode === 'bridge_based' ? gasCostUsd * 2 : gasCostUsd;

    const evaluation = this.createEvaluation(opportunity, mode, snapshot, signal, totalGasCostUsd);

    await this.emitEvaluation(evaluation);
  }

  private createSnapshot(
    opportunity: OpportunityCandidate,
    mode: 'inventory_based' | 'bridge_based'
  ): SpreadSnapshot {
    return {
      direction: opportunity.direction,
      rawSpreadBps: opportunity.spreadBps,
      bridgeDelaySec: mode === 'inventory_based' ? 0 : opportunity.timeWindowEstimateMs / 1000,
    };
  }

  private createEvaluation(
    opportunity: OpportunityCandidate,
    mode: 'inventory_based' | 'bridge_based',
    snapshot: SpreadSnapshot,
    signal: ArbitrageSignal | null,
    gasCostUsd: number
  ): OpportunityEvaluation {
    const maxSuggestedSize = parseFloat(opportunity.sizeSuggestion);
    const rawNotional = signal?.kellySizeUsd ?? 0;
    const notional = Math.max(0, Math.min(rawNotional, maxSuggestedSize));
    const effectiveSpreadBps = signal?.effectiveSpreadBps ?? this.engine.effectiveSpread(
      snapshot.rawSpreadBps,
      snapshot.bridgeDelaySec
    );
    const effectiveEdgeFrac = Math.max(effectiveSpreadBps, 0) * 0.0001;
    const timeScale = Math.sqrt(Math.max(snapshot.bridgeDelaySec, 1) / 31_557_600);
    const evMean = notional * effectiveEdgeFrac * 0.65 - gasCostUsd;
    const evStd = notional > 0 ? Math.max(notional * 0.30 * timeScale, 0.01) : 0;
    const sharpeLike = evStd > 0 ? evMean / evStd : 0;
    const maxDrawdownEstimate = notional > 0 ? -(notional * 0.30 * timeScale * 2) : 0;
    const approved = shouldApproveEvaluation(
      {
        signal,
        notional,
        evMean,
        sharpeLike,
        maxDrawdownEstimate,
      },
      this.config
    );

    return {
      meta: {
        eventId: opportunity.meta.eventId,
        eventType: 'OpportunityEvaluation',
        version: 1,
        timestampMs: Date.now(),
        source: 'risk-engine',
      },
      opportunityId: opportunity.id,
      mode,
      evMean,
      evStd,
      sharpeLike,
      pLossGtX: approved ? 0.35 : 1,
      maxDrawdownEstimate,
      approved,
      size: notional.toFixed(2),
      timeWindowMs: opportunity.timeWindowEstimateMs,
    };
  }

  /**
   * Emit OpportunityEvaluation to output topic
   */
  private async emitEvaluation(evaluation: OpportunityEvaluation): Promise<void> {
    await this.producer.send({
      topic: this.config.outputTopic,
      messages: [
        {
          key: evaluation.opportunityId,
          value: JSON.stringify(evaluation),
        },
      ],
    });

    logger.info(
      {
        opportunityId: evaluation.opportunityId,
        mode: evaluation.mode,
        approved: evaluation.approved,
        evMean: evaluation.evMean.toFixed(2),
        evStd: evaluation.evStd.toFixed(2),
        sharpeLike: evaluation.sharpeLike.toFixed(3),
        size: evaluation.size,
      },
      'Emitted OpportunityEvaluation'
    );
  }

  /**
   * Graceful shutdown
   */
  async stop(): Promise<void> {
    logger.info('Stopping Risk Engine');
    
    await this.consumer.disconnect();
    await this.producer.disconnect();
    
    logger.info(
      { messagesProcessed: this.messageCount, evaluationsCreated: this.evaluationCount },
      'Risk Engine stopped'
    );
  }
}
