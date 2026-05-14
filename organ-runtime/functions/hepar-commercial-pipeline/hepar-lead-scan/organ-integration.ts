import { getContainer } from "./cosmos-config";

import {
  buildCortexStrategicSnapshot,
  buildSynapseAdaptiveSnapshot,
  buildVoxNarrativeIntelligenceSnapshot,
  buildPneumaMarketSnapshot,
  buildCardiaAdaptiveSnapshot
} from "./organ-stubs";


/**
 * Translates a qualified Hepar lead into the typed inputs each organ expects,
 * then runs the full five-organ enrichment pipeline and persists the result.
 *
 * Organ call order follows the metabolic dependency chain:
 *   Cortex → Synapse → Vox → Pneuma → Cardia
 */
export async function enrichLeadWithOrgans(lead: any, context: any) {
    context.log(`[Hepar Lead Scan] Enriching qualified lead ${lead.daoId} with five assisting organs...`);

    // ─── Cortex: causal analysis & scenario synthesis ─────────────────
    // Translate lead into a CortexStrategicContext[]
    const cortexContexts = [{
        id: `cortex-${lead.daoId}-${Date.now()}`,
        headline: `Strategic assessment for ${lead.protocolName}`,
        heparCriticalCount: lead.recentExploit ? 1 : 0,
        marketVolatilityPct: lead.tvl > 1_000_000_000 ? 25 : 45,
        recentPnlUsd: 0,
        agentBehaviorStress: 0.2,
        macroRegime: lead.hasActiveProposal ? "risk-on governance active" : "neutral observation"
    }];
    const cortexReport = buildCortexStrategicSnapshot(cortexContexts);
    context.log(`[Cortex] Strategic scenarios generated for ${lead.daoId} — stress index: ${cortexReport.averageStressIndex}`);

    // ─── Synapse: signal routing & conflict arbitration ───────────────
    // Translate lead + cortex output into SynapseAdaptiveSignal[] + health
    const synapseSignals: Array<{
        id: string; source: string; category: string; severity: string;
        confidence: number; touchesCapital: boolean; summary: string;
    }> = [{
        id: `sig-${lead.daoId}-lead`,
        source: "Hepar",
        category: "opportunity",
        severity: lead.heparScore >= 70 ? "high" : "medium",
        confidence: lead.heparScore / 100,
        touchesCapital: true,
        summary: `Qualified lead: ${lead.protocolName} (score ${lead.heparScore})`
    }];
    if (lead.recentExploit) {
        synapseSignals.push({
            id: `sig-${lead.daoId}-exploit`,
            source: "Market",
            category: "integrity",
            severity: "critical",
            confidence: 0.9,
            touchesCapital: true,
            summary: `Recent exploit detected on ${lead.protocolName}`
        });
    }
    const synapseSourceHealth = [
        { source: "Hepar" as const, precision: 0.88, missRate: 0.05, stalenessSec: 30 },
        { source: "Cortex" as const, precision: 0.82, missRate: 0.08, stalenessSec: 60 },
        { source: "Market" as const, precision: 0.75, missRate: 0.12, stalenessSec: 120 },
        { source: "Cardia" as const, precision: 0.85, missRate: 0.06, stalenessSec: 45 },
        { source: "Pneuma" as const, precision: 0.80, missRate: 0.10, stalenessSec: 90 },
        { source: "Vox" as const, precision: 0.78, missRate: 0.09, stalenessSec: 75 },
        { source: "DataRail" as const, precision: 0.90, missRate: 0.03, stalenessSec: 15 }
    ];
    const synapseRoute = buildSynapseAdaptiveSnapshot(synapseSignals, synapseSourceHealth);
    context.log(`[Synapse] Routed with urgency — ${synapseRoute.escalations} escalation(s), ${synapseRoute.conflicts.length} conflict(s)`);

    // ─── Vox: truth-linked narrative packaging for proposals/reports ──
    // Translate lead + cortex + synapse into VoxNarrativeInput[]
    const voxInputs = [{
        id: `vox-${lead.daoId}-${Date.now()}`,
        eventTitle: `${lead.protocolName} Lead Qualification`,
        facts: [
            `${lead.protocolName} TVL: $${(lead.tvl / 1_000_000).toFixed(0)}M`,
            `Hepar score: ${lead.heparScore} (threshold: ${lead.qualifyingThreshold})`,
            `Active proposal: ${lead.hasActiveProposal ? 'yes' : 'no'}`,
            `Cortex stress index: ${cortexReport.averageStressIndex}`
        ],
        proofRefs: [`hepar-scan-${lead.id}`, `cortex-report-${cortexReport.reports[0]?.contextId || 'none'}`],
        contradictionCount: synapseRoute.conflicts.length,
        audiences: ["operators" as const, "buyers" as const]
    }];
    const voxPackage = buildVoxNarrativeIntelligenceSnapshot(voxInputs);
    context.log(`[Vox] Narrative package ready — ${voxPackage.packageCount} audience packages, ${voxPackage.verifiedCount} verified`);

    // ─── Pneuma: execution intelligence & outreach feasibility ────────
    // Translate lead + synapse into PneumaOrderIntent[] + quotes + counterparties
    const pneumaOrders = [{
        id: `order-${lead.daoId}`,
        asset: lead.protocolName,
        side: "buy" as const,
        notionalUsd: Math.min(lead.tvl * 0.001, 500000),
        maxSlippageBps: 50,
        urgency: (lead.hasActiveProposal ? "urgent" : "normal") as "urgent" | "normal"
    }];
    const pneumaQuotes = [{
        orderId: `order-${lead.daoId}`,
        venue: "primary-dex",
        availableUsd: lead.tvl * 0.005,
        slippageBps: 15,
        feeBps: 5,
        latencyMs: 120,
        counterparty: lead.protocolName
    }];
    const pneumaCounterparties = [{
        name: lead.protocolName,
        solvencyRisk: (lead.recentExploit ? "high" : "low") as "low" | "medium" | "high",
        settlementReliability: lead.recentExploit ? 0.6 : 0.95,
        complianceBlocked: false
    }];
    const pneumaDecision = buildPneumaMarketSnapshot(pneumaOrders, pneumaQuotes, pneumaCounterparties);
    context.log(`[Pneuma] Execution feasibility scored — fill ratio: ${pneumaDecision.fillRatio}, avg cost: ${pneumaDecision.averageCostBps} bps`);

    // ─── Cardia: capital guardrails & allocation caps ─────────────────
    // Translate lead + pneuma into CardiaAdaptiveState + candidates
    const cardiaState = {
        reserveRatioPercent: 35,
        minReserveRatioPercent: 20,
        portfolioDrawdownPct: 5,
        volatilityRegime: "low" as const,
        liquidityStress: false
    };
    const cardiaCandidates = [{
        id: `candidate-${lead.daoId}`,
        protocolId: lead.daoId,
        heparRiskScore: 100 - lead.heparScore,
        expectedReturnPct: lead.tvl > 1_000_000_000 ? 8 : 12,
        confidence: lead.heparScore / 100,
        requiredCapitalUsd: Math.min(lead.tvl * 0.001, 500000),
        currentAllocationUsd: 0
    }];
    const cardiaGuardrail = buildCardiaAdaptiveSnapshot(cardiaState, cardiaCandidates);
    context.log(`[Cardia] Allocation cap set — net allocation: $${cardiaGuardrail.netAllocationUsd}, blocked: ${cardiaGuardrail.blockedCount}`);

    // ─── Persist the fully enriched lead to Data Rail ─────────────────
    const enrichedContainer = await getContainer("enriched-leads");
    await enrichedContainer.items.upsert({
        ...lead,
        cortexReport,
        synapseRoute,
        voxPackage,
        pneumaDecision,
        cardiaGuardrail,
        enrichedTimestamp: new Date().toISOString(),
        status: "ORGAN_ENRICHED"
    });

    context.log(`[Hepar Lead Scan] Lead ${lead.daoId} fully enriched by all five organs and persisted to Data Rail.`);
}
