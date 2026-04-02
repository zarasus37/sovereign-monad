import { OpportunityCandidate } from '../models/events';

export interface SpreadSnapshot {
  direction: OpportunityCandidate['direction'];
  rawSpreadBps: number;
  bridgeDelaySec: number;
}

export interface ArbitrageSignal {
  direction: OpportunityCandidate['direction'];
  rawSpreadBps: number;
  effectiveSpreadBps: number;
  kellySizeUsd: number;
  timestamp: number;
  confidence: number;
}

export class RiskGnosisEngine {
  private readonly BPS_TO_FRAC = 0.0001;
  private readonly SECS_PER_YEAR = 31_557_600;

  constructor(
    private readonly portfolio: number = 10_000,
    private readonly annualVol: number = 0.30,
    private readonly fixedCostBps: number = 15,
    private readonly minEffectiveSpreadBps: number = 20
  ) {}

  effectiveSpread(rawSpreadBps: number, bridgeDelaySec: number): number {
    const rawSpread = rawSpreadBps * this.BPS_TO_FRAC;
    const t = Math.max(bridgeDelaySec, 0) / this.SECS_PER_YEAR;
    const decay = this.annualVol * Math.sqrt(t);
    const compounding = 0.5 * decay * decay;
    const effectiveFrac = rawSpread - decay - compounding - (this.fixedCostBps * this.BPS_TO_FRAC);
    return effectiveFrac / this.BPS_TO_FRAC;
  }

  kellyCriterion(winProb: number, netOdds: number): number {
    const q = 1 - winProb;
    return (winProb * netOdds - q) / netOdds;
  }

  positionSize(rawSpreadBps: number, bridgeDelaySec: number): number {
    const effectiveBps = this.effectiveSpread(rawSpreadBps, bridgeDelaySec);

    if (effectiveBps < this.minEffectiveSpreadBps) {
      return 0;
    }

    const edge = effectiveBps * this.BPS_TO_FRAC;
    // Use at least 1 second to avoid degenerate Kelly sizing when delay ≈ 0
    const t = Math.max(bridgeDelaySec, 1) / this.SECS_PER_YEAR;
    const volOverWindow = this.annualVol * Math.sqrt(t);
    const variance = volOverWindow * volOverWindow;
    let kellyFrac = edge / variance;

    const FRACTIONAL_KELLY = 0.25;
    kellyFrac *= FRACTIONAL_KELLY;

    if (kellyFrac <= 0) {
      return 0;
    }

    const rawSize = this.portfolio * kellyFrac;
    return Math.min(rawSize, this.portfolio * 0.10);
  }

  generateSignal(snapshot: SpreadSnapshot): ArbitrageSignal | null {
    const effectiveBps = this.effectiveSpread(snapshot.rawSpreadBps, snapshot.bridgeDelaySec);
    const size = this.positionSize(snapshot.rawSpreadBps, snapshot.bridgeDelaySec);

    if (size === 0) {
      console.log(
        `[RGE] REJECT raw=${snapshot.rawSpreadBps}bps delay=${snapshot.bridgeDelaySec}s eff=${effectiveBps.toFixed(2)}bps size=$0`
      );
      return null;
    }

    console.log(
      `[RGE] ACCEPT raw=${snapshot.rawSpreadBps}bps delay=${snapshot.bridgeDelaySec}s eff=${effectiveBps.toFixed(2)}bps size=$${size.toFixed(2)}`
    );

    return {
      direction: snapshot.direction,
      rawSpreadBps: snapshot.rawSpreadBps,
      effectiveSpreadBps: effectiveBps,
      kellySizeUsd: size,
      timestamp: Date.now(),
      confidence: 0.65,
    };
  }
}