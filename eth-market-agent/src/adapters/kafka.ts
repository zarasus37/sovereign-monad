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
      retry: { initialRetryTime: 100, retries: 8 },
    });
  }

  async connect(): Promise<void> {
    logger.info({ brokers: this.config.brokers }, 'Connecting to Kafka');
    this.producer = this.kafka.producer();
    await this.producer.connect();
    this.isConnected = true;
    logger.info('Connected to Kafka producer');
  }

  async disconnect(): Promise<void> {
    if (this.producer && this.isConnected) {
      await this.producer.disconnect();
      this.isConnected = false;
    }
  }

  async publish<T>(key: string, value: T): Promise<void> {
    if (!this.producer || !this.isConnected) throw new Error('Producer not connected');
    const record: ProducerRecord = {
      topic: this.config.topic,
      messages: [{ key, value: JSON.stringify(value), timestamp: Date.now().toString() }],
    };
    await this.producer.send(record);
    logger.debug({ topic: this.config.topic, key }, 'Published message');
  }

  get connected(): boolean {
    return this.isConnected;
  }
}

export function createKafkaProducer(config: KafkaConfig): KafkaProducerClient {
  return new KafkaProducerClient(config);
}

