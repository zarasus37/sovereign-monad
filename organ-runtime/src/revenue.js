"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRevenueSnapshot = void 0;
const DEVELOPING_PIPELINE_WEIGHT = 0.35;
function buildOffer(input) {
    return input;
}
function clamp100(value) {
    return Math.max(0, Math.min(100, Math.round(value)));
}
function unique(items) {
    return [...new Set(items)];
}
function annualizeBandUsd(band) {
    var _a, _b;
    const annualLow = (_a = band.annualLowUsd) !== null && _a !== void 0 ? _a : ((band.monthlyLowUsd || 0) * 12);
    const annualHigh = (_b = band.annualHighUsd) !== null && _b !== void 0 ? _b : ((band.monthlyHighUsd || 0) * 12);
    return {
        low: Math.max(0, annualLow),
        high: Math.max(0, annualHigh),
    };
}
function statusFromScore(score) {
    if (score >= 70)
        return 'ready';
    if (score >= 40)
        return 'developing';
    return 'blocked';
}
function defaultTier3OperationalMaturity(input) {
    var _a, _b, _c, _d, _e, _f;
    return {
        automatedReportTemplating: (_a = input === null || input === void 0 ? void 0 : input.automatedReportTemplating) !== null && _a !== void 0 ? _a : false,
        qualityChecklistSignoff: (_b = input === null || input === void 0 ? void 0 : input.qualityChecklistSignoff) !== null && _b !== void 0 ? _b : false,
        evidencePackagingAutomation: (_c = input === null || input === void 0 ? void 0 : input.evidencePackagingAutomation) !== null && _c !== void 0 ? _c : false,
        customerPortalEnabled: (_d = input === null || input === void 0 ? void 0 : input.customerPortalEnabled) !== null && _d !== void 0 ? _d : false,
        slaEnabled: (_e = input === null || input === void 0 ? void 0 : input.slaEnabled) !== null && _e !== void 0 ? _e : false,
        targetTurnaroundHours: (_f = input === null || input === void 0 ? void 0 : input.targetTurnaroundHours) !== null && _f !== void 0 ? _f : 72,
    };
}
function scoreTier1(heparCoverage, heparApprovalRate, narrativePackages, exchangeReadyLeads, reserveHealthy) {
    let score = 0;
    const blockers = [];
    if (heparCoverage >= 5) {
        score += 30;
    }
    else {
        score += heparCoverage * 6;
        blockers.push('raise monitored protocol count to at least 5 for reliable API launch');
    }
    if (heparCoverage >= 20) {
        score += 20;
    }
    else {
        blockers.push('scale coverage toward 20+ protocols for stronger recurring retention');
    }
    if (heparApprovalRate >= 0.2 && heparApprovalRate <= 0.8) {
        score += 10;
    }
    else if (heparCoverage > 0) {
        score += 5;
        blockers.push('tighten screening thresholds to stabilize accepted-risk mix');
    }
    if (narrativePackages > 0) {
        score += 10;
    }
    else {
        blockers.push('package explainability artifacts to reduce buyer trust friction');
    }
    if (exchangeReadyLeads > 0) {
        score += 10;
    }
    else {
        blockers.push('build at least one outbound conversion lane for API contracts');
    }
    if (reserveHealthy) {
        score += 20;
    }
    else {
        blockers.push('restore reserve health before scaling support obligations');
    }
    return { score: clamp100(score), blockers: unique(blockers) };
}
function scoreTier2(heparCoverage, monetizableBriefs, narrativePackages, exchangeReadyLeads, reserveHealthy) {
    let score = 0;
    const blockers = [];
    if (heparCoverage >= 10) {
        score += 30;
    }
    else {
        score += heparCoverage * 3;
        blockers.push('increase forensic sample volume to at least 10 protocols for institutional credibility');
    }
    if (monetizableBriefs >= 2) {
        score += 20;
    }
    else {
        score += monetizableBriefs * 10;
        blockers.push('expand monetizable strategic briefs to 2+ per cycle');
    }
    if (narrativePackages >= 2) {
        score += 15;
    }
    else {
        score += narrativePackages * 7;
        blockers.push('maintain a multi-audience package cadence for institutional adoption');
    }
    if (exchangeReadyLeads >= 2) {
        score += 20;
    }
    else {
        score += exchangeReadyLeads * 8;
        blockers.push('grow qualified institutional lead count to 2+');
    }
    if (reserveHealthy) {
        score += 15;
    }
    else {
        blockers.push('reserve continuity must stay healthy for SLA-level feed delivery');
    }
    return { score: clamp100(score), blockers: unique(blockers) };
}
function scoreTier3(heparCoverage, monetizableBriefs, narrativePackages, exchangeReadyLeads, reserveHealthy, tier3Operational) {
    let score = 0;
    const blockers = [];
    const ops = defaultTier3OperationalMaturity(tier3Operational);
    if (heparCoverage >= 5) {
        score += 25;
    }
    else {
        score += heparCoverage * 5;
        blockers.push('raise protocol forensic intake to at least 5 for report consistency');
    }
    if (narrativePackages >= 2) {
        score += 25;
    }
    else {
        score += narrativePackages * 12;
        blockers.push('increase report packaging throughput (2+ narrative packages per cycle)');
    }
    if (monetizableBriefs >= 1) {
        score += 20;
    }
    else {
        blockers.push('add strategic context briefs to increase report sale conversion');
    }
    if (reserveHealthy) {
        score += 15;
    }
    else {
        blockers.push('reserve instability reduces ability to guarantee turnaround times');
    }
    if (exchangeReadyLeads >= 1) {
        score += 15;
    }
    else {
        blockers.push('establish at least one direct outbound channel for report closes');
    }
    if (ops.automatedReportTemplating) {
        score += 4;
    }
    else {
        blockers.push('automate report templating to remove manual throughput bottlenecks');
    }
    if (ops.qualityChecklistSignoff) {
        score += 4;
    }
    else {
        blockers.push('implement quality checklist and sign-off workflow before institutional report scale');
    }
    if (ops.evidencePackagingAutomation) {
        score += 4;
    }
    else {
        blockers.push('automate evidence packaging and proof-link export');
    }
    if (ops.customerPortalEnabled) {
        score += 4;
    }
    else {
        blockers.push('deploy customer intake portal for protocol upload and report tracking');
    }
    if (ops.slaEnabled) {
        score += 4;
    }
    else {
        blockers.push('publish SLA guarantees for response time and quality commitment');
    }
    if (ops.targetTurnaroundHours <= 24) {
        score += 4;
    }
    else {
        blockers.push('reduce report turnaround target to 24h for fastest commercial conversion lane');
    }
    return { score: clamp100(score), blockers: unique(blockers) };
}
function scoreTier4(heparCoverage, heparApprovals, monetizableBriefs, narrativePackages, exchangeReadyLeads, reserveHealthy) {
    let score = 0;
    const blockers = [];
    if (heparCoverage >= 50) {
        score += 35;
    }
    else {
        score += Math.floor(heparCoverage * 0.7);
        blockers.push('insurance-grade dataset requires 50+ monitored protocols');
    }
    if (heparCoverage >= 100) {
        score += 15;
    }
    else {
        blockers.push('expand longitudinal coverage toward 100+ protocols for actuarial reliability');
    }
    if (monetizableBriefs >= 4) {
        score += 10;
    }
    else {
        score += monetizableBriefs * 2;
        blockers.push('codify institutional methodology across 4+ recurring brief cycles');
    }
    if (narrativePackages >= 4) {
        score += 10;
    }
    else {
        score += narrativePackages * 2;
        blockers.push('increase evidence-linked publication cadence for auditability');
    }
    if (exchangeReadyLeads >= 5) {
        score += 15;
    }
    else {
        score += exchangeReadyLeads * 2;
        blockers.push('grow insurance and treasury counterparties to 5+ qualified accounts');
    }
    if (reserveHealthy) {
        score += 10;
    }
    else {
        blockers.push('reserve continuity is required for long-cycle enterprise licensing delivery');
    }
    if (heparApprovals >= 10) {
        score += 5;
    }
    else {
        score += Math.min(heparApprovals, 5);
        blockers.push('increase validated accepted-profile sample count for calibration trust');
    }
    return { score: clamp100(score), blockers: unique(blockers) };
}
function scoreCompoundRail(heparCoverage, monetizableBriefs, narrativePackages, exchangeReadyLeads, reserveHealthy) {
    let score = 0;
    const blockers = [];
    if (reserveHealthy) {
        score += 40;
    }
    else {
        score += 10;
        blockers.push('Cardia reserve continuity is below healthy threshold');
    }
    if (exchangeReadyLeads >= 2) {
        score += 20;
    }
    else {
        score += exchangeReadyLeads * 8;
        blockers.push('raise conversion-ready lead depth to 2+');
    }
    if (monetizableBriefs > 0) {
        score += 15;
    }
    else {
        blockers.push('Cortex monetizable synthesis is missing');
    }
    if (narrativePackages > 0) {
        score += 15;
    }
    else {
        blockers.push('Vox packaging throughput is missing');
    }
    if (heparCoverage >= 5) {
        score += 10;
    }
    else {
        score += heparCoverage * 2;
        blockers.push('Hepar coverage depth is below compound-rail floor');
    }
    return { score: clamp100(score), blockers: unique(blockers) };
}
function buildPortfolioMetrics(offers) {
    let readyOfferCount = 0;
    let developingOfferCount = 0;
    let blockedOfferCount = 0;
    let annualizedReadyLowUsd = 0;
    let annualizedReadyHighUsd = 0;
    let annualizedPipelineLowUsd = 0;
    let annualizedPipelineHighUsd = 0;
    let weightedReadinessNumerator = 0;
    for (const offer of offers) {
        const annual = annualizeBandUsd(offer.valueBandUsd);
        weightedReadinessNumerator += offer.readinessScore;
        if (offer.status === 'ready') {
            readyOfferCount += 1;
            annualizedReadyLowUsd += annual.low;
            annualizedReadyHighUsd += annual.high;
            annualizedPipelineLowUsd += annual.low;
            annualizedPipelineHighUsd += annual.high;
            continue;
        }
        if (offer.status === 'developing') {
            developingOfferCount += 1;
            annualizedPipelineLowUsd += Math.round(annual.low * DEVELOPING_PIPELINE_WEIGHT);
            annualizedPipelineHighUsd += Math.round(annual.high * DEVELOPING_PIPELINE_WEIGHT);
            continue;
        }
        blockedOfferCount += 1;
    }
    const weightedReadinessScore = offers.length === 0 ? 0 : Math.round((weightedReadinessNumerator / offers.length) * 100) / 100;
    const recommendedLaunchSequence = [...offers]
        .sort((left, right) => {
        if (left.launchPriority !== right.launchPriority) {
            return left.launchPriority - right.launchPriority;
        }
        const statusWeight = {
            ready: 0,
            developing: 1,
            blocked: 2,
        };
        const statusDelta = statusWeight[left.status] - statusWeight[right.status];
        if (statusDelta !== 0)
            return statusDelta;
        return right.readinessScore - left.readinessScore;
    })
        .map((offer) => offer.offerId);
    return {
        portfolioMetrics: {
            readyOfferCount,
            developingOfferCount,
            blockedOfferCount,
            weightedReadinessScore,
            annualizedReadyLowUsd,
            annualizedReadyHighUsd,
            annualizedPipelineLowUsd,
            annualizedPipelineHighUsd,
        },
        recommendedLaunchSequence,
    };
}
function buildRevenueSnapshot(input) {
    const monetizableBriefs = input.cortex.briefs.filter((brief) => brief.monetizable).length;
    const narrativePackages = input.vox.packages.length;
    const exchangeReadyLeads = input.pneuma.acceptedCount;
    const heparCoverage = input.hepar.screenedCount;
    const heparApprovals = input.hepar.approvedCount;
    const heparApprovalRate = heparCoverage === 0 ? 0 : heparApprovals / heparCoverage;
    const tier1 = scoreTier1(heparCoverage, heparApprovalRate, narrativePackages, exchangeReadyLeads, input.cardia.reserveHealthy);
    const tier2 = scoreTier2(heparCoverage, monetizableBriefs, narrativePackages, exchangeReadyLeads, input.cardia.reserveHealthy);
    const tier3 = scoreTier3(heparCoverage, monetizableBriefs, narrativePackages, exchangeReadyLeads, input.cardia.reserveHealthy, input.tier3Operational);
    const tier4 = scoreTier4(heparCoverage, heparApprovals, monetizableBriefs, narrativePackages, exchangeReadyLeads, input.cardia.reserveHealthy);
    const crossTier = scoreCompoundRail(heparCoverage, monetizableBriefs, narrativePackages, exchangeReadyLeads, input.cardia.reserveHealthy);
    const offers = [
        buildOffer({
            offerId: 'tier1-hepar-risk-api',
            title: 'Hepar Continuous Risk API',
            tier: 'Tier 1',
            status: statusFromScore(tier1.score),
            monthlyUsdRange: '$0.01/check usage or $50k/month unlimited commit',
            pricingModel: 'Hybrid usage + monthly commit',
            launchPriority: 1,
            readinessScore: tier1.score,
            blockers: tier1.blockers,
            targetCustomers: ['DeFi protocols', 'DAO treasuries', 'launchpad operators'],
            packaging: [
                'real-time risk check endpoint',
                'webhook alert stream',
                'attestation-linked high-risk evidence',
            ],
            primaryKpis: [
                'daily protocol checks',
                'false-positive rate',
                'critical-risk detection precision',
            ],
            valueBandUsd: {
                monthlyLowUsd: 5000,
                monthlyHighUsd: 50000,
            },
            unitEconomics: {
                grossMarginClass: 'high',
                expectedSalesCycleDays: 30,
                onboardingComplexity: 'low',
            },
            prerequisites: ['Hepar forensic screening coverage', 'stable API delivery', 'rights-safe output policy'],
            evidence: [
                `hepar.screenedCount=${heparCoverage}`,
                `hepar.approvedCount=${heparApprovals}`,
                `hepar.approvalRate=${heparApprovalRate.toFixed(3)}`,
            ],
        }),
        buildOffer({
            offerId: 'tier2-institutional-risk-feed',
            title: 'Institutional Risk Intelligence Feed',
            tier: 'Tier 2',
            status: statusFromScore(tier2.score),
            monthlyUsdRange: '$50k-$500k per institution (latency + coverage tiering)',
            pricingModel: 'Seat/license with SLA tiers',
            launchPriority: 3,
            readinessScore: tier2.score,
            blockers: tier2.blockers,
            targetCustomers: ['Hedge funds', 'market makers', 'treasury managers'],
            packaging: [
                'low-latency risk signal feed',
                'scenario and stress-change brief bundle',
                'escalation and conflict audit trail',
            ],
            primaryKpis: [
                'institutional conversion rate',
                'feed retention/churn',
                'signal hit-rate vs realized incidents',
            ],
            valueBandUsd: {
                monthlyLowUsd: 50000,
                monthlyHighUsd: 500000,
            },
            unitEconomics: {
                grossMarginClass: 'high',
                expectedSalesCycleDays: 90,
                onboardingComplexity: 'medium',
            },
            prerequisites: ['Hepar forensic stream', 'Cortex monetizable synthesis', 'Vox distribution packaging'],
            evidence: [
                `hepar.screenedCount=${heparCoverage}`,
                `cortex.monetizableBriefs=${monetizableBriefs}`,
                `pneuma.acceptedCount=${exchangeReadyLeads}`,
            ],
        }),
        buildOffer({
            offerId: 'tier3-forensic-prelaunch-report',
            title: 'Protocol Forensic Pre-Mainnet Report',
            tier: 'Tier 3',
            status: statusFromScore(tier3.score),
            monthlyUsdRange: '$5k basic / $25k institutional deep-dive per report',
            pricingModel: 'Two-tier report pricing with SLA and remediation retest upsell',
            launchPriority: 2,
            readinessScore: tier3.score,
            blockers: tier3.blockers,
            targetCustomers: ['new protocol teams', 'launch incubators', 'security-conscious DAOs'],
            packaging: [
                'forensic report with evidence appendix',
                'admin control map and LP unlock timeline',
                'proof-linked evidence bundle',
                '24h portal intake and report handoff path',
                'remediation retest package',
            ],
            primaryKpis: [
                'report turnaround time',
                'close rate per outbound lead',
                'SLA compliance rate',
                'retest upsell conversion',
            ],
            valueBandUsd: {
                monthlyLowUsd: 10000,
                monthlyHighUsd: 250000,
            },
            unitEconomics: {
                grossMarginClass: 'medium',
                expectedSalesCycleDays: 21,
                onboardingComplexity: 'low',
            },
            prerequisites: ['Hepar deep forensic profile', 'Cortex report synthesis', 'Vox report packaging'],
            evidence: [
                `hepar.screenedCount=${heparCoverage}`,
                `vox.packages=${narrativePackages}`,
                `cortex.monetizableBriefs=${monetizableBriefs}`,
            ],
        }),
        buildOffer({
            offerId: 'tier4-insurance-underwriting-dataset',
            title: 'Insurance Underwriting Risk Dataset',
            tier: 'Tier 4',
            status: statusFromScore(tier4.score),
            monthlyUsdRange: '2-5% premium share or $10M-$50M annual license',
            pricingModel: 'Annual licensing first, then premium-share option',
            launchPriority: 4,
            readinessScore: tier4.score,
            blockers: tier4.blockers,
            targetCustomers: ['DeFi insurers', 'reinsurers', 'risk syndicates'],
            packaging: [
                'longitudinal protocol-risk dataset',
                'underwriting-grade risk vectors',
                'loss-ratio and calibration advisory layer',
            ],
            primaryKpis: [
                'partnered underwriters count',
                'dataset refresh SLA compliance',
                'insured loss-ratio improvement vs baseline',
            ],
            valueBandUsd: {
                annualLowUsd: 10000000,
                annualHighUsd: 50000000,
            },
            unitEconomics: {
                grossMarginClass: 'high',
                expectedSalesCycleDays: 240,
                onboardingComplexity: 'high',
            },
            prerequisites: [
                'High-volume Hepar forensic longitudinal coverage',
                'Cortex + Vox productized methodology',
                'Pneuma institutional distribution',
            ],
            evidence: [
                `hepar.screenedCount=${heparCoverage}`,
                `pneuma.acceptedCount=${exchangeReadyLeads}`,
                `cortex.monetizableBriefs=${monetizableBriefs}`,
            ],
        }),
        buildOffer({
            offerId: 'organ-native-compound-revenue-loop',
            title: 'Six-Organ Compound Revenue Loop',
            tier: 'Cross-tier',
            status: statusFromScore(crossTier.score),
            monthlyUsdRange: 'depends on rail mix',
            pricingModel: 'Internal compounding rail + external product cross-sell',
            launchPriority: 5,
            readinessScore: crossTier.score,
            blockers: crossTier.blockers,
            targetCustomers: ['internal treasury rail', 'cross-sell product buyers'],
            packaging: [
                'API + report + feed bundle ladders',
                'closed-loop reinvestment discipline',
                'cross-tier account expansion playbooks',
            ],
            primaryKpis: [
                'multi-product attach rate',
                'cash conversion cycle',
                'month-over-month revenue retention',
            ],
            valueBandUsd: {
                monthlyLowUsd: 100000,
                monthlyHighUsd: 1000000,
            },
            unitEconomics: {
                grossMarginClass: 'high',
                expectedSalesCycleDays: 45,
                onboardingComplexity: 'medium',
            },
            prerequisites: [
                'Hepar risk filtering',
                'Cortex intelligence synthesis',
                'Vox packaging',
                'Pneuma conversion',
                'Cardia reserve continuity',
            ],
            evidence: [
                `cardia.reserveHealthy=${input.cardia.reserveHealthy}`,
                `pneuma.acceptedCount=${exchangeReadyLeads}`,
            ],
        }),
    ];
    const { portfolioMetrics, recommendedLaunchSequence } = buildPortfolioMetrics(offers);
    return {
        implemented: true,
        thesis: 'The six organs generate sellable intelligence and conversion surfaces; optimization now emphasizes launch order, readiness scoring, and unit-economics discipline before scaling enterprise lanes.',
        offers,
        recommendedLaunchSequence,
        portfolioMetrics,
    };
}
exports.buildRevenueSnapshot = buildRevenueSnapshot;
//# sourceMappingURL=revenue.js.map