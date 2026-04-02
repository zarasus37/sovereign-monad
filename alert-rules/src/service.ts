import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import { getConfig, Config } from './config';
import { createLogger } from './utils/logger';

const logger = createLogger('alert-rules');

interface Alert {
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  fields?: { name: string; value: string }[];
}

export class AlertService {
  private kafka: Kafka;
  private consumer: Consumer;
  private config: Config;
  private lastAlertTime: Map<string, number> = new Map();

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

    for (const topic of this.config.inputTopics) {
      await this.consumer.subscribe({ topic, fromBeginning: false });
    }

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleMessage(payload);
      },
    });

    const destinations: string[] = [];
    if (this.config.discordWebhookUrl) destinations.push('Discord');
    if (this.config.slackWebhookUrl) destinations.push('Slack');
    if (destinations.length === 0) destinations.push('console-only');

    logger.info({
      topics: this.config.inputTopics,
      destinations,
    }, 'Alert service started');
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, message } = payload;
    if (!message.value) return;

    try {
      const data = JSON.parse(message.value.toString());

      switch (topic) {
        case 'market.spread.signal':
          await this.onSpreadSignal(data);
          break;
        case 'risk.opportunity-evaluation':
          await this.onRiskEvaluation(data);
          break;
        case 'execution.execution-result':
          await this.onExecutionResult(data);
          break;
        case 'market.stress-signal':
          await this.onStressSignal(data);
          break;
      }
    } catch (error) {
      logger.error({ error, topic }, 'Error processing message');
    }
  }

  // â”€â”€ Handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  private async onSpreadSignal(data: Record<string, unknown>): Promise<void> {
    const spreadBps = Number(data.spreadBps ?? 0);
    if (spreadBps < this.config.minAlertSpreadBps) return;

    await this.sendAlert('spread', {
      severity: spreadBps > 500 ? 'warning' : 'info',
      title: 'ðŸŽ¯ High Spread Detected',
      message: `${Number(spreadBps).toFixed(1)} bps  â€¢  ${data.asset}  â€¢  ${data.direction}`,
      fields: [
        { name: 'Base', value: `$${Number(data.priceM).toFixed(2)}` },
        { name: 'Ethereum', value: `$${Number(data.priceE).toFixed(2)}` },
        { name: 'Capacity', value: `$${data.notionalCapacity}` },
      ],
    });
  }

  private async onRiskEvaluation(data: Record<string, unknown>): Promise<void> {
    const approved = data.approved as boolean;
    const size = parseFloat(String(data.size ?? '0'));
    const evMean = parseFloat(String(data.evMean ?? '0'));

    if (approved && size > this.config.maxPositionAlertUsd) {
      await this.sendAlert('large-position', {
        severity: 'warning',
        title: 'âš ï¸ Large Position Approved',
        message: `$${size.toFixed(0)} position  â€¢  EV $${evMean.toFixed(2)}`,
        fields: [
          { name: 'Mode', value: String(data.mode ?? '?') },
          { name: 'Sharpe', value: String(Number(data.sharpeLike).toFixed(2)) },
        ],
      });
    }

    if (!approved && evMean > 50) {
      await this.sendAlert('rejected-ev', {
        severity: 'warning',
        title: 'âŒ High EV Rejected',
        message: `EV $${evMean.toFixed(2)} rejected  â€¢  Size $${size.toFixed(0)}`,
      });
    }
  }

  private async onExecutionResult(data: Record<string, unknown>): Promise<void> {
    const success = data.success as boolean;
    const pnl = Number(data.realizedPnl ?? data.pnl ?? 0);

    if (!success) {
      await this.sendAlert('exec-fail', {
        severity: 'critical',
        title: 'ðŸ”¥ Execution Failed',
        message: String(data.error ?? 'Unknown error'),
        fields: [
          { name: 'Plan', value: String(data.planId ?? '?') },
        ],
      });
    } else if (pnl > 100) {
      await this.sendAlert('profit', {
        severity: 'info',
        title: 'ðŸ’° Profitable Trade',
        message: `PnL $${pnl.toFixed(2)}  â€¢  Size ${data.executedSize ?? data.size}`,
      });
    }
  }

  private async onStressSignal(data: Record<string, unknown>): Promise<void> {
    const severity = String(data.severity ?? 'low');
    if (severity !== 'critical' && severity !== 'high') return;

    await this.sendAlert('stress', {
      severity: 'critical',
      title: 'ðŸš¨ Chain Stress Alert',
      message: `${data.metricType}  â€¢  severity=${severity}`,
      fields: [
        { name: 'Value', value: String(data.value ?? '?') },
        { name: 'Protocol', value: String(data.protocolId ?? '?') },
      ],
    });
  }

  // â”€â”€ Send â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  private async sendAlert(key: string, alert: Alert): Promise<void> {
    // Cooldown: no duplicate alerts within window
    const now = Date.now();
    const last = this.lastAlertTime.get(key) ?? 0;
    if (now - last < this.config.alertCooldownMs) return;
    this.lastAlertTime.set(key, now);

    logger.info({ severity: alert.severity, title: alert.title }, alert.message);

    await Promise.allSettled([
      this.sendDiscord(alert),
      this.sendSlack(alert),
    ]);
  }

  private async sendDiscord(alert: Alert): Promise<void> {
    if (!this.config.discordWebhookUrl) return;
    const colorMap = { critical: 16711680, warning: 16776960, info: 3447003 };

    const body = JSON.stringify({
      embeds: [{
        title: alert.title,
        description: alert.message,
        color: colorMap[alert.severity],
        timestamp: new Date().toISOString(),
        footer: { text: 'SMMEVAE Alert Engine' },
        fields: alert.fields?.map(f => ({ name: f.name, value: f.value, inline: true })) ?? [],
      }],
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const resp = await fetch(this.config.discordWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: controller.signal,
      });
      if (!resp.ok) logger.warn({ status: resp.status }, 'Discord webhook non-200');
    } catch (err) {
      logger.error({ err }, 'Discord webhook failed');
    } finally {
      clearTimeout(timeout);
    }
  }

  private async sendSlack(alert: Alert): Promise<void> {
    if (!this.config.slackWebhookUrl) return;
    const emoji = { critical: ':fire:', warning: ':warning:', info: ':bell:' };

    const fieldsText = alert.fields?.map(f => `*${f.name}:* ${f.value}`).join('  |  ') ?? '';
    const body = JSON.stringify({
      text: `${emoji[alert.severity]} *${alert.title}*\n${alert.message}${fieldsText ? '\n' + fieldsText : ''}`,
      username: 'SMMEVAE Alerts',
      icon_emoji: emoji[alert.severity],
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const resp = await fetch(this.config.slackWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        signal: controller.signal,
      });
      if (!resp.ok) logger.warn({ status: resp.status }, 'Slack webhook non-200');
    } catch (err) {
      logger.error({ err }, 'Slack webhook failed');
    } finally {
      clearTimeout(timeout);
    }
  }

  async stop(): Promise<void> {
    await this.consumer.disconnect();
    logger.info('Alert service stopped');
  }
}

