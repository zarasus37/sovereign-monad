import { Kafka, Consumer, Producer, EachMessagePayload } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from './config';
import { createLogger } from './utils/logger';
import { OpportunityEvaluation, ExecutionPlan, EventMeta, PortfolioState } from './models/events';
import { applyConstraints, buildExecutionPlan, ConstraintDecision } from './planning';

const logger = createLogger('portfolio-manager');

export class PortfolioManager {
  private kafka: Kafka;
  private consumer: Consumer;
  private producer: Producer;
  private config: ReturnType<typeof getConfig>;
  private portfolio: PortfolioState = {
    totalValueUsd: 100000, // Default starting capital
    bridgeExposure: [],
    chainExposure: [
      { chain: 'MONAD', percent: 0 },
      { chain: 'ETHEREUM', percent: 0 },
    ],
    openPositions: [],
  };

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
    await this.consumer.subscribe({ topic: this.config.inputTopic, fromBeginning: false });
    await this.consumer.run({
      eachMessage: async (payload) => await this.handleMessage(payload),
    });
    logger.info('Portfolio manager started');
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { message } = payload;
    if (!message.value) return;

    try {
      const evaluation: OpportunityEvaluation = JSON.parse(message.value.toString());
      
      // Apply portfolio constraints
      const decision = applyConstraints(evaluation, this.portfolio, {
        maxBridgeExposurePercent: this.config.maxBridgeExposurePercent,
        maxSingleTradePercent: this.config.maxSingleTradePercent,
        supportedExecutionModes: this.config.supportedExecutionModes,
      });
      
      if (decision.approved) {
        const plan = buildExecutionPlan(evaluation, decision);
        await this.emitPlan(plan);
        this.updatePortfolio(evaluation, decision);
      } else {
        logger.info(
          {
            opportunityId: evaluation.opportunityId,
            mode: evaluation.mode,
            reason: decision.reason,
          },
          'Rejected execution plan after portfolio constraints'
        );
      }
    } catch (error) {
      logger.error({ error }, 'Error processing evaluation');
    }
  }

  private updatePortfolio(evaluation: OpportunityEvaluation, decision: ConstraintDecision): void {
    if (!decision.approved) return;

    const sizePercent = (parseFloat(decision.size) / this.portfolio.totalValueUsd) * 100;
    this.portfolio.openPositions.push(evaluation.opportunityId);

    if (evaluation.mode === 'bridge_based') {
      const bridgeExp = this.portfolio.bridgeExposure.find((b: {bridge: string; percent: number}) => b.bridge === 'monad-native');
      if (bridgeExp) {
        bridgeExp.percent += sizePercent;
      } else {
        this.portfolio.bridgeExposure.push({ bridge: 'monad-native', percent: sizePercent });
      }
    }
  }

  private async emitPlan(plan: ExecutionPlan): Promise<void> {
    await this.producer.send({
      topic: this.config.outputTopic,
      messages: [{ key: plan.planId, value: JSON.stringify(plan) }],
    });
    logger.info({ planId: plan.planId, approved: plan.approved, size: plan.size }, 'Emitted execution plan');
  }

  async stop(): Promise<void> {
    await this.consumer.disconnect();
    await this.producer.disconnect();
  }
}
