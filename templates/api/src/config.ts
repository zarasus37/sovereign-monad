import path from 'path';

export interface RuntimeConfig {
  port: number;
  portfolioUsd: number;
  annualVolatility: number;
  fixedCostBps: number;
  minEffectiveSpreadBps: number;
  evMinThreshold: number;
  sharpeLikeThreshold: number;
  maxTailLossPercent: number;
  defaultBridgeDelaySec: number;
  keyStorePath: string;
}

let runtimeConfig: RuntimeConfig | null = null;

export function getRuntimeConfig(): RuntimeConfig {
  if (runtimeConfig) {
    return runtimeConfig;
  }

  runtimeConfig = {
    port: parseInt(process.env.PORT || '3000', 10),
    portfolioUsd: parseFloat(process.env.RISK_PORTFOLIO_USD || '10000'),
    annualVolatility: parseFloat(process.env.RISK_ANNUAL_VOL || '0.30'),
    fixedCostBps: parseFloat(process.env.RISK_FIXED_COST_BPS || '8'),
    minEffectiveSpreadBps: parseFloat(process.env.RISK_MIN_EFFECTIVE_SPREAD_BPS || '12'),
    evMinThreshold: parseFloat(process.env.EV_MIN_THRESHOLD || '0'),
    sharpeLikeThreshold: parseFloat(process.env.SHARPE_LIKE_THRESHOLD || '0.15'),
    maxTailLossPercent: parseFloat(process.env.MAX_TAIL_LOSS_PERCENT || '20'),
    defaultBridgeDelaySec: parseFloat(process.env.DEFAULT_BRIDGE_DELAY_SEC || '4'),
    keyStorePath: process.env.API_KEY_STORE_PATH || path.resolve(__dirname, '../config/api-keys.json'),
  };

  return runtimeConfig;
}

export function publicThresholdConfig() {
  const config = getRuntimeConfig();

  return {
    portfolioUsd: config.portfolioUsd,
    annualVolatility: config.annualVolatility,
    fixedCostBps: config.fixedCostBps,
    minEffectiveSpreadBps: config.minEffectiveSpreadBps,
    evMinThreshold: config.evMinThreshold,
    sharpeLikeThreshold: config.sharpeLikeThreshold,
    maxTailLossPercent: config.maxTailLossPercent,
    defaultBridgeDelaySec: config.defaultBridgeDelaySec,
  };
}
