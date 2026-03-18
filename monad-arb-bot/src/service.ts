import { Kafka, Consumer, Producer, EachMessagePayload } from 'kafkajs';
import { ethers, JsonRpcProvider, Wallet } from 'ethers';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from './config';
import { createLogger } from './utils/logger';
import { ExecutionPlan, ExecutionResult, EventMeta } from './models/events';

const logger = createLogger('arb-bot');

export class ArbitrageBot {
  private kafka: Kafka;
  private consumer: Consumer;
  private producer: Producer;
  private config: ReturnType<typeof getConfig>;
  private provider: JsonRpcProvider | null = null;
  private wallet: Wallet | null = null;

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

    // Initialize RPC if not dry run
    if (!this.config.dryRun && this.config.privateKey) {
      this.provider = new JsonRpcProvider(this.config.monadRpcUrl);
      this.wallet = new Wallet(this.config.privateKey, this.provider);
      logger.info({ rpc: this.config.monadRpcUrl }, 'Connected to Monad RPC');
    } else {
      logger.info('Running in DRY RUN mode');
    }

    await this.consumer.subscribe({ topic: this.config.inputTopic, fromBeginning: false });
    await this.consumer.run({
      eachMessage: async (payload) => await this.handleMessage(payload),
    });
    logger.info({ topic: this.config.inputTopic }, 'Arbitrage bot started');
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { message } = payload;
    if (!message.value) return;

    try {
      const plan: ExecutionPlan = JSON.parse(message.value.toString());
      
      if (!plan.approved) {
        logger.debug({ planId: plan.planId }, 'Plan not approved, skipping');
        return;
      }

      const result = await this.executeTrade(plan);
      await this.emitResult(result);
    } catch (error) {
      logger.error({ error }, 'Error executing trade');
    }
  }

  private async executeTrade(plan: ExecutionPlan): Promise<ExecutionResult> {
    const meta: EventMeta = {
      eventId: uuidv4(),
      eventType: 'ExecutionResult',
      version: 1,
      timestampMs: Date.now(),
      source: 'monad-arb-bot',
    };

    // Dry run mode
    if (this.config.dryRun || !this.wallet) {
      return {
        meta,
        planId: plan.planId,
        success: true,
        executedSize: plan.size,
        realizedPnl: plan.expectedEv,
        gasUsed: '0',
        slippageBps: 10, // Simulated
        timestampMs: Date.now(),
      };
    }

    // Real execution (placeholder - would implement actual DEX swap logic)
    try {
      logger.info({
        planId: plan.planId,
        asset: plan.asset,
        size: plan.size,
        mode: plan.mode,
      }, 'Executing trade');

      // Placeholder: in production, would:
      // 1. Build swap transaction for Kuru/Uniswap
      // 2. Set slippage protection
      // 3. Send via Flashbots or public mempool
      // 4. Wait for confirmation

      // Simulated success for now
      return {
        meta,
        planId: plan.planId,
        success: true,
        executedSize: plan.size,
        realizedPnl: 0, // Would calculate from actual fills
        gasUsed: '50000',
        slippageBps: 20,
        timestampMs: Date.now(),
      };
    } catch (error) {
      return {
        meta,
        planId: plan.planId,
        success: false,
        executedSize: '0',
        realizedPnl: 0,
        gasUsed: '0',
        slippageBps: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestampMs: Date.now(),
      };
    }
  }

  private async emitResult(result: ExecutionResult): Promise<void> {
    await this.producer.send({
      topic: this.config.outputTopic,
      messages: [{ key: result.planId, value: JSON.stringify(result) }],
    });
    logger.info({
      planId: result.planId,
      success: result.success,
      pnl: result.realizedPnl,
    }, 'Emitted execution result');
  }

  async stop(): Promise<void> {
    await this.consumer.disconnect();
    await this.producer.disconnect();
  }
}
