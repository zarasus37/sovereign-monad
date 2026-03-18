/**
 * Alert Rules for Monad MEV System
 * Monitors Kafka topics and sends alerts to Discord/SMS
 * 
 * Run: npx ts-node alert-rules.ts
 */

import { Kafka, Consumer, EachMessagePayload } from 'kafkajs';
import axios from 'axios';

// Configuration
const config = {
  kafkaBrokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
  discordWebhook: process.env.DISCORD_WEBHOOK || '',
  slackWebhook: process.env.SLACK_WEBHOOK || '',
  // Alert thresholds
  thresholds: {
    minSpreadBps: parseFloat(process.env.MIN_SPREAD_BPS || '10'),
    maxPositionUsd: parseFloat(process.env.MAX_POSITION_USD || '100'),
    minEvThreshold: parseFloat(process.env.MIN_EV_THRESHOLD || '100'),
    alertOnProfit: true,
    alertOnLoss: true,
    alertOnBridgeJam: true, // No new blocks > 30s
  },
};

interface Alert {
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

class AlertManager {
  private kafka: Kafka;
  private consumer: Consumer;
  private lastBlockTime: number = 0;

  constructor() {
    this.kafka = new Kafka({
      clientId: 'alert-manager',
      brokers: config.kafkaBrokers,
    });
    this.consumer = this.kafka.consumer({ groupId: 'alert-manager-group' });
  }

  async start(): Promise<void> {
    console.log('Starting Alert Manager...');
    
    await this.consumer.connect();
    
    // Subscribe to all relevant topics
    await this.consumer.subscribe({
      topics: [
        'market.spread.signal',
        'risk.opportunity-evaluation', 
        'execution.execution-result',
        'market.stress-signal',
      ],
      fromBeginning: false,
    });

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        await this.handleMessage(payload);
      },
    });

    // Monitor for block jams
    setInterval(() => this.checkBlockJam(), 30000);

    console.log('Alert Manager running');
  }

  private async handleMessage(payload: EachMessagePayload): Promise<void> {
    const { topic, message } = payload;
    if (!message.value) return;

    try {
      const data = JSON.parse(message.value.toString());
      
      switch (topic) {
        case 'market.spread.signal':
          await this.checkSpreadSignal(data);
          break;
        case 'risk.opportunity-evaluation':
          await this.checkRiskEvaluation(data);
          break;
        case 'execution.execution-result':
          await this.checkExecutionResult(data);
          break;
        case 'market.stress-signal':
          await this.checkStressSignal(data);
          break;
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  }

  private async checkSpreadSignal(data: any): Promise<void> {
    const spreadBps = data.spreadBps || data.data?.spreadBps;
    
    if (spreadBps >= config.thresholds.minSpreadBps) {
      await this.sendAlert({
        severity: 'info',
        title: '🎯 High Spread Detected',
        message: `Spread: ${spreadBps.toFixed(2)} bps | Asset: ${data.asset || data.data?.asset}`,
        data,
      });
    }
  }

  private async checkRiskEvaluation(data: any): Promise<void> {
    const approved = data.approved ?? data.data?.approved;
    const evMean = data.evMean ?? data.data?.evMean;
    const size = data.size ?? data.data?.size;
    const sizeUsd = parseFloat(size) || 0;

    if (approved && sizeUsd > config.thresholds.maxPositionUsd) {
      await this.sendAlert({
        severity: 'warning',
        title: '⚠️ Large Position Alert',
        message: `Approved: $${sizeUsd} | EV: $${evMean?.toFixed(2)}`,
        data,
      });
    }

    if (!approved && evMean > config.thresholds.minEvThreshold) {
      await this.sendAlert({
        severity: 'warning',
        title: '❌ High EV Rejected',
        message: `EV: $${evMean.toFixed(2)} | Reason: Check risk metrics`,
        data,
      });
    }
  }

  private async checkExecutionResult(data: any): Promise<void> {
    const success = data.success ?? data.data?.success;
    const pnl = data.realizedPnl ?? data.data?.realizedPnl;
    const size = data.executedSize ?? data.data?.executedSize;

    if (success && config.thresholds.alertOnProfit && pnl > 10) {
      await this.sendAlert({
        severity: 'info',
        title: '💰 Profit Locked',
        message: `PnL: $${pnl.toFixed(2)} | Size: ${size}`,
        data,
      });
    }

    if (!success && config.thresholds.alertOnLoss) {
      await this.sendAlert({
        severity: 'critical',
        title: '🔥 Execution Failed',
        message: `Error: ${data.error || data.data?.error || 'Unknown'}`,
        data,
      });
    }
  }

  private async checkStressSignal(data: any): Promise<void> {
    const severity = data.severity || data.data?.severity;
    
    if (severity === 'critical' || severity === 'high') {
      await this.sendAlert({
        severity: 'critical',
        title: '🚨 Stress Detected',
        message: `${data.metricType || data.data?.metricType} | ${data.protocolId || data.data?.protocolId}`,
        data,
      });
    }
  }

  private async checkBlockJam(): Promise<void> {
    // In production: check if new blocks are coming
    // If no new blocks > 30s, alert
    const now = Date.now();
    if (this.lastBlockTime > 0 && now - this.lastBlockTime > 30000) {
      await this.sendAlert({
        severity: 'critical',
        title: '⛔ Possible Block Jam',
        message: `No new blocks for ${((now - this.lastBlockTime)/1000).toFixed(0)}s`,
      });
    }
  }

  private async sendAlert(alert: Alert): Promise<void> {
    const timestamp = new Date().toISOString();
    const formatted = `[${alert.severity.toUpperCase()}] ${alert.title}\n${alert.message}`;
    
    console.log(formatted);

    // Send to Discord
    if (config.discordWebhook) {
      try {
        await axios.post(config.discordWebhook, {
          embeds: [{
            title: alert.title,
            description: alert.message,
            color: alert.severity === 'critical' ? 16711680 : alert.severity === 'warning' ? 16776960 : 3447003,
            timestamp,
            fields: alert.data ? Object.entries(alert.data).map(([k, v]) => ({
              name: k,
              value: String(v),
              inline: true,
            })) : [],
          }],
        });
      } catch (error) {
        console.error('Failed to send Discord alert:', error);
      }
    }

    // Send to Slack
    if (config.slackWebhook) {
      try {
        await axios.post(config.slackWebhook, {
          text: formatted,
          username: 'Monad MEV Alerts',
          icon_emoji: alert.severity === 'critical' ? ':fire:' : alert.severity === 'warning' ? ':warning:' : ':bell:',
        });
      } catch (error) {
        console.error('Failed to send Slack alert:', error);
      }
    }
  }

  async stop(): Promise<void> {
    await this.consumer.disconnect();
  }
}

// Main
async function main() {
  const manager = new AlertManager();
  
  process.on('SIGINT', async () => {
    console.log('Shutting down...');
    await manager.stop();
    process.exit(0);
  });

  await manager.start();
}

main().catch(console.error);
