"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildCortexStrategicSnapshot = void 0;
function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}
function normalizeStress(context) {
    const heparPressure = clamp01(context.heparCriticalCount / 20);
    const volatilityPressure = clamp01(context.marketVolatilityPct / 80);
    const pnlPressure = context.recentPnlUsd >= 0 ? 0 : clamp01(Math.abs(context.recentPnlUsd) / 500000);
    const behaviorPressure = clamp01(context.agentBehaviorStress);
    return clamp01((heparPressure * 0.35) +
        (volatilityPressure * 0.25) +
        (pnlPressure * 0.2) +
        (behaviorPressure * 0.2));
}
function scenarioSet(context, stress) {
    const macroLower = context.macroRegime.toLowerCase();
    const bearBias = macroLower.includes('bear') || macroLower.includes('winter') || macroLower.includes('tightening');
    const bullBias = macroLower.includes('bull') || macroLower.includes('risk-on');
    let bearProbability = clamp01((bearBias ? 0.45 : 0.28) + (stress * 0.3));
    let bullProbability = clamp01((bullBias ? 0.35 : 0.2) - (stress * 0.22));
    let baseProbability = 1 - bearProbability - bullProbability;
    if (baseProbability < 0) {
        const total = bearProbability + bullProbability;
        bearProbability = total > 0 ? bearProbability / total : 0.5;
        bullProbability = total > 0 ? bullProbability / total : 0.5;
        baseProbability = 0;
    }
    return [
        {
            name: 'bear_case_30d',
            probability: Math.round(bearProbability * 1000) / 1000,
            expectedReturnPct: Math.round((-12 - (stress * 8)) * 100) / 100,
            drawdownRiskPct: Math.round((18 + (stress * 22)) * 100) / 100,
        },
        {
            name: 'base_case_30d',
            probability: Math.round(baseProbability * 1000) / 1000,
            expectedReturnPct: Math.round((2 - (stress * 4)) * 100) / 100,
            drawdownRiskPct: Math.round((8 + (stress * 10)) * 100) / 100,
        },
        {
            name: 'bull_case_30d',
            probability: Math.round(bullProbability * 1000) / 1000,
            expectedReturnPct: Math.round((10 - (stress * 5)) * 100) / 100,
            drawdownRiskPct: Math.round((6 + (stress * 8)) * 100) / 100,
        },
    ];
}
function recommendations(context, stress) {
    const out = [];
    if (stress >= 0.7) {
        out.push({
            action: 'shift portfolio to defensive posture',
            rationale: 'Stress index is elevated across risk, volatility, and behavior surfaces.',
            confidence: 0.84,
        });
        out.push({
            action: 'reduce protocol concentration and tighten stop parameters',
            rationale: 'Concentrated drawdown exposure is likely in current regime.',
            confidence: 0.78,
        });
    }
    else if (stress >= 0.45) {
        out.push({
            action: 'maintain bounded exposure and prioritize high-confidence opportunities',
            rationale: 'Mixed regime; preserve optionality while avoiding over-allocation.',
            confidence: 0.71,
        });
    }
    else {
        out.push({
            action: 'selectively increase exposure to high-quality opportunities',
            rationale: 'Low structural stress and manageable volatility support measured expansion.',
            confidence: 0.67,
        });
    }
    if (context.heparCriticalCount > 0) {
        out.push({
            action: 'prioritize Hepar-flagged protocol restrictions',
            rationale: 'Critical forensic findings materially alter downside tails.',
            confidence: 0.81,
        });
    }
    out.push({
        action: 'publish governance question set for capital policy',
        rationale: 'Decision transparency improves adaptation quality under regime uncertainty.',
        confidence: 0.64,
    });
    return out;
}
function causalDrivers(context, stress) {
    const drivers = [];
    if (context.heparCriticalCount > 0) {
        drivers.push(`forensic risk pressure from ${context.heparCriticalCount} critical protocol findings`);
    }
    if (context.marketVolatilityPct >= 40) {
        drivers.push(`elevated realized volatility (${context.marketVolatilityPct}%) driving spread instability`);
    }
    if (context.recentPnlUsd < 0) {
        drivers.push(`recent losses (${context.recentPnlUsd.toFixed(0)} USD) increasing defensive pressure`);
    }
    if (context.agentBehaviorStress >= 0.6) {
        drivers.push('behavioral stress indicates likely panic or low-discipline execution clusters');
    }
    if (drivers.length === 0) {
        drivers.push('no single dominant stressor; market posture appears balanced');
    }
    drivers.push(`composite stress index=${stress.toFixed(2)}`);
    return drivers;
}
function buildReport(context) {
    const stress = normalizeStress(context);
    return {
        contextId: context.id,
        headline: context.headline,
        stressIndex: Math.round(stress * 1000) / 1000,
        causalDrivers: causalDrivers(context, stress),
        scenarios: scenarioSet(context, stress),
        recommendations: recommendations(context, stress),
    };
}
function buildCortexStrategicSnapshot(contexts) {
    const reports = contexts.map(buildReport);
    const averageStress = reports.length === 0 ? 0 : reports.reduce((sum, report) => sum + report.stressIndex, 0) / reports.length;
    return {
        implemented: true,
        contextCount: contexts.length,
        averageStressIndex: Math.round(averageStress * 1000) / 1000,
        reports,
    };
}
exports.buildCortexStrategicSnapshot = buildCortexStrategicSnapshot;
//# sourceMappingURL=cortex-strategic.js.map