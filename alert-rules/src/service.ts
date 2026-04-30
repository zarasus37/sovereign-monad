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
  private successfulTradeCount = 0;
  private reachedMilestones: Set<number> = new Set();

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

    logger.info(
      {
        topics: this.config.inputTopics,
        destinations,
        tradeMilestones: this.config.agent0TradeMilestones,
        recurringTradeMilestoneStart: this.config.agent0RecurringTradeMilestoneStart,
        recurringTradeMilestoneStep: this.config.agent0RecurringTradeMilestoneStep,
      },
      'Alert service started',
    );
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, message } = payload;
    if (!message.value) return;

    try {
      const data = JSON.parse(message.value.toString()) as Record<string, unknown>;

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

  private async onSpreadSignal(data: Record<string, unknown>): Promise<void> {
    const spreadBps = Number(data.spreadBps ?? 0);
    if (spreadBps < this.config.minAlertSpreadBps) return;

    await this.sendAlert('spread', {
      severity: spreadBps > 500 ? 'warning' : 'info',
      title: 'High Spread Detected',
      message: `${Number(spreadBps).toFixed(1)} bps | ${data.asset} | ${data.direction}`,
      fields: [
        { name: 'Base', value: `$${Number(data.priceM).toFixed(2)}` },
        { name: 'Arbitrum', value: `$${Number(data.priceE).toFixed(2)}` },
        { name: 'Capacity', value: `$${data.notionalCapacity}` },
      ],
    });
  }

  private async onRiskEvaluation(data: Record<string, unknown>): Promise<void> {
    const approved = this.parseBoolean(data.approved);
    const size = parseFloat(String(data.size ?? '0'));
    const evMean = parseFloat(String(data.evMean ?? '0'));

    if (approved && size > this.config.maxPositionAlertUsd) {
      await this.sendAlert('large-position', {
        severity: 'warning',
        title: 'Large Position Approved',
        message: `$${size.toFixed(0)} position | EV $${evMean.toFixed(2)}`,
        fields: [
          { name: 'Mode', value: String(data.mode ?? '?') },
          { name: 'Sharpe', value: String(Number(data.sharpeLike).toFixed(2)) },
        ],
      });
    }

    if (!approved && evMean > 50) {
      await this.sendAlert('rejected-ev', {
        severity: 'warning',
        title: 'High EV Rejected',
        message: `EV $${evMean.toFixed(2)} rejected | Size $${size.toFixed(0)}`,
      });
    }
  }

  private async onExecutionResult(data: Record<string, unknown>): Promise<void> {
    const success = this.parseBoolean(data.success);
    const pnl = Number(data.realizedPnl ?? data.pnl ?? 0);

    if (!success) {
      await this.sendAlert('exec-fail', {
        severity: 'critical',
        title: 'Execution Failed',
        message: String(data.error ?? 'Unknown error'),
        fields: [{ name: 'Plan', value: String(data.planId ?? '?') }],
      });
      return;
    }

    if (pnl > 100) {
      await this.sendAlert('profit', {
        severity: 'info',
        title: 'Profitable Trade',
        message: `PnL $${pnl.toFixed(2)} | Size ${data.executedSize ?? data.size}`,
      });
    }

    await this.onSuccessfulTrade(data, pnl);
  }

  private async onStressSignal(data: Record<string, unknown>): Promise<void> {
    const severity = String(data.severity ?? 'low');
    if (severity !== 'critical' && severity !== 'high') return;

    await this.sendAlert('stress', {
      severity: 'critical',
      title: 'Chain Stress Alert',
      message: `${data.metricType} | severity=${severity}`,
      fields: [
        { name: 'Value', value: String(data.value ?? '?') },
        { name: 'Protocol', value: String(data.protocolId ?? '?') },
      ],
    });
  }

  private parseBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      return normalized === 'true' || normalized === '1';
    }
    if (typeof value === 'number') return value !== 0;
    return false;
  }

  private async onSuccessfulTrade(data: Record<string, unknown>, pnl: number): Promise<void> {
    this.successfulTradeCount += 1;
    const current = this.successfulTradeCount;

    for (const milestone of this.config.agent0TradeMilestones) {
      if (current < milestone || this.reachedMilestones.has(milestone)) {
        continue;
      }

      await this.sendTradeMilestoneAlert(milestone, current, data, pnl);
    }

    const recurringStep = this.config.agent0RecurringTradeMilestoneStep;
    const recurringStart = this.config.agent0RecurringTradeMilestoneStart;

    if (recurringStep <= 0 || current < recurringStart) {
      return;
    }

    const buckets = Math.floor((current - recurringStart) / recurringStep);
    const recurringMilestone = recurringStart + buckets * recurringStep;

    if (recurringMilestone > 0 && !this.reachedMilestones.has(recurringMilestone)) {
      await this.sendTradeMilestoneAlert(recurringMilestone, current, data, pnl);
    }
  }

  private async sendTradeMilestoneAlert(
    milestone: number,
    current: number,
    data: Record<string, unknown>,
    pnl: number,
  ): Promise<void> {
    this.reachedMilestones.add(milestone);
    await this.sendAlert(`agent0-trade-milestone-${milestone}`, {
      severity: 'info',
      title: 'Agent 0 Trade Milestone',
      message: `Agent 0 reached ${milestone} successful trades (current=${current}).`,
      fields: [
        { name: 'Plan', value: String(data.planId ?? '?') },
        { name: 'Last PnL', value: `$${pnl.toFixed(2)}` },
      ],
    });
  }

  private async sendAlert(key: string, alert: Alert): Promise<void> {
    const now = Date.now();
    const last = this.lastAlertTime.get(key) ?? 0;
    if (now - last < this.config.alertCooldownMs) return;
    this.lastAlertTime.set(key, now);

    logger.info({ severity: alert.severity, title: alert.title }, alert.message);

    await Promise.allSettled([this.sendDiscord(alert), this.sendSlack(alert)]);
  }

  private async sendDiscord(alert: Alert): Promise<void> {
    if (!this.config.discordWebhookUrl) return;
    const colorMap = { critical: 16711680, warning: 16776960, info: 3447003 };

    const body = JSON.stringify({
      embeds: [
        {
          title: alert.title,
          description: alert.message,
          color: colorMap[alert.severity],
          timestamp: new Date().toISOString(),
          footer: { text: 'SMMEVAE Alert Engine' },
          fields: alert.fields?.map((f) => ({ name: f.name, value: f.value, inline: true })) ?? [],
        },
      ],
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

    const fieldsText = alert.fields?.map((f) => `*${f.name}:* ${f.value}`).join('  |  ') ?? '';
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
