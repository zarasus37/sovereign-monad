"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildPneumaMarketSnapshot = buildPneumaMarketSnapshot;
function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}
const DEFAULT_POLICY = {
    urgentLatencyPenaltyDivisor: 90,
    normalLatencyPenaltyDivisor: 180,
    minSettlementReliability: 0.72,
};
function counterpartyOk(quote, counterparties, policy) {
    const signal = counterparties.find((item) => item.name === quote.counterparty);
    if (!signal)
        return true;
    if (signal.solvencyRisk === 'high')
        return false;
    if (signal.settlementReliability < policy.minSettlementReliability)
        return false;
    if (signal.complianceBlocked)
        return false;
    return true;
}
function executionCostBps(order, quote, policy) {
    const latencyPenalty = order.urgency === 'urgent'
        ? quote.latencyMs / policy.urgentLatencyPenaltyDivisor
        : quote.latencyMs / policy.normalLatencyPenaltyDivisor;
    return quote.slippageBps + quote.feeBps + latencyPenalty;
}
function pickBestQuote(order, quotes, counterparties, policy) {
    const filtered = quotes
        .filter((quote) => quote.orderId === order.id)
        .filter((quote) => quote.slippageBps <= order.maxSlippageBps)
        .filter((quote) => counterpartyOk(quote, counterparties, policy));
    if (filtered.length === 0) {
        return {
            orderId: order.id,
            accepted: false,
            allocatedUsd: 0,
            expectedCostBps: 0,
            reason: 'No venue satisfied slippage, counterparty, or compliance constraints',
        };
    }
    const scored = filtered
        .map((quote) => ({
        quote,
        cost: executionCostBps(order, quote, policy),
    }))
        .sort((a, b) => a.cost - b.cost);
    const best = scored[0];
    const allocated = Math.min(order.notionalUsd, best.quote.availableUsd);
    return {
        orderId: order.id,
        accepted: allocated > 0,
        venue: best.quote.venue,
        allocatedUsd: Math.round(allocated),
        expectedCostBps: Math.round(best.cost * 1000) / 1000,
        reason: allocated < order.notionalUsd
            ? 'Best venue selected with partial fill due to available liquidity'
            : 'Best venue selected under cost and risk constraints',
    };
}
function buildFeedbackSignals(decisions) {
    const rejected = decisions.filter((decision) => !decision.accepted).length;
    const partial = decisions.filter((decision) => decision.accepted && decision.allocatedUsd > 0).filter((decision) => decision.reason.includes('partial')).length;
    const signals = [];
    if (rejected > 0) {
        signals.push(`${rejected} order(s) rejected by venue/counterparty constraints`);
    }
    if (partial > 0) {
        signals.push(`${partial} order(s) partially filled due to liquidity limits`);
    }
    if (signals.length === 0) {
        signals.push('execution conditions acceptable across evaluated venues');
    }
    return signals;
}
function buildPneumaMarketSnapshot(orders, quotes, counterparties, policy) {
    const effectivePolicy = {
        ...DEFAULT_POLICY,
        ...(policy || {}),
    };
    const decisions = orders.map((order) => pickBestQuote(order, quotes, counterparties, effectivePolicy));
    const acceptedCount = decisions.filter((decision) => decision.accepted).length;
    const averageCostBps = acceptedCount === 0
        ? 0
        : decisions
            .filter((decision) => decision.accepted)
            .reduce((sum, decision) => sum + decision.expectedCostBps, 0) / acceptedCount;
    const fillRatio = orders.length === 0
        ? 0
        : clamp01(acceptedCount / orders.length);
    return {
        implemented: true,
        orderCount: orders.length,
        acceptedCount,
        fillRatio: Math.round(fillRatio * 1000) / 1000,
        averageCostBps: Math.round(averageCostBps * 1000) / 1000,
        decisions,
        feedbackSignals: buildFeedbackSignals(decisions),
        policyUsed: effectivePolicy,
    };
}
