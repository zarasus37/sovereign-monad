import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getContainer } from "./cosmos-config";   // Now local

// ====================== HEPAR v2.0 DIAGNOSTIC CONSTANTS ======================
const QUALIFYING_THRESHOLD = 25;   // TEMPORARILY lowered 50% for validation only

const azureFunction: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log(`[${new Date().toISOString()}] [Hepar Lead Scan] Starting Lead Identification Engine (Hepar v2.0 commercial pipeline)...`);

    const container = await getContainer("leads");

    const rawLeads = [
        { daoId: 'aave.eth', protocolName: 'Aave V4 Deployment', tvl: 5000000000, hasActiveProposal: true, recentExploit: false },
        { daoId: 'euler.eth', protocolName: 'Euler V2', tvl: 800000, hasActiveProposal: false, recentExploit: true },
        { daoId: 'uniswap.eth', protocolName: 'Uniswap V4 Hooks', tvl: 3000000000, hasActiveProposal: false, recentExploit: false }
    ];

    let leadsWritten = 0;

    for (const raw of rawLeads) {
        const score = calculateLeadScore(raw);
        const passesThreshold = score >= QUALIFYING_THRESHOLD;

        context.log(`[Hepar Lead Scan] Evaluating lead: "${raw.protocolName}" | Score: ${score.toFixed(2)} | Threshold: ${QUALIFYING_THRESHOLD} | ${passesThreshold ? '✅ PASS' : '❌ FAIL'} | Reason: ${passesThreshold ? 'Score met or exceeded threshold' : 'Score below qualifying threshold'}`);

        if (passesThreshold) {
            const lead = {
                id: `lead-${raw.daoId}-${Date.now()}`,
                daoId: raw.daoId,
                protocolName: raw.protocolName,
                tvl: raw.tvl,
                hasActiveProposal: raw.hasActiveProposal,
                recentExploit: raw.recentExploit,
                priority: "HIGH",
                status: "QUALIFIED",
                timestamp: new Date().toISOString(),
                heparScore: score,
                qualifyingThreshold: QUALIFYING_THRESHOLD
            };

            await container.items.create(lead);
            leadsWritten++;
            context.log(`[${new Date().toISOString()}] [Hepar Lead Scan] -> Wrote QUALIFIED lead to Cosmos DB: ${lead.daoId} [Score: ${score}]`);
        }
    }

    context.log(`[${new Date().toISOString()}] [Hepar Lead Scan] Lead Identification Engine run complete. ${leadsWritten} leads written to Cosmos DB.`);

    context.res = { status: 200, body: `Hepar Lead Scan complete. ${leadsWritten} leads written.` };
};

function calculateLeadScore(raw: any): number {
    let score = 0;
    if (raw.tvl > 1000000) score += 40;
    if (raw.hasActiveProposal) score += 30;
    if (raw.recentExploit) score += 20;
    return Math.min(100, score);
}

export default azureFunction;
