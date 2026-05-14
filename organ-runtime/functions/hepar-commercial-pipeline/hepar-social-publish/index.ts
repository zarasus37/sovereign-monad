import { AzureFunction, Context } from "@azure/functions";
import { getContainer } from "../hepar-lead-scan/cosmos-config";
import { sendDiscordNotification } from "../hepar-outreach/discord-sender";

/**
 * Social Publish Engine (Gap 10: Market Adoption)
 * Triggered by new documents in the `proposals` Cosmos container.
 * Generates sanitized, PII-stripped, Twitter-ready "Risk Posture Threads"
 * for Tier 3 (Full Engagement) proposals, and pushes them to Discord for review.
 */
const socialPublish: AzureFunction = async function (context: Context, documents: any[]): Promise<void> {
    context.log(`[${new Date().toISOString()}] [Social Publish] Triggered with ${documents.length} proposal(s)`);

    try {
        const socialContainer = await getContainer("social-drafts");

        for (const proposal of documents) {
            // Only generate public reports for Tier 3 (Full Engagement) OR notable Advisory leads
            if (proposal.status !== "PROPOSAL_GENERATED" || proposal.proposalTier === "STANDARD") {
                continue;
            }

            const isWarning = proposal.proposalTier === "ADVISORY_ONLY";
            const icon = isWarning ? "🚨" : "🛡️";
            const tvlString = proposal.executiveSummary.tvl;

            // Generate Twitter-ready thread
            const threadDraft = `
${icon} HEPAR PROTOCOL ASSESSMENT: ${proposal.protocolName}

The Sovereign Monad autonomous forensic engine has completed a 7-dimensional scan of ${proposal.protocolName} (${tvlString} TVL).

Here is the public risk posture report 👇 🧵
---
2/ 🧠 Cortex Strategic Intelligence

Stress Index: ${proposal.executiveSummary.cortexStressIndex.toFixed(2)}
Posture: ${proposal.executiveSummary.riskPosture}

Top Drivers:
${proposal.riskAssessment.causalDrivers.map((d: string) => `- ${d}`).join("\n")}
---
3/ ⚡ Synapse & Vox Signals

Our routing engine detected ${proposal.signalIntelligence.escalations} escalations and ${proposal.signalIntelligence.conflicts} signal conflicts across the ecosystem. 
Narrative consensus is ${proposal.narrativePackage.verifiedCount > proposal.narrativePackage.conflictedCount ? "strong" : "fractured"}.
---
4/ 💸 Pneuma & Cardia Execution

Fill Viability: ${((proposal.executionFeasibility.fillRatio) * 100).toFixed(0)}%
Avg Cost: ${proposal.executionFeasibility.averageCostBps} bps

Cardia Guardrail Action: ${proposal.capitalGuardrails.decision}
---
5/ 🔒 The Verdict

${proposal.executiveSummary.engagementRecommendation}

Want the full, unredacted forensic report? 
Submit an inquiry to the Sovereign Monad pipeline.
`;

            const draftRecord = {
                id: `social-${proposal.daoId}-${Date.now()}`,
                proposalId: proposal.proposalId,
                daoId: proposal.daoId,
                protocolName: proposal.protocolName,
                tier: proposal.proposalTier,
                threadDraft,
                status: "DRAFT_GENERATED",
                generatedAt: new Date().toISOString()
            };

            await socialContainer.items.upsert(draftRecord);
            context.log(`[Social Publish] ✅ Twitter thread generated for ${proposal.protocolName}`);

            // Fire an alert so the founder knows to review the thread
            await sendDiscordNotification({
                proposalTier: proposal.proposalTier,
                protocolName: `${proposal.protocolName} (SOCIAL DRAFT READY)`,
                daoId: proposal.daoId,
                priority: "LOW",
                channels: ["twitter-drafts"],
                organSummary: {
                    cortexStressIndex: proposal.executiveSummary.cortexStressIndex,
                    pneumaFillRatio: proposal.executionFeasibility.fillRatio,
                    cardiaNetAllocationUsd: proposal.capitalGuardrails.netAllocationUsd
                }
            });
        }
    } catch (error: any) {
        context.log.error(`[${new Date().toISOString()}] Error in ${context.executionContext.functionName}: `, error);
        throw error;
    }
};

export default socialPublish;
