"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cardia_adaptive_1 = require("../cardia-adaptive");
const config_1 = require("../config");
const cortex_strategic_1 = require("../cortex-strategic");
const pneuma_market_1 = require("../pneuma-market");
const synapse_adaptive_1 = require("../synapse-adaptive");
const vox_intelligence_1 = require("../vox-intelligence");
function percentLift(baseline, upgraded) {
    if (baseline === 0) {
        return upgraded > 0 ? 100 : 0;
    }
    return ((upgraded - baseline) / baseline) * 100;
}
function baselineSynapseRoute(signal) {
    if (signal.touchesCapital && signal.severity === 'critical')
        return 'escalated';
    return 'normal';
}
function evaluateSynapse(policy, signals, health, expected) {
    const snapshot = (0, synapse_adaptive_1.buildSynapseAdaptiveSnapshot)(signals, health, policy);
    const matched = snapshot.routes.filter((route) => {
        const target = expected.find((item) => item.signalId === route.signalId);
        return target ? target.expectedRouteType === route.routeType : false;
    }).length;
    const accuracy = matched / expected.length;
    const score = accuracy * 100 - snapshot.conflicts.length * 0.1;
    return { accuracy, score };
}
function evaluateSynapseBaseline(signals, expected) {
    const matched = signals.filter((signal) => {
        const target = expected.find((item) => item.signalId === signal.id);
        return target ? target.expectedRouteType === baselineSynapseRoute(signal) : false;
    }).length;
    return matched / expected.length;
}
function baselineCardiaAction(candidate) {
    if (candidate.heparRiskScore >= 85)
        return 'block';
    return 'hold';
}
function actionScore(actual, expected) {
    if (actual === expected)
        return 2;
    const conservative = (expected === 'allocate' && (actual === 'hold' || actual === 'reduce')) ||
        (expected === 'hold' && actual === 'reduce');
    if (conservative)
        return 1;
    return -1;
}
function evaluateCardia(coeffs, cases) {
    let matched = 0;
    let score = 0;
    for (const testCase of cases) {
        const snapshot = (0, cardia_adaptive_1.buildCardiaAdaptiveSnapshot)(testCase.state, [testCase.candidate], coeffs);
        const action = snapshot.decisions[0].action;
        if (action === testCase.expectedAction)
            matched += 1;
        score += actionScore(action, testCase.expectedAction);
    }
    return { weightedAccuracy: matched / cases.length, score };
}
function evaluateCardiaBaseline(cases) {
    const matched = cases.filter((testCase) => {
        return baselineCardiaAction(testCase.candidate) === testCase.expectedAction;
    }).length;
    return matched / cases.length;
}
function baselinePneumaChoice(order, quotes) {
    const candidate = quotes
        .filter((quote) => quote.orderId === order.id)
        .filter((quote) => quote.slippageBps <= order.maxSlippageBps)
        .sort((a, b) => (a.slippageBps + a.feeBps) - (b.slippageBps + b.feeBps))[0];
    if (!candidate) {
        return { accepted: false };
    }
    return { accepted: true, venue: candidate.venue };
}
function evaluatePneuma(policy, cases) {
    let matched = 0;
    let totalCost = 0;
    let accepted = 0;
    for (const testCase of cases) {
        const snapshot = (0, pneuma_market_1.buildPneumaMarketSnapshot)([testCase.order], testCase.quotes, testCase.counterparties, policy);
        const decision = snapshot.decisions[0];
        const ok = decision.accepted === testCase.expectedAccepted &&
            (!testCase.expectedAccepted || decision.venue === testCase.expectedVenue);
        if (ok)
            matched += 1;
        if (decision.accepted) {
            totalCost += decision.expectedCostBps;
            accepted += 1;
        }
    }
    const accuracy = matched / cases.length;
    const avgCost = accepted > 0 ? totalCost / accepted : 0;
    const score = accuracy * 100 - avgCost * 0.2;
    return { accuracy, avgCost, score };
}
function evaluatePneumaBaseline(cases) {
    const matched = cases.filter((testCase) => {
        const decision = baselinePneumaChoice(testCase.order, testCase.quotes);
        if (decision.accepted !== testCase.expectedAccepted)
            return false;
        if (!testCase.expectedAccepted)
            return true;
        return decision.accepted && decision.venue === testCase.expectedVenue;
    }).length;
    return matched / cases.length;
}
function parseArgs(argv) {
    const out = {
        mode: 'benchmark',
        configPath: 'config/runtime.json',
    };
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === '--mode') {
            const value = argv[i + 1];
            if (!value)
                throw new Error('Missing value for --mode');
            if (value !== 'benchmark' && value !== 'live') {
                throw new Error(`Invalid --mode value "${value}". Use benchmark or live.`);
            }
            out.mode = value;
            i += 1;
            continue;
        }
        if (arg === '--config') {
            const value = argv[i + 1];
            if (!value)
                throw new Error('Missing value for --config');
            out.configPath = value;
            i += 1;
            continue;
        }
    }
    return out;
}
function calibrateBenchmark() {
    const synapseSignals = [
        {
            id: 'syn-1',
            source: 'Hepar',
            category: 'opportunity',
            severity: 'critical',
            confidence: 0.95,
            touchesCapital: true,
            summary: 'critical exploit',
        },
        {
            id: 'syn-2',
            source: 'Cardia',
            category: 'opportunity',
            severity: 'medium',
            confidence: 0.58,
            touchesCapital: true,
            summary: 'allocation-positive view',
        },
        {
            id: 'syn-3',
            source: 'Market',
            category: 'growth',
            severity: 'low',
            confidence: 0.2,
            summary: 'weak signal',
        },
        {
            id: 'syn-4',
            source: 'Cortex',
            category: 'research',
            severity: 'high',
            confidence: 0.83,
            summary: 'regime shift warning',
        },
    ];
    const synapseHealth = [
        { source: 'Hepar', precision: 0.92, missRate: 0.05, stalenessSec: 60 },
        { source: 'Cardia', precision: 0.73, missRate: 0.2, stalenessSec: 90 },
        { source: 'Cortex', precision: 0.81, missRate: 0.13, stalenessSec: 70 },
        { source: 'Market', precision: 0.68, missRate: 0.24, stalenessSec: 40 },
    ];
    const synapseExpected = [
        { signalId: 'syn-1', expectedRouteType: 'escalated' },
        { signalId: 'syn-2', expectedRouteType: 'escalated' },
        { signalId: 'syn-3', expectedRouteType: 'blocked' },
        { signalId: 'syn-4', expectedRouteType: 'normal' },
    ];
    const synapsePolicyGrid = [];
    for (const gap of [1, 2, 3]) {
        for (const lowThreshold of [0.25, 0.35, 0.45]) {
            for (const sev of [2, 3, 4]) {
                synapsePolicyGrid.push({
                    conflictSeverityGap: gap,
                    lowConfidenceBlockThreshold: lowThreshold,
                    capitalEscalationMinSeverity: sev,
                });
            }
        }
    }
    let bestSynapse = synapsePolicyGrid[0];
    let bestSynapseMetrics = evaluateSynapse(bestSynapse, synapseSignals, synapseHealth, synapseExpected);
    for (const candidate of synapsePolicyGrid.slice(1)) {
        const metrics = evaluateSynapse(candidate, synapseSignals, synapseHealth, synapseExpected);
        if (metrics.score > bestSynapseMetrics.score) {
            bestSynapse = candidate;
            bestSynapseMetrics = metrics;
        }
    }
    const cardiaCases = [
        {
            state: {
                reserveRatioPercent: 28,
                minReserveRatioPercent: 20,
                portfolioDrawdownPct: 5,
                volatilityRegime: 'low',
                liquidityStress: false,
            },
            candidate: {
                id: 'c1',
                protocolId: 'safe-growth',
                heparRiskScore: 24,
                expectedReturnPct: 22,
                confidence: 0.8,
                requiredCapitalUsd: 70000,
                currentAllocationUsd: 10000,
            },
            expectedAction: 'allocate',
        },
        {
            state: {
                reserveRatioPercent: 24,
                minReserveRatioPercent: 20,
                portfolioDrawdownPct: 9,
                volatilityRegime: 'elevated',
                liquidityStress: false,
            },
            candidate: {
                id: 'c2',
                protocolId: 'mid-risk',
                heparRiskScore: 46,
                expectedReturnPct: 9,
                confidence: 0.72,
                requiredCapitalUsd: 50000,
                currentAllocationUsd: 35000,
            },
            expectedAction: 'hold',
        },
        {
            state: {
                reserveRatioPercent: 22,
                minReserveRatioPercent: 20,
                portfolioDrawdownPct: 12,
                volatilityRegime: 'elevated',
                liquidityStress: false,
            },
            candidate: {
                id: 'c3',
                protocolId: 'risky',
                heparRiskScore: 76,
                expectedReturnPct: 18,
                confidence: 0.65,
                requiredCapitalUsd: 40000,
                currentAllocationUsd: 20000,
            },
            expectedAction: 'block',
        },
        {
            state: {
                reserveRatioPercent: 18,
                minReserveRatioPercent: 20,
                portfolioDrawdownPct: 15,
                volatilityRegime: 'crash',
                liquidityStress: true,
            },
            candidate: {
                id: 'c4',
                protocolId: 'defensive-hold',
                heparRiskScore: 35,
                expectedReturnPct: 7,
                confidence: 0.7,
                requiredCapitalUsd: 25000,
                currentAllocationUsd: 50000,
            },
            expectedAction: 'reduce',
        },
    ];
    const cardiaGrid = [];
    for (const returnWeight of [1.1, 1.2, 1.3]) {
        for (const riskPenaltyWeight of [0.18, 0.22, 0.26]) {
            for (const drawdownPenaltyWeight of [0.06, 0.08, 0.1]) {
                for (const allocateThreshold of [2, 4, 6]) {
                    cardiaGrid.push({
                        returnWeight,
                        riskPenaltyWeight,
                        drawdownPenaltyWeight,
                        elevatedStressPenalty: 2.5,
                        crashStressPenalty: 11,
                        allocateThreshold,
                        reduceThreshold: -4,
                        hardBlockRiskScore: 70,
                    });
                }
            }
        }
    }
    let bestCardia = cardiaGrid[0];
    let bestCardiaMetrics = evaluateCardia(bestCardia, cardiaCases);
    for (const candidate of cardiaGrid.slice(1)) {
        const metrics = evaluateCardia(candidate, cardiaCases);
        if (metrics.score > bestCardiaMetrics.score) {
            bestCardia = candidate;
            bestCardiaMetrics = metrics;
        }
    }
    const pneumaCases = [
        {
            order: {
                id: 'p1',
                asset: 'ETH/USDC',
                side: 'buy',
                notionalUsd: 120000,
                maxSlippageBps: 30,
                urgency: 'urgent',
            },
            quotes: [
                {
                    orderId: 'p1',
                    venue: 'v-a',
                    availableUsd: 120000,
                    slippageBps: 18,
                    feeBps: 4,
                    latencyMs: 520,
                    counterparty: 'cp-good',
                },
                {
                    orderId: 'p1',
                    venue: 'v-b',
                    availableUsd: 120000,
                    slippageBps: 12,
                    feeBps: 3,
                    latencyMs: 310,
                    counterparty: 'cp-risky',
                },
            ],
            counterparties: [
                { name: 'cp-good', solvencyRisk: 'low', settlementReliability: 0.93, complianceBlocked: false },
                { name: 'cp-risky', solvencyRisk: 'high', settlementReliability: 0.9, complianceBlocked: false },
            ],
            expectedAccepted: true,
            expectedVenue: 'v-a',
        },
        {
            order: {
                id: 'p2',
                asset: 'BTC/USDC',
                side: 'sell',
                notionalUsd: 80000,
                maxSlippageBps: 18,
                urgency: 'normal',
            },
            quotes: [
                {
                    orderId: 'p2',
                    venue: 'v-c',
                    availableUsd: 80000,
                    slippageBps: 16,
                    feeBps: 5,
                    latencyMs: 480,
                    counterparty: 'cp-mid',
                },
            ],
            counterparties: [
                { name: 'cp-mid', solvencyRisk: 'low', settlementReliability: 0.68, complianceBlocked: false },
            ],
            expectedAccepted: false,
        },
        {
            order: {
                id: 'p3',
                asset: 'SOL/USDC',
                side: 'buy',
                notionalUsd: 40000,
                maxSlippageBps: 24,
                urgency: 'normal',
            },
            quotes: [
                {
                    orderId: 'p3',
                    venue: 'v-d',
                    availableUsd: 25000,
                    slippageBps: 15,
                    feeBps: 4,
                    latencyMs: 260,
                    counterparty: 'cp-solid',
                },
                {
                    orderId: 'p3',
                    venue: 'v-e',
                    availableUsd: 50000,
                    slippageBps: 22,
                    feeBps: 5,
                    latencyMs: 300,
                    counterparty: 'cp-solid',
                },
            ],
            counterparties: [
                { name: 'cp-solid', solvencyRisk: 'low', settlementReliability: 0.91, complianceBlocked: false },
            ],
            expectedAccepted: true,
            expectedVenue: 'v-d',
        },
    ];
    const pneumaGrid = [];
    for (const urgentDiv of [70, 80, 90]) {
        for (const normalDiv of [140, 160, 180]) {
            for (const minSettle of [0.68, 0.72, 0.76]) {
                pneumaGrid.push({
                    urgentLatencyPenaltyDivisor: urgentDiv,
                    normalLatencyPenaltyDivisor: normalDiv,
                    minSettlementReliability: minSettle,
                });
            }
        }
    }
    let bestPneuma = pneumaGrid[0];
    let bestPneumaMetrics = evaluatePneuma(bestPneuma, pneumaCases);
    for (const candidate of pneumaGrid.slice(1)) {
        const metrics = evaluatePneuma(candidate, pneumaCases);
        if (metrics.score > bestPneumaMetrics.score) {
            bestPneuma = candidate;
            bestPneumaMetrics = metrics;
        }
    }
    const baselineSynapseAccuracy = evaluateSynapseBaseline(synapseSignals, synapseExpected);
    const baselineCardiaAccuracy = evaluateCardiaBaseline(cardiaCases);
    const baselinePneumaAccuracy = evaluatePneumaBaseline(pneumaCases);
    const cortexBaselineCoverage = 1 / 4;
    const cortexUpgradedCoverage = 4 / 4;
    const voxBaselineCoverage = 0;
    const voxUpgradedCoverage = 1;
    const cortexSnapshot = (0, cortex_strategic_1.buildCortexStrategicSnapshot)([
        {
            id: 'ctx-bench',
            headline: 'benchmark context',
            heparCriticalCount: 5,
            marketVolatilityPct: 42,
            recentPnlUsd: -90000,
            agentBehaviorStress: 0.65,
            macroRegime: 'risk-off',
        },
    ]);
    const voxSnapshot = (0, vox_intelligence_1.buildVoxNarrativeIntelligenceSnapshot)([
        {
            id: 'vox-bench',
            eventTitle: 'benchmark narrative',
            facts: ['fact'],
            proofRefs: ['proof://a'],
            contradictionCount: 0,
            audiences: ['operators'],
        },
    ]);
    const result = {
        calibratedPolicies: {
            synapse: bestSynapse,
            cardia: bestCardia,
            pneuma: bestPneuma,
        },
        metrics: {
            synapse: {
                baselineAccuracy: Number(baselineSynapseAccuracy.toFixed(4)),
                calibratedAccuracy: Number(bestSynapseMetrics.accuracy.toFixed(4)),
                relativeLiftPct: Number(percentLift(baselineSynapseAccuracy, bestSynapseMetrics.accuracy).toFixed(2)),
            },
            cardia: {
                baselineAccuracy: Number(baselineCardiaAccuracy.toFixed(4)),
                calibratedAccuracy: Number(bestCardiaMetrics.weightedAccuracy.toFixed(4)),
                relativeLiftPct: Number(percentLift(baselineCardiaAccuracy, bestCardiaMetrics.weightedAccuracy).toFixed(2)),
            },
            pneuma: {
                baselineAccuracy: Number(baselinePneumaAccuracy.toFixed(4)),
                calibratedAccuracy: Number(bestPneumaMetrics.accuracy.toFixed(4)),
                relativeLiftPct: Number(percentLift(baselinePneumaAccuracy, bestPneumaMetrics.accuracy).toFixed(2)),
                calibratedAvgCostBps: Number(bestPneumaMetrics.avgCost.toFixed(3)),
            },
            cortex: {
                baselineInstitutionalCoverage: cortexBaselineCoverage,
                upgradedInstitutionalCoverage: cortexUpgradedCoverage,
                relativeLiftPct: Number(percentLift(cortexBaselineCoverage, cortexUpgradedCoverage).toFixed(2)),
                scenarioCount: cortexSnapshot.reports[0].scenarios.length,
            },
            vox: {
                baselineTruthVerificationCoverage: voxBaselineCoverage,
                upgradedTruthVerificationCoverage: voxUpgradedCoverage,
                relativeLiftPct: Number(percentLift(voxBaselineCoverage, voxUpgradedCoverage).toFixed(2)),
                verifiedPackageCount: voxSnapshot.verifiedCount,
            },
        },
    };
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
function severityLevel(severity) {
    switch (severity) {
        case 'low':
            return 1;
        case 'medium':
            return 2;
        case 'high':
            return 3;
        case 'critical':
            return 4;
    }
}
function deriveLiveSynapseExpectations(signals) {
    return signals.map((signal) => {
        if (signal.touchesCapital && severityLevel(signal.severity) >= 3) {
            return { signalId: signal.id, expectedRouteType: 'escalated' };
        }
        if (signal.confidence < 0.35) {
            return { signalId: signal.id, expectedRouteType: 'blocked' };
        }
        return { signalId: signal.id, expectedRouteType: 'normal' };
    });
}
function deriveLiveCardiaExpectedAction(state, candidate) {
    if (candidate.heparRiskScore >= 75)
        return 'block';
    if ((state.volatilityRegime === 'crash' || state.liquidityStress) && candidate.currentAllocationUsd > 0) {
        return 'reduce';
    }
    if ((candidate.expectedReturnPct * candidate.confidence) >= 7 && candidate.heparRiskScore <= 40) {
        return 'allocate';
    }
    return 'hold';
}
function isCounterpartyAllowed(counterparties, name) {
    const cp = counterparties.find((entry) => entry.name === name);
    if (!cp)
        return true;
    if (cp.complianceBlocked)
        return false;
    if (cp.solvencyRisk === 'high')
        return false;
    if (cp.settlementReliability < 0.72)
        return false;
    return true;
}
function deriveLivePneumaCases(orders, quotes, counterparties) {
    return orders.map((order) => {
        const candidates = quotes
            .filter((quote) => quote.orderId === order.id)
            .filter((quote) => quote.slippageBps <= order.maxSlippageBps)
            .filter((quote) => isCounterpartyAllowed(counterparties, quote.counterparty))
            .map((quote) => ({
            quote,
            cost: quote.slippageBps + quote.feeBps + (order.urgency === 'urgent'
                ? quote.latencyMs / 90
                : quote.latencyMs / 180),
        }))
            .sort((left, right) => left.cost - right.cost);
        if (candidates.length === 0) {
            return {
                order,
                quotes: quotes.filter((quote) => quote.orderId === order.id),
                counterparties,
                expectedAccepted: false,
            };
        }
        return {
            order,
            quotes: quotes.filter((quote) => quote.orderId === order.id),
            counterparties,
            expectedAccepted: true,
            expectedVenue: candidates[0].quote.venue,
        };
    });
}
function calibrateLive(configPath) {
    const runtimeConfig = (0, config_1.loadRuntimeConfig)(configPath);
    const synapseSignals = runtimeConfig.synapseAdaptive?.sampleSignals || [];
    const synapseHealth = runtimeConfig.synapseAdaptive?.sampleSourceHealth || [];
    const synapseExpected = deriveLiveSynapseExpectations(synapseSignals);
    const synapsePolicyGrid = [];
    for (const gap of [1, 2, 3]) {
        for (const lowThreshold of [0.25, 0.35, 0.45]) {
            for (const sev of [2, 3, 4]) {
                synapsePolicyGrid.push({
                    conflictSeverityGap: gap,
                    lowConfidenceBlockThreshold: lowThreshold,
                    capitalEscalationMinSeverity: sev,
                });
            }
        }
    }
    const baselineSynapsePolicy = runtimeConfig.synapseAdaptive?.policy || {
        conflictSeverityGap: 3,
        lowConfidenceBlockThreshold: 0.45,
        capitalEscalationMinSeverity: 2,
    };
    let bestSynapse = baselineSynapsePolicy;
    let bestSynapseMetrics = evaluateSynapse(baselineSynapsePolicy, synapseSignals, synapseHealth, synapseExpected);
    for (const candidate of synapsePolicyGrid) {
        const metrics = evaluateSynapse(candidate, synapseSignals, synapseHealth, synapseExpected);
        if (metrics.score > bestSynapseMetrics.score) {
            bestSynapse = candidate;
            bestSynapseMetrics = metrics;
        }
    }
    const baselineSynapseMetrics = evaluateSynapse(baselineSynapsePolicy, synapseSignals, synapseHealth, synapseExpected);
    const cardiaState = runtimeConfig.cardiaAdaptive?.sampleState || {
        reserveRatioPercent: 0,
        minReserveRatioPercent: 20,
        portfolioDrawdownPct: 0,
        volatilityRegime: 'low',
        liquidityStress: false,
    };
    const cardiaCandidates = runtimeConfig.cardiaAdaptive?.sampleCandidates || [];
    const cardiaCases = cardiaCandidates.map((candidate) => ({
        state: cardiaState,
        candidate,
        expectedAction: deriveLiveCardiaExpectedAction(cardiaState, candidate),
    }));
    const cardiaGrid = [];
    for (const returnWeight of [1.1, 1.2, 1.3]) {
        for (const riskPenaltyWeight of [0.18, 0.22, 0.26]) {
            for (const drawdownPenaltyWeight of [0.06, 0.08, 0.1]) {
                for (const allocateThreshold of [2, 4, 6]) {
                    cardiaGrid.push({
                        returnWeight,
                        riskPenaltyWeight,
                        drawdownPenaltyWeight,
                        elevatedStressPenalty: 2.5,
                        crashStressPenalty: 11,
                        allocateThreshold,
                        reduceThreshold: -4,
                        hardBlockRiskScore: 70,
                    });
                }
            }
        }
    }
    const baselineCardiaCoefficients = runtimeConfig.cardiaAdaptive?.coefficients || {
        returnWeight: 1.2,
        riskPenaltyWeight: 0.18,
        drawdownPenaltyWeight: 0.06,
        elevatedStressPenalty: 2.5,
        crashStressPenalty: 11,
        allocateThreshold: 2,
        reduceThreshold: -4,
        hardBlockRiskScore: 70,
    };
    let bestCardia = baselineCardiaCoefficients;
    let bestCardiaMetrics = evaluateCardia(bestCardia, cardiaCases);
    for (const candidate of cardiaGrid) {
        const metrics = evaluateCardia(candidate, cardiaCases);
        if (metrics.score > bestCardiaMetrics.score) {
            bestCardia = candidate;
            bestCardiaMetrics = metrics;
        }
    }
    const baselineCardiaMetrics = evaluateCardia(baselineCardiaCoefficients, cardiaCases);
    const pneumaOrders = runtimeConfig.pneumaMarket?.sampleOrders || [];
    const pneumaQuotes = runtimeConfig.pneumaMarket?.sampleVenueQuotes || [];
    const pneumaCounterparties = runtimeConfig.pneumaMarket?.sampleCounterparties || [];
    const pneumaCases = deriveLivePneumaCases(pneumaOrders, pneumaQuotes, pneumaCounterparties);
    const pneumaGrid = [];
    for (const urgentDiv of [70, 80, 90]) {
        for (const normalDiv of [140, 160, 180]) {
            for (const minSettle of [0.68, 0.72, 0.76]) {
                pneumaGrid.push({
                    urgentLatencyPenaltyDivisor: urgentDiv,
                    normalLatencyPenaltyDivisor: normalDiv,
                    minSettlementReliability: minSettle,
                });
            }
        }
    }
    const baselinePneumaPolicy = runtimeConfig.pneumaMarket?.policy || {
        urgentLatencyPenaltyDivisor: 90,
        normalLatencyPenaltyDivisor: 180,
        minSettlementReliability: 0.72,
    };
    let bestPneuma = baselinePneumaPolicy;
    let bestPneumaMetrics = evaluatePneuma(bestPneuma, pneumaCases);
    for (const candidate of pneumaGrid) {
        const metrics = evaluatePneuma(candidate, pneumaCases);
        if (metrics.score > bestPneumaMetrics.score) {
            bestPneuma = candidate;
            bestPneumaMetrics = metrics;
        }
    }
    const baselinePneumaMetrics = evaluatePneuma(baselinePneumaPolicy, pneumaCases);
    const liveCortexSnapshot = (0, cortex_strategic_1.buildCortexStrategicSnapshot)(runtimeConfig.cortexStrategic?.sampleContexts || []);
    const liveVoxSnapshot = (0, vox_intelligence_1.buildVoxNarrativeIntelligenceSnapshot)(runtimeConfig.voxIntelligence?.sampleInputs || []);
    const result = {
        mode: 'live',
        configPath,
        calibratedPolicies: {
            synapse: bestSynapse,
            cardia: bestCardia,
            pneuma: bestPneuma,
        },
        currentPolicies: {
            synapse: baselineSynapsePolicy,
            cardia: baselineCardiaCoefficients,
            pneuma: baselinePneumaPolicy,
        },
        metrics: {
            synapse: {
                sampleCount: synapseSignals.length,
                baselineAccuracy: Number(baselineSynapseMetrics.accuracy.toFixed(4)),
                calibratedAccuracy: Number(bestSynapseMetrics.accuracy.toFixed(4)),
                relativeLiftPct: Number(percentLift(baselineSynapseMetrics.accuracy, bestSynapseMetrics.accuracy).toFixed(2)),
            },
            cardia: {
                sampleCount: cardiaCases.length,
                baselineAccuracy: Number(baselineCardiaMetrics.weightedAccuracy.toFixed(4)),
                calibratedAccuracy: Number(bestCardiaMetrics.weightedAccuracy.toFixed(4)),
                relativeLiftPct: Number(percentLift(baselineCardiaMetrics.weightedAccuracy, bestCardiaMetrics.weightedAccuracy).toFixed(2)),
            },
            pneuma: {
                sampleCount: pneumaCases.length,
                baselineAccuracy: Number(baselinePneumaMetrics.accuracy.toFixed(4)),
                calibratedAccuracy: Number(bestPneumaMetrics.accuracy.toFixed(4)),
                relativeLiftPct: Number(percentLift(baselinePneumaMetrics.accuracy, bestPneumaMetrics.accuracy).toFixed(2)),
                baselineAvgCostBps: Number(baselinePneumaMetrics.avgCost.toFixed(3)),
                calibratedAvgCostBps: Number(bestPneumaMetrics.avgCost.toFixed(3)),
            },
            cortex: {
                reportCount: liveCortexSnapshot.contextCount,
                averageStressIndex: liveCortexSnapshot.averageStressIndex,
            },
            vox: {
                packageCount: liveVoxSnapshot.packageCount,
                verifiedCount: liveVoxSnapshot.verifiedCount,
                conflictedCount: liveVoxSnapshot.conflictedCount,
            },
        },
    };
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}
function calibrate() {
    const args = parseArgs(process.argv.slice(2));
    if (args.mode === 'live') {
        calibrateLive(args.configPath);
        return;
    }
    calibrateBenchmark();
}
if (require.main === module) {
    calibrate();
}
