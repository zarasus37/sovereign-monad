// risk-engine/src/eval/metrics.ts - Live Tracking

export interface SignalEval {
  approved: boolean;
  realizedPnl: number;
  predictedEdgeBps: number;
  kellySize: number;
  timestamp: number;
}

export class RGEMetrics {
  private evals: SignalEval[] = [];

  addEvaluation(entry: SignalEval): void {
    this.evals.push(entry);
  }

  getEvaluations(): SignalEval[] {
    return [...this.evals];
  }

  clear(): void {
    this.evals = [];
  }

  // Precision: % profitable approvals
  decisionAccuracy(): number {
    const approved = this.evals.filter((e) => e.approved);
    if (approved.length === 0) {
      return 0;
    }

    return approved.filter((e) => e.realizedPnl > 0).length / approved.length;
  }

  // Kelly correlation: size vs PnL (Pearson)
  sizingCalibration(): number {
    const approved = this.evals.filter((e) => e.approved && e.realizedPnl !== 0);
    if (approved.length < 2) {
      return 0;
    }

    const sizePnl = approved.map((e): [number, number] => [e.kellySize, e.realizedPnl]);
    return this.pearson(sizePnl);
  }

  // Risk: max drawdown < 10% of reference portfolio
  riskCompliance(referencePortfolioUsd: number = 10_000): boolean {
    const pnl = this.evals.map((e) => e.realizedPnl);
    const drawdown = this.maxDrawdown(pnl);
    return drawdown < 0.10 * referencePortfolioUsd;
  }

  private pearson(pairs: [number, number][]): number {
    const n = pairs.length;
    if (n < 2) {
      return 0;
    }

    const xs = pairs.map((p) => p[0]);
    const ys = pairs.map((p) => p[1]);

    const meanX = xs.reduce((sum, value) => sum + value, 0) / n;
    const meanY = ys.reduce((sum, value) => sum + value, 0) / n;

    let numerator = 0;
    let sumSqX = 0;
    let sumSqY = 0;

    for (let i = 0; i < n; i++) {
      const dx = xs[i] - meanX;
      const dy = ys[i] - meanY;
      numerator += dx * dy;
      sumSqX += dx * dx;
      sumSqY += dy * dy;
    }

    const denominator = Math.sqrt(sumSqX * sumSqY);
    if (denominator === 0) {
      return 0;
    }

    return numerator / denominator;
  }

  private maxDrawdown(pnlSeries: number[]): number {
    if (pnlSeries.length === 0) {
      return 0;
    }

    let runningPnl = 0;
    let peakPnl = 0;
    let maxDd = 0;

    for (const pnl of pnlSeries) {
      runningPnl += pnl;
      if (runningPnl > peakPnl) {
        peakPnl = runningPnl;
      }

      const drawdown = peakPnl - runningPnl;
      if (drawdown > maxDd) {
        maxDd = drawdown;
      }
    }

    return maxDd;
  }
}
