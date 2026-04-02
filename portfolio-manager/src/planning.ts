import { ExecutionPlan, OpportunityEvaluation, PortfolioState } from './models/events';

export interface ConstraintDecision {
  approved: boolean;
  size: string;
  reason?: string;
}

export interface PlanningConfig {
  maxBridgeExposurePercent: number;
  maxSingleTradePercent: number;
  supportedExecutionModes: Array<'inventory_based' | 'bridge_based'>;
}

export function applyConstraints(
  evaluation: OpportunityEvaluation,
  portfolio: PortfolioState,
  config: PlanningConfig
): ConstraintDecision {
  if (!evaluation.approved) {
    return { approved: false, size: '0', reason: 'risk_engine_rejected' };
  }

  if (!config.supportedExecutionModes.includes(evaluation.mode)) {
    return { approved: false, size: '0', reason: `unsupported_mode:${evaluation.mode}` };
  }

  const sizeUsd = parseFloat(evaluation.size);
  const sizePercent = (sizeUsd / portfolio.totalValueUsd) * 100;

  if (sizePercent > config.maxSingleTradePercent) {
    const reducedSize = portfolio.totalValueUsd * config.maxSingleTradePercent / 100;
    return { approved: true, size: reducedSize.toFixed(2), reason: 'size_capped' };
  }

  if (evaluation.mode === 'bridge_based') {
    const bridgeExp = portfolio.bridgeExposure.find((b) => b.bridge === 'monad-native');
    if (bridgeExp && bridgeExp.percent + sizePercent > config.maxBridgeExposurePercent) {
      return { approved: false, size: '0', reason: 'bridge_exposure_limit' };
    }
  }

  return { approved: true, size: evaluation.size };
}

export function buildExecutionPlan(
  evaluation: OpportunityEvaluation,
  decision: ConstraintDecision,
  nowMs: number = Date.now()
): ExecutionPlan {
  const evaluationSize = parseFloat(evaluation.size);
  const decisionSize = parseFloat(decision.size);
  const expectedEv = evaluationSize > 0
    ? evaluation.evMean * (decisionSize / evaluationSize)
    : 0;
  const ttlMs = Math.max(5000, Math.min(evaluation.timeWindowMs, 120000));

  return {
    meta: {
      eventId: evaluation.meta.eventId,
      eventType: 'ExecutionPlan',
      version: 1,
      timestampMs: nowMs,
      source: 'portfolio-manager',
    },
    planId: `${evaluation.opportunityId}:${evaluation.mode}:${nowMs}`,
    opportunityId: evaluation.opportunityId,
    sourceSignalId: evaluation.sourceSignalId,
    asset: evaluation.asset,
    direction: evaluation.direction,
    size: decision.size,
    mode: evaluation.mode,
    entryVenue: evaluation.entryVenue,
    exitVenue: evaluation.exitVenue,
    entryPrice: evaluation.entryPrice,
    exitPrice: evaluation.exitPrice,
    spreadBps: evaluation.spreadBps,
    expectedEv,
    approved: decision.approved,
    timeWindowMs: evaluation.timeWindowMs,
    executionDeadlineMs: nowMs + ttlMs,
    timestampMs: nowMs,
  };
}
