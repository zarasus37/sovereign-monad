/**
 * Kafka producer wrapper using KafkaJS
 */

import { Kafka, Producer, ProducerRecord } from 'kafkajs';
import { createLogger } from '../utils/logger';

const logger = createLogger('kafka-adapter');

export interface KafkaConfig {
  brokers: string[];
  clientId: string;
  topic: string;
}

export class KafkaProducerClient {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private config: KafkaConfig;
  private isConnected: boolean = false;

  constructor(config: KafkaConfig) {
    this.config = config;
    this.kafka = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
    });
  }

  /**
   * Connect to Kafka
   */
  async connect(): Promise<void> {
    try {
      logger.info({ brokers: this.config.brokers }, 'Connecting to Kafka');

      this.producer = this.kafka.producer();
      await this.producer.connect();

      this.isConnected = true;
      logger.info('Connected to Kafka producer');
    } catch (error) {
      logger.error({ error }, 'Failed to connect to Kafka');
      throw error;
    }
  }

  /**
   * Disconnect from Kafka
   */
  async disconnect(): Promise<void> {
    if (this.producer && this.isConnected) {
      try {
        await this.producer.disconnect();
        this.isConnected = false;
        logger.info('Disconnected from Kafka producer');
      } catch (error) {
        logger.error({ error }, 'Error disconnecting from Kafka');
      }
    }
  }

  /**
   * Publish a message to the configured topic
   */
  async publish<T>(key: string, value: T): Promise<void> {
    if (!this.producer || !this.isConnected) {
      throw new Error('Producer not connected');
    }

    const record: ProducerRecord = {
      topic: this.config.topic,
      messages: [
        {
          key,
          value: JSON.stringify(value),
          timestamp: Date.now().toString(),
        },
      ],
    };

    try {
      await this.producer.send(record);
      logger.debug({ topic: this.config.topic, key }, 'Published message');
    } catch (error) {
      logger.error({ error, topic: this.config.topic, key }, 'Failed to publish message');
      throw error;
    }
  }

  /**
   * Publish multiple messages in a single batch
   */
  async publishBatch<T>(messages: { key: string; value: T }[]): Promise<void> {
    if (!this.producer || !this.isConnected) {
      throw new Error('Producer not connected');
    }

    const record: ProducerRecord = {
      topic: this.config.topic,
      messages: messages.map((m) => ({
        key: m.key,
        value: JSON.stringify(m.value),
        timestamp: Date.now().toString(),
      })),
    };

    try {
      await this.producer.send(record);
      logger.debug({ topic: this.config.topic, count: messages.length }, 'Published batch');
    } catch (error) {
      logger.error({ error, topic: this.config.topic }, 'Failed to publish batch');
      throw error;
    }
  }

  /**
   * Check if producer is connected
   */
  get connected(): boolean {
    return this.isConnected;
  }
}

export function createKafkaProducer(config: KafkaConfig): KafkaProducerClient {
  return new KafkaProducerClient(config);
}

