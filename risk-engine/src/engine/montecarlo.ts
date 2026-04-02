/**
 * Monte Carlo Engine (Phase 5 - Core)
 * 
 * Simulates price paths and bridge latency to compute EV, variance,
 * Sharpe-like ratio, and tail risk for cross-chain arbitrage.
 * 
 * Per spec:
 * - Correlated price paths between the two active execution chains
 * - Bridge latency modeled as log-normal distribution
 * - Small probability of bridge failure
 * - Gas and bridge fees as costs
 */

import { OpportunityCandidate, OpportunityEvaluation } from '../models/events';

// Default parameters (would come from config/feed in production)
const DEFAULT_BRIDGE_LATENCY_MS = { median: 15000, p95: 30000 };
const DEFAULT_BRIDGE_FAILURE_RATE = 0.001; // 0.1% per trade
const DEFAULT_GAS_COST_USD = 5;
const DEFAULT_BRIDGE_FEE_BPS = 3;
const DEFAULT_CORRELATION = 0.7;

/**
 * Monte Carlo parameters
 */
export interface MonteCarloParams {
  volM: number;
  volE: number;
  correlation: number;
  spreadBps: number;
  sizeUsd: number;
  timeWindowMs: number;
  mode: 'inventory_based' | 'bridge_based';
  bridgeLatencyMs?: { median: number; p95: number };
  gasCostUsd?: number;
  bridgeFeeBps?: number;
}

/**
 * Monte Carlo result
 */
export interface MonteCarloResult {
  evMean: number;
  evStd: number;
  sharpeLike: number;
  pLossGtX: number;
  maxDrawdownEstimate: number;
  distribution: number[];
}

/**
 * Box-Muller transform for generating standard normal random numbers
 */
function randomNormal(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Generate correlated price paths using Cholesky decomposition
 * 
 * @param n Number of paths
 * @param volM Chain A volatility (annualized)
 * @param volE Chain B volatility (annualized)
 * @param correlation Correlation between chains
 * @param dt Time step in years
 */
function generateCorrelatedPaths(
  n: number,
  volM: number,
  volE: number,
  correlation: number,
  dt: number
): { pricesM: number[]; pricesE: number[] }[] {
  const paths: { pricesM: number[]; pricesE: number[] }[] = [];
  
  // Cholesky decomposition for correlated normals
  // L = | 1     0   |
  //     | ρ   sqrt(1-ρ²) |
  // Diagonal = 1, off-diagonal = correlation
  const chol21 = correlation;
  const chol22 = Math.sqrt(1 - correlation * correlation);

  for (let i = 0; i < n; i++) {
    const pricesM: number[] = [1];
    const pricesE: number[] = [1];
    
    const volMStep = volM * Math.sqrt(dt);
    const volEStep = volE * Math.sqrt(dt);

    // Generate path with up to 100 steps (needed for bridge-based latency indexing)
    for (let t = 1; t <= 100; t++) {
      const z1 = randomNormal();
      const z2 = chol21 * z1 + chol22 * randomNormal();
      
      // Geometric Brownian Motion: S(t+dt) = S(t) * exp((μ - σ²/2)*dt + σ*sqrt(dt)*Z)
      // Using μ = 0 (drift-free)
      pricesM.push(pricesM[t-1] * Math.exp(-0.5 * volMStep * volMStep + volMStep * z1));
      pricesE.push(pricesE[t-1] * Math.exp(-0.5 * volEStep * volEStep + volEStep * z2));
    }
    paths.push({ pricesM, pricesE });
  }
  
  return paths;
}

/**
 * Sample bridge latency from log-normal distribution
 * 
 * @param median Expected latency (50th percentile)
 * @param p95 95th percentile latency
 */
function sampleBridgeLatency(median: number, p95: number): number {
  // Convert median and p95 to log-normal parameters
  const sigma = (Math.log(p95) - Math.log(median)) / 1.6449;
  const mu = Math.log(median) - 0.5 * sigma * sigma;
  return Math.exp(mu + sigma * randomNormal());
}

/**
 * Run Monte Carlo simulation for an opportunity
 * 
 * Per spec:
 * - Simulate N scenarios
 * - For each: compute PnL = spread profit - costs - price move during bridge
 * - Include bridge failure scenario
 * - Return EV, std, Sharpe-like, tail risk metrics
 */
export function runMonteCarlo(
  opportunity: OpportunityCandidate,
  params: Partial<MonteCarloParams> = {},
  simulations: number = 10000
): MonteCarloResult {
  const config = {
    volM: params.volM ?? opportunity.volM5m,
    volE: params.volE ?? opportunity.volE5m,
    correlation: params.correlation ?? DEFAULT_CORRELATION,
    spreadBps: opportunity.spreadBps / 10000, // Convert bps to decimal
    sizeUsd: parseFloat(opportunity.sizeSuggestion),
    timeWindowMs: opportunity.timeWindowEstimateMs,
    mode: opportunity.modeOptions[0], // Evaluate first mode
    bridgeLatencyMs: params.bridgeLatencyMs ?? DEFAULT_BRIDGE_LATENCY_MS,
    gasCostUsd: params.gasCostUsd ?? DEFAULT_GAS_COST_USD,
    bridgeFeeBps: params.bridgeFeeBps ?? DEFAULT_BRIDGE_FEE_BPS,
  };

  const results: number[] = [];

  // Time step: 1 second granularity
  const dt = 1 / (365 * 24 * 60 * 60);

  // Generate all price paths once (more efficient)
  const allPaths = generateCorrelatedPaths(
    simulations,
    config.volM,
    config.volE,
    config.correlation,
    dt
  );

  for (let i = 0; i < simulations; i++) {
    let pnl = 0;
    
    const { pricesM, pricesE } = allPaths[i];
    
    // Initial spread profit (the edge we're capturing)
    const initialEdge = config.spreadBps * config.sizeUsd;
    
    if (config.mode === 'inventory_based') {
      // Inventory-based: close almost immediately
      // PnL = spread - gas
      pnl = initialEdge - config.gasCostUsd;
      
      // Add small price movement risk over time window
      // Partial exposure since we're closing fast
      const priceMoveM = (pricesM[pricesM.length - 1] - 1) * config.sizeUsd;
      const priceMoveE = (pricesE[pricesE.length - 1] - 1) * config.sizeUsd;
      pnl -= Math.abs(priceMoveM) * 0.1;
      pnl -= Math.abs(priceMoveE) * 0.1;
      
    } else {
      // Bridge-based: exposed to bridge latency
      const latency = sampleBridgeLatency(
        config.bridgeLatencyMs.median,
        config.bridgeLatencyMs.p95
      );
      
      // During bridge time, price can move against us
      const bridgeSteps = Math.min(pricesM.length - 1, Math.floor(latency / 1000));
      const priceMoveM = (pricesM[bridgeSteps] - 1) * config.sizeUsd;
      const priceMoveE = (pricesE[bridgeSteps] - 1) * config.sizeUsd;
      
      // PnL = initial edge - bridge fee - gas - price move during bridge
      pnl = initialEdge 
        - (config.bridgeFeeBps / 10000) * config.sizeUsd 
        - config.gasCostUsd * 2
        - priceMoveM
        - priceMoveE;
      
      // Small chance of bridge failure (catastrophic loss)
      if (Math.random() < DEFAULT_BRIDGE_FAILURE_RATE) {
        pnl = -config.sizeUsd * 0.5;
      }
    }
    
    results.push(pnl);
  }

  // Calculate statistics
  const evMean = results.reduce((a, b) => a + b, 0) / simulations;
  const variance = results.reduce((a, b) => a + Math.pow(b - evMean, 2), 0) / simulations;
  const evStd = Math.sqrt(variance);
  
  // Sharpe-like ratio (EV / StdDev)
  const sharpeLike = evStd > 0 ? evMean / evStd : 0;
  
  // Probability of loss > 10% of notional
  const lossThreshold = -config.sizeUsd * 0.1;
  const pLossGtX = results.filter(r => r < lossThreshold).length / simulations;
  
  // Max drawdown estimate (worst 1st percentile — the bad tail)
  const sorted = [...results].sort((a, b) => a - b);
  const maxDrawdownEstimate = sorted[Math.floor(sorted.length * 0.01)];

  return {
    evMean,
    evStd,
    sharpeLike,
    pLossGtX,
    maxDrawdownEstimate,
    distribution: results,
  };
}

/**
 * Evaluate if opportunity meets risk criteria
 * 
 * Per spec:
 * - EV_mean > EV_min_threshold
 * - Sharpe_like > sharpe_threshold
 * - tail_loss < max_tail_loss_percent
 */
export function evaluateOpportunity(
  opportunity: OpportunityCandidate,
  config: { evMinThreshold: number; sharpeLikeThreshold: number; maxTailLossPercent: number }
): { approved: boolean; size: string } {
  const result = runMonteCarlo(opportunity);
  
  const maxAllowedLoss = config.maxTailLossPercent / 100 * parseFloat(opportunity.sizeSuggestion);
  
  const approved = 
    result.evMean > config.evMinThreshold &&
    result.sharpeLike > config.sharpeLikeThreshold &&
    Math.abs(result.maxDrawdownEstimate) < maxAllowedLoss;

  // Scale size based on confidence for borderline cases
  let size = opportunity.sizeSuggestion;
  if (!approved && result.sharpeLike > 0.1) {
    size = (parseFloat(size) * 0.5).toFixed(2);
  }

  return { approved, size };
}

/**
 * Create OpportunityEvaluation from Monte Carlo result
 */
export function createEvaluation(
  opportunity: OpportunityCandidate,
  mode: 'inventory_based' | 'bridge_based',
  mcResult: MonteCarloResult,
  decision: { approved: boolean; size: string }
): OpportunityEvaluation {
  return {
    meta: {
      eventId: opportunity.meta.eventId,
      eventType: 'OpportunityEvaluation',
      version: 1,
      timestampMs: Date.now(),
      source: 'risk-engine',
    },
    opportunityId: opportunity.id,
    mode,
    evMean: mcResult.evMean,
    evStd: mcResult.evStd,
    sharpeLike: mcResult.sharpeLike,
    pLossGtX: mcResult.pLossGtX,
    maxDrawdownEstimate: mcResult.maxDrawdownEstimate,
    approved: decision.approved,
    size: decision.size,
    timeWindowMs: opportunity.timeWindowEstimateMs,
  };
}
