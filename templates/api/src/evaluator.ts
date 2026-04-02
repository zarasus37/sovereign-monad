import { getRuntimeConfig } from './config';

export type EvaluationMode = 'inventory_based' | 'bridge_based';
export type EvaluationDirection = 'buy_M_sell_E' | 'buy_E_sell_M';

export interface EvaluateRequestBody {
  direction: EvaluationDirection;
  spreadBps: number;
  bridgeDelaySec?: number;
  sizeSuggestionUsd?: number;
  clientAumUsd?: number;
  mode?: EvaluationMode;
}

export interface EvaluateResult {
  mode: EvaluationMode;
  approved: boolean;
  effectiveSpreadBps: number;
  kellySizeUsd: number;
  cappedSizeUsd: number;
  ev: number;
  evStd: number;
  sharpeLike: number;
  p01Pnl: number;
  // Legacy alias retained for compatibility with earlier clients.
  maxDrawdownEstimate: number;
}

class RiskGnosisEngine {
  private readonly bpsToFrac = 0.0001;
  private readonly secsPerYear = 31_557_600;

  constructor(
    private readonly portfolioUsd: number,
    private readonly annualVol: number,
    private readonly fixedCostBps: number,
    private readonly minEffectiveSpreadBps: number
  ) {}

  effectiveSpread(rawSpreadBps: number, bridgeDelaySec: number): number {
    const rawSpread = rawSpreadBps * this.bpsToFrac;
    const t = Math.max(bridgeDelaySec, 0) / this.secsPerYear;
    const decay = this.annualVol * Math.sqrt(t);
    const compounding = 0.5 * decay * decay;
    const effectiveFrac = rawSpread - decay - compounding - this.fixedCostBps * this.bpsToFrac;
    return effectiveFrac / this.bpsToFrac;
  }

  positionSize(rawSpreadBps: number, bridgeDelaySec: number): number {
    const effectiveBps = this.effectiveSpread(rawSpreadBps, bridgeDelaySec);

    if (effectiveBps < this.minEffectiveSpreadBps) {
      return 0;
    }

    const edge = effectiveBps * this.bpsToFrac;
    const t = Math.max(bridgeDelaySec, 1) / this.secsPerYear;
    const variance = Math.pow(this.annualVol * Math.sqrt(t), 2);
    const kellyFrac = Math.max((edge / variance) * 0.25, 0);
    const rawSize = this.portfolioUsd * kellyFrac;

    return Math.min(rawSize, this.portfolioUsd * 0.1);
  }
}

export function evaluateSnapshot(payload: EvaluateRequestBody): EvaluateResult {
  const config = getRuntimeConfig();
  const mode = payload.mode || 'bridge_based';
  const bridgeDelaySec =
    mode === 'inventory_based' ? 0 : payload.bridgeDelaySec ?? config.defaultBridgeDelaySec;
  const gasCostUsd = mode === 'bridge_based' ? 13 : 6.5;

  const engine = new RiskGnosisEngine(
    config.portfolioUsd,
    config.annualVolatility,
    config.fixedCostBps,
    config.minEffectiveSpreadBps
  );

  const kellySizeUsd = engine.positionSize(payload.spreadBps, bridgeDelaySec);
  const cappedSizeUsd = Math.min(
    kellySizeUsd,
    payload.sizeSuggestionUsd ?? config.portfolioUsd * 0.1
  );
  const effectiveSpreadBps = engine.effectiveSpread(payload.spreadBps, bridgeDelaySec);
  const edgeFrac = Math.max(effectiveSpreadBps, 0) * 0.0001;
  const timeScale = Math.sqrt(Math.max(bridgeDelaySec, 1) / 31_557_600);
  const ev = cappedSizeUsd * edgeFrac * 0.65 - gasCostUsd;
  const evStd = cappedSizeUsd > 0 ? Math.max(cappedSizeUsd * 0.30 * timeScale, 0.01) : 0;
  const sharpeLike = evStd > 0 ? ev / evStd : 0;
  const p01Pnl = cappedSizeUsd > 0 ? -(cappedSizeUsd * 0.30 * timeScale * 2) : 0;
  const maxAllowedLossUsd = cappedSizeUsd * (config.maxTailLossPercent / 100);
  const approved =
    cappedSizeUsd > 0 &&
    ev > 0 &&
    ev >= config.evMinThreshold &&
    sharpeLike >= config.sharpeLikeThreshold &&
    Math.abs(p01Pnl) <= maxAllowedLossUsd;

  return {
    mode,
    approved,
    effectiveSpreadBps,
    kellySizeUsd,
    cappedSizeUsd,
    ev,
    evStd,
    sharpeLike,
    p01Pnl,
    maxDrawdownEstimate: p01Pnl,
  };
}
