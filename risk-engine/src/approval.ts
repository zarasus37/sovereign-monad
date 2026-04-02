import { Config } from './config';
import { ArbitrageSignal } from './core/rge';

export interface ApprovalMetrics {
  signal: ArbitrageSignal | null;
  notional: number;
  evMean: number;
  sharpeLike: number;
  maxDrawdownEstimate: number;
}

export function shouldApproveEvaluation(
  metrics: ApprovalMetrics,
  config: Pick<Config, 'evMinThreshold' | 'sharpeLikeThreshold' | 'maxTailLossPercent'>
): boolean {
  if (metrics.signal === null || metrics.notional <= 0) {
    return false;
  }

  const maxAllowedLossUsd = metrics.notional * (config.maxTailLossPercent / 100);

  return (
    metrics.evMean > 0 &&
    metrics.evMean >= config.evMinThreshold &&
    metrics.sharpeLike >= config.sharpeLikeThreshold &&
    Math.abs(metrics.maxDrawdownEstimate) <= maxAllowedLossUsd
  );
}