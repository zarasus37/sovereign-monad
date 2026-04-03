import { Kafka, Producer } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { getServiceConfig, loadSourceConfig } from './config';
import { deriveState, validateSourceConfig } from './source-state';
import { SlotSourceConfig, SourceHealthPayload } from './types';
import { createLogger } from './utils/logger';

const logger = createLogger('slot-core');

/**
 * SlotSourceMonitor
 *
 * Tracks the approved-source lifecycle (bootstrap -> Stake cutover) and emits
 * periodic health snapshots to the system.health Kafka topic.
 *
 * This service is config-driven. It reads state from the local slot-source.json
 * and emits what the config says. It does NOT query the deployed InboundReceiver
 * contract directly. On-chain source management is handled by:
 *   sovereign-monad/scripts/slot-source-handoff.js
 *
 * When Phase 1a contracts are live and a real Stake-linked source is registered,
 * update config/slot-source.json to reflect the real addresses.
 */
export class SlotSourceMonitor {
  private kafka: Kafka;
  private producer: Producer;
  private serviceConfig: ReturnType<typeof getServiceConfig>;
  private sourceConfig: SlotSourceConfig | null = null;
  private pollInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor() {
    this.serviceConfig = getServiceConfig();
    this.kafka = new Kafka({
      clientId: this.serviceConfig.clientId,
      brokers: this.serviceConfig.kafkaBrokers,
    });
    this.producer = this.kafka.producer();
  }

  async start(): Promise<void> {
    this.sourceConfig = loadSourceConfig(this.serviceConfig.sourceConfigPath);

    const errors = validateSourceConfig(this.sourceConfig);
    if (errors.length > 0) {
      throw new Error(
        `Invalid slot source config (${this.serviceConfig.sourceConfigPath}):\n` +
          errors.map((e) => `  - ${e}`).join('\n'),
      );
    }

    await this.producer.connect();

    const state = deriveState(this.sourceConfig);
    logger.info(
      { state, configPath: this.serviceConfig.sourceConfigPath },
      'Slot source config loaded',
    );

    this.isRunning = true;

    await this.emitHealthSnapshot();
    this.pollInterval = setInterval(
      () => this.emitHealthSnapshot(),
      this.serviceConfig.pollIntervalMs,
    );

    logger.info(
      { intervalMs: this.serviceConfig.pollIntervalMs, topic: this.serviceConfig.outputTopic },
      'Slot source monitor running',
    );
  }

  async emitHealthSnapshot(): Promise<void> {
    if (!this.sourceConfig) {
      return;
    }

    const state = deriveState(this.sourceConfig);

    const payload: SourceHealthPayload = {
      eventId: uuidv4(),
      eventType: 'SlotSourceHealth',
      timestampMs: Date.now(),
      state,
      sources: {
        bootstrap: this.sourceConfig.sources.bootstrap,
        stake: this.sourceConfig.sources.stake,
      },
      configDriven: true,
      note:
        'Source state derived from local config. ' +
        'On-chain source registration is managed by sovereign-monad/scripts/slot-source-handoff.js. ' +
        'Do not set stake.active=true until the Stake-linked source exists on-chain.',
    };

    await this.producer.send({
      topic: this.serviceConfig.outputTopic,
      messages: [{ key: 'slot-source-health', value: JSON.stringify(payload) }],
    });

    logger.info({ state, topic: this.serviceConfig.outputTopic }, 'Slot source health emitted');
  }

  async reload(): Promise<void> {
    const fresh = loadSourceConfig(this.serviceConfig.sourceConfigPath);
    const errors = validateSourceConfig(fresh);
    if (errors.length > 0) {
      logger.warn({ errors }, 'Config reload rejected - validation failed, keeping current config');
      return;
    }

    this.sourceConfig = fresh;
    const state = deriveState(this.sourceConfig);
    logger.info({ state }, 'Slot source config reloaded');
    await this.emitHealthSnapshot();
  }

  async stop(): Promise<void> {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
    this.isRunning = false;
    await this.producer.disconnect();
    logger.info('Slot source monitor stopped');
  }

  get running(): boolean {
    return this.isRunning;
  }
}
