import { LEGAL_POSTURE, TIER_DISCIPLINE } from "../shared/legal-disclaimers";

export interface ProposalDocument {
    id: string;
    proposalId: string;
    daoId: string;
    protocolName: string;
    proposalTier: string;
    status: string;
    generatedAt: string;
    sourceLeadId: string;
    enrichedTimestamp: string;

    executiveSummary: {
        protocol: string;
        tvl: string;
        heparScore: number;
        riskPosture: string;
        cortexStressIndex: number;
        engagementRecommendation: string;
    };

    riskAssessment: {
        scenarios: any[];
        causalDrivers: string[];
        recommendations: any[];
        overallStress: number;
    };

    signalIntelligence: {
        escalations: number;
        conflicts: number;
        routeSummary: string;
    };

    narrativePackage: {
        packageCount: number;
        verifiedCount: number;
        conflictedCount: number;
        audienceSummaries: string[];
    };

    executionFeasibility: {
        fillRatio: number;
        averageCostBps: number;
        feedbackSignals: string[];
        viable: boolean;
    };

    capitalGuardrails: {
        netAllocationUsd: number;
        blockedCount: number;
        stressActions: string[];
        decision: string;
    };

    engagementTerms: {
        tier: string;
        scope: string[];
        deliverables: string[];
        estimatedValue: string;
    };

    billingDetails: {
        paymentMethod: string;
        invoiceLink: string;
    };

    compliance: {
        tierWatermark: string;
        legalDisclaimer: string;
        disputeProtocol: string;
    };
}

function formatTvl(tvl: number): string {
    if (tvl >= 1_000_000_000) return `$${(tvl / 1_000_000_000).toFixed(1)}B`;
    if (tvl >= 1_000_000) return `$${(tvl / 1_000_000).toFixed(1)}M`;
    if (tvl >= 1_000) return `$${(tvl / 1_000).toFixed(1)}K`;
    return `$${tvl}`;
}

function determineRiskPosture(cortexStress: number, cardiaBlocked: number): string {
    if (cardiaBlocked > 0) return "HIGH RISK — Capital blocked by Cardia guardrails";
    if (cortexStress > 0.7) return "ELEVATED — Cortex stress index above defensive threshold";
    if (cortexStress > 0.45) return "MODERATE — Mixed signals, bounded exposure recommended";
    return "FAVORABLE — Low structural stress, expansion opportunities viable";
}

function determineEngagementTerms(tier: string): { scope: string[]; deliverables: string[]; estimatedValue: string } {
    switch (tier) {
        case "FULL_ENGAGEMENT":
            return {
                scope: [
                    "Continuous 7-dimensional forensic monitoring",
                    "Weekly Cortex strategic intelligence briefings",
                    "Real-time Synapse signal routing and escalation",
                    "Quarterly deep-dive forensic report with remediation guidance",
                    "Direct channel to Hepar forensic team"
                ],
                deliverables: [
                    "Initial full forensic workup (7-dimensional scoring)",
                    "Hepar Monitored badge for public registry",
                    "Monthly clearance reports for investor relations",
                    "Real-time alert feed for risk status changes"
                ],
                estimatedValue: "$25,000 initial assessment + $10,000/month continuous monitoring"
            };
        case "ADVISORY_ONLY":
            return {
                scope: [
                    "One-time forensic risk assessment",
                    "Risk summary with key findings",
                    "Remediation recommendations"
                ],
                deliverables: [
                    "Basic forensic report (7-dimensional scoring)",
                    "Top-risk summary for governance review"
                ],
                estimatedValue: "$5,000 one-time assessment"
            };
        default: // STANDARD
            return {
                scope: [
                    "Initial full forensic workup",
                    "Monthly monitoring with alert feed",
                    "Quarterly updated assessment"
                ],
                deliverables: [
                    "Full forensic report (7-dimensional scoring)",
                    "Hepar Monitored badge",
                    "Monthly status reports"
                ],
                estimatedValue: "$5,000 initial assessment + $5,000/month monitoring"
            };
    }
}

export function buildProposalDocument(enrichedLead: any): ProposalDocument {
    const cortexStress = enrichedLead.cortexReport?.averageStressIndex ?? 0;
    const synapseEscalations = enrichedLead.synapseRoute?.escalations ?? 0;
    const synapseConflicts = enrichedLead.synapseRoute?.conflicts?.length ?? 0;
    const voxPackageCount = enrichedLead.voxPackage?.packageCount ?? 0;
    const voxVerifiedCount = enrichedLead.voxPackage?.verifiedCount ?? 0;
    const voxConflictedCount = enrichedLead.voxPackage?.conflictedCount ?? 0;
    const pneumaFillRatio = enrichedLead.pneumaDecision?.fillRatio ?? 0;
    const pneumaAvgCostBps = enrichedLead.pneumaDecision?.averageCostBps ?? 0;
    const cardiaNetAllocation = enrichedLead.cardiaGuardrail?.netAllocationUsd ?? 0;
    const cardiaBlocked = enrichedLead.cardiaGuardrail?.blockedCount ?? 0;

    // Determine proposal tier
    let proposalTier: string;
    if (cardiaBlocked > 0 || cortexStress > 0.7) {
        proposalTier = "ADVISORY_ONLY";
    } else if (cardiaNetAllocation > 100000 && pneumaFillRatio > 0.8) {
        proposalTier = "FULL_ENGAGEMENT";
    } else {
        proposalTier = "STANDARD";
    }

    const engagementTerms = determineEngagementTerms(proposalTier);

    // Build audience summaries from Vox packages
    const audienceSummaries: string[] = (enrichedLead.voxPackage?.packages || [])
        .map((pkg: any) => `[${pkg.audience}] ${pkg.summary}`)
        .slice(0, 4);

    // Synapse route summary
    const routeCount = enrichedLead.synapseRoute?.routes?.length ?? 0;
    const escalatedRoutes = (enrichedLead.synapseRoute?.routes || [])
        .filter((r: any) => r.routeType === "escalated").length;
    const routeSummary = `${routeCount} signal(s) routed, ${escalatedRoutes} escalated, ${synapseConflicts} conflict(s) detected`;

    return {
        id: `prop-${enrichedLead.daoId}-${Date.now()}`,
        proposalId: `HEPAR-PROP-${Date.now()}`,
        daoId: enrichedLead.daoId,
        protocolName: enrichedLead.protocolName,
        proposalTier,
        status: "PROPOSAL_GENERATED",
        generatedAt: new Date().toISOString(),
        sourceLeadId: enrichedLead.id,
        enrichedTimestamp: enrichedLead.enrichedTimestamp,

        executiveSummary: {
            protocol: enrichedLead.protocolName,
            tvl: formatTvl(enrichedLead.tvl || 0),
            heparScore: enrichedLead.heparScore || 0,
            riskPosture: determineRiskPosture(cortexStress, cardiaBlocked),
            cortexStressIndex: cortexStress,
            engagementRecommendation: proposalTier === "FULL_ENGAGEMENT"
                ? "Full engagement recommended — strong risk-adjusted profile with viable capital allocation."
                : proposalTier === "ADVISORY_ONLY"
                    ? "Advisory assessment only — elevated risk signals require deeper review before engagement."
                    : "Standard engagement — positive profile with standard monitoring recommended."
        },

        riskAssessment: {
            scenarios: enrichedLead.cortexReport?.reports?.[0]?.scenarios || [],
            causalDrivers: enrichedLead.cortexReport?.reports?.[0]?.causalDrivers || [],
            recommendations: enrichedLead.cortexReport?.reports?.[0]?.recommendations || [],
            overallStress: cortexStress
        },

        signalIntelligence: {
            escalations: synapseEscalations,
            conflicts: synapseConflicts,
            routeSummary
        },

        narrativePackage: {
            packageCount: voxPackageCount,
            verifiedCount: voxVerifiedCount,
            conflictedCount: voxConflictedCount,
            audienceSummaries
        },

        executionFeasibility: {
            fillRatio: pneumaFillRatio,
            averageCostBps: pneumaAvgCostBps,
            feedbackSignals: enrichedLead.pneumaDecision?.feedbackSignals || [],
            viable: pneumaFillRatio > 0.5 && pneumaAvgCostBps < 100
        },

        capitalGuardrails: {
            netAllocationUsd: cardiaNetAllocation,
            blockedCount: cardiaBlocked,
            stressActions: enrichedLead.cardiaGuardrail?.stressActions || [],
            decision: cardiaBlocked > 0 ? "BLOCKED" : cardiaNetAllocation > 0 ? "ALLOCATE" : "HOLD"
        },

        engagementTerms: {
            tier: proposalTier,
            ...engagementTerms
        },

        billingDetails: {
            paymentMethod: "Manual Invoice / Static Link",
            invoiceLink: `https://hepar-commercial-pipeline.azurewebsites.net/api/hepar-invoice/${enrichedLead.daoId}`
        },

        compliance: {
            tierWatermark: process.env["TELEMETRY_GATING_PASSED"] === "true" 
                ? "DECISION-SUPPORT TIER VERIFIED" 
                : TIER_DISCIPLINE.ADVISORY_WATERMARK,
            legalDisclaimer: LEGAL_POSTURE.SECTION_15_DISCLAIMER,
            disputeProtocol: LEGAL_POSTURE.DISPUTE_PROTOCOL
        }
    };
}
