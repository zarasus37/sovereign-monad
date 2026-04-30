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
  agent0TradeMilestones: number[];
  agent0RecurringTradeMilestoneStart: number;
  agent0RecurringTradeMilestoneStep: number;
}

let configInstance: Config | null = null;

export function getConfig(): Config {
  if (configInstance) return configInstance;
  const brokers = process.env.KAFKA_BROKERS;
  if (!brokers) throw new Error('KAFKA_BROKERS required');

  const milestones = (process.env.AGENT0_TRADE_MILESTONES || '50,100')
    .split(',')
    .map((value) => parseInt(value.trim(), 10))
    .filter((value) => Number.isFinite(value) && value > 0)
    .sort((a, b) => a - b);

  const recurringStartRaw = parseInt(process.env.AGENT0_RECURRING_TRADE_MILESTONE_START || '5000', 10);
  const recurringStepRaw = parseInt(process.env.AGENT0_RECURRING_TRADE_MILESTONE_STEP || '5000', 10);
  const recurringStart = Number.isFinite(recurringStartRaw) && recurringStartRaw > 0 ? recurringStartRaw : 5000;
  const recurringStep = Number.isFinite(recurringStepRaw) && recurringStepRaw > 0 ? recurringStepRaw : 5000;

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
    agent0TradeMilestones: milestones.length > 0 ? milestones : [50, 100],
    agent0RecurringTradeMilestoneStart: recurringStart,
    agent0RecurringTradeMilestoneStep: recurringStep,
  };
  return configInstance;
}
