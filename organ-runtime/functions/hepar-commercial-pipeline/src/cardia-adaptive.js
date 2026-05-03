"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCardiaAdaptiveSnapshot = buildCardiaAdaptiveSnapshot;
function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}
const DEFAULT_COEFFICIENTS = {
    returnWeight: 1.2,
    riskPenaltyWeight: 0.18,
    drawdownPenaltyWeight: 0.06,
    elevatedStressPenalty: 2.5,
    crashStressPenalty: 11,
    allocateThreshold: 2,
    reduceThreshold: -4,
    hardBlockRiskScore: 70,
};
function riskAdjustedScore(state, candidate, coefficients) {
    const returnComponent = candidate.expectedReturnPct * clamp01(candidate.confidence) * coefficients.returnWeight;
    const riskPenalty = candidate.heparRiskScore * coefficients.riskPenaltyWeight;
    const drawdownPenalty = state.portfolioDrawdownPct * coefficients.drawdownPenaltyWeight;
    const stressPenalty = state.volatilityRegime === 'crash'
        ? coefficients.crashStressPenalty
        : state.volatilityRegime === 'elevated'
            ? coefficients.elevatedStressPenalty
            : 0;
    return returnComponent - riskPenalty - drawdownPenalty - stressPenalty;
}
function deployableBudgetUsd(state) {
    if (state.liquidityStress || state.volatilityRegime === 'crash')
        return 0;
    const reserveSurplus = Math.max(0, state.reserveRatioPercent - state.minReserveRatioPercent);
    const baseBudget = reserveSurplus * 12000;
    return state.volatilityRegime === 'elevated' ? baseBudget * 0.5 : baseBudget;
}
function decisionForCandidate(state, candidate, coefficients) {
    const score = riskAdjustedScore(state, candidate, coefficients);
    const budget = deployableBudgetUsd(state);
    if (candidate.heparRiskScore >= coefficients.hardBlockRiskScore) {
        return {
            candidateId: candidate.id,
            protocolId: candidate.protocolId,
            action: 'block',
            allocationUsd: 0,
            score: Math.round(score * 1000) / 1000,
            reason: 'Hepar risk score exceeds hard threshold',
        };
    }
    if (score >= coefficients.allocateThreshold && budget > 0) {
        const allocation = Math.min(candidate.requiredCapitalUsd, budget * clamp01(candidate.confidence));
        return {
            candidateId: candidate.id,
            protocolId: candidate.protocolId,
            action: 'allocate',
            allocationUsd: Math.round(allocation),
            score: Math.round(score * 1000) / 1000,
            reason: 'Positive risk-adjusted profile under current reserve and regime state',
        };
    }
    if (candidate.currentAllocationUsd > 0 && score <= coefficients.reduceThreshold) {
        return {
            candidateId: candidate.id,
            protocolId: candidate.protocolId,
            action: 'reduce',
            allocationUsd: -Math.round(candidate.currentAllocationUsd * 0.5),
            score: Math.round(score * 1000) / 1000,
            reason: 'Negative risk-adjusted profile; reduce exposure by half',
        };
    }
    return {
        candidateId: candidate.id,
        protocolId: candidate.protocolId,
        action: 'hold',
        allocationUsd: 0,
        score: Math.round(score * 1000) / 1000,
        reason: 'No allocation change warranted under current posture',
    };
}
function stressActions(state) {
    const actions = [];
    if (state.reserveRatioPercent < state.minReserveRatioPercent) {
        actions.push('raise reserve ratio before expanding risk');
    }
    if (state.volatilityRegime === 'crash') {
        actions.push('activate circuit-breaker posture and pause new allocations');
    }
    if (state.liquidityStress) {
        actions.push('suspend new deployments until liquidity normalizes');
    }
    if (actions.length === 0) {
        actions.push('maintain bounded deployment cadence');
    }
    return actions;
}
function buildCardiaAdaptiveSnapshot(state, candidates, coefficients) {
    const effectiveCoefficients = {
        ...DEFAULT_COEFFICIENTS,
        ...(coefficients || {}),
    };
    const decisions = candidates.map((candidate) => decisionForCandidate(state, candidate, effectiveCoefficients));
    const netAllocationUsd = decisions.reduce((sum, decision) => sum + decision.allocationUsd, 0);
    const blockedCount = decisions.filter((decision) => decision.action === 'block').length;
    return {
        implemented: true,
        candidateCount: candidates.length,
        netAllocationUsd,
        blockedCount,
        stressActions: stressActions(state),
        decisions,
        coefficientsUsed: effectiveCoefficients,
    };
}
