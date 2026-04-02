import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from './config';
import { createLogger } from './utils/logger';
import * as fs from 'fs';
import * as path from 'path';

const logger = createLogger('feedback-logger');

export interface LoggedEvent {
  eventId: string;
  eventType: string;
  timestampMs: number;
  source: string;
  data: Record<string, unknown>;
}

export class FeedbackLogger {
  private kafka: Kafka;
  private consumer: Consumer;
  private config: ReturnType<typeof getConfig>;
  private eventCount: number = 0;
  private fileSize: number = 0;
  private currentFile: string = '';

  constructor() {
    this.config = getConfig();
    this.kafka = new Kafka({
      clientId: this.config.clientId,
      brokers: this.config.kafkaBrokers,
    });
    this.consumer = this.kafka.consumer({ groupId: `${this.config.clientId}-group` });
  }

  async start(): Promise<void> {
    await this.consumer.connect();

    // Ensure output directory exists
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }

    for (const topic of this.config.inputTopics) {
      await this.consumer.subscribe({ topic, fromBeginning: false });
    }

    await this.consumer.run({
      eachMessage: async (payload) => await this.handleMessage(payload),
    });
    logger.info({ topics: this.config.inputTopics }, 'Feedback logger started');
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, message } = payload;
    if (!message.value) return;

    try {
      const data = JSON.parse(message.value.toString());
      
      const loggedEvent: LoggedEvent = {
        eventId: uuidv4(),
        eventType: topic,
        timestampMs: Date.now(),
        source: 'feedback-logger',
        data,
      };

      await this.writeEvent(loggedEvent);
      this.eventCount++;

      if (this.eventCount % 100 === 0) {
        logger.info({ count: this.eventCount, file: path.basename(this.currentFile) }, 'Logged events');
      }
    } catch (error) {
      logger.error({ error, topic }, 'Error logging event');
    }
  }

  private async writeEvent(event: LoggedEvent): Promise<void> {
    // Rotate file daily or when size > 100MB
    const today = new Date().toISOString().split('T')[0];
    const newFile = path.join(this.config.outputDir, `feedback-${today}.jsonl`);

    if (newFile !== this.currentFile) {
      this.currentFile = newFile;
      this.fileSize = 0;
    }

    const line = JSON.stringify(event) + '\n';
    fs.appendFileSync(this.currentFile, line);
    this.fileSize += line.length;
  }

  async stop(): Promise<void> {
    await this.consumer.disconnect();
    logger.info({ totalEvents: this.eventCount }, 'Feedback logger stopped');
  }
}
