export interface Config {
  kafkaBrokers: string[];
  inputTopics: string[];
  clientId: string;
  logLevel: string;
  discordWebhookUrl: string;
  slackWebhookUrl: string;
  // Thresholds
  minAlertSpreadBps: number;
  maxPositionAlertUsd: number;
  alertCooldownMs: number;
}

let configInstance: Config | null = null;

export function getConfig(): Config {
  if (configInstance) return configInstance;
  const brokers = process.env.KAFKA_BROKERS;
  if (!brokers) throw new Error('KAFKA_BROKERS required');
  configInstance = {
    kafkaBrokers: brokers.split(',').map(b => b.trim()),
    inputTopics: (process.env.INPUT_TOPICS || 'market.spread.signal,risk.opportunity-evaluation,execution.execution-result,market.stress-signal').split(','),
    clientId: process.env.KAFKA_CLIENT_ID || 'alert-rules',
    logLevel: process.env.LOG_LEVEL || 'info',
    discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
    slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || '',
    minAlertSpreadBps: parseFloat(process.env.MIN_ALERT_SPREAD_BPS || '50'),
    maxPositionAlertUsd: parseFloat(process.env.MAX_POSITION_ALERT_USD || '5000'),
    alertCooldownMs: parseInt(process.env.ALERT_COOLDOWN_MS || '30000'),
  };
  return configInstance;
}
