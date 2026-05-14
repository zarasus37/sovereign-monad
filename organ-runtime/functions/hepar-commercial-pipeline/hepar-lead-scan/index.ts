import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getContainer } from "./cosmos-config";
import { enrichLeadWithOrgans } from "./organ-integration";
import { fetchLiveLeads, RawLead } from "./data-sources";
import { trackEvent, trackMetric, trackException, flushTelemetry } from "../shared/telemetry";

// ====================== HEPAR v2.0 DIAGNOSTIC CONSTANTS ======================
const QUALIFYING_THRESHOLD = 50;   // Production value restored
const DEDUP_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

const azureFunction: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log(`[${new Date().toISOString()}] [Hepar Lead Scan] Starting Lead Identification Engine (Hepar v2.0 — LIVE DATA)...`);
    trackEvent("hepar.lead-scan.started");

    const container = await getContainer("leads");

    // ── Fetch LIVE data from DefiLlama, Tally, and Snapshot ──
    let rawLeads: RawLead[];
    try {
        rawLeads = await fetchLiveLeads(context);
        trackMetric("hepar.leads.raw_fetched", rawLeads.length);
    } catch (err: any) {
        context.log.error(`[Hepar Lead Scan] FATAL: Could not fetch live data — ${err.message}`);
        trackException(err);
        await flushTelemetry();
        context.res = { status: 500, body: `Live data fetch failed: ${err.message}` };
        return;
    }

    if (rawLeads.length === 0) {
        context.log(`[Hepar Lead Scan] No live leads returned from any API. Exiting.`);
        trackEvent("hepar.lead-scan.empty");
        await flushTelemetry();
        context.res = { status: 200, body: "No leads found from live sources." };
        return;
    }

    // TEMPORARILY DISABLED DEDUPLICATION FOR TESTING
    // (remove this block after we confirm the full pipeline works)
    let existingIds = new Set<string>(); // empty = no dedup

    let leadsWritten = 0;
    let leadsSkipped = 0;
    let leadsEnriched = 0;

    for (const raw of rawLeads) {
        // Dedup check
        if (existingIds.has(raw.daoId)) {
            leadsSkipped++;
            continue;
        }

        const score = calculateLeadScore(raw);
        const passesThreshold = score >= QUALIFYING_THRESHOLD;

        context.log(`[Hepar Lead Scan] Evaluating: "${raw.protocolName}" [${raw.source}] | Score: ${score.toFixed(2)} | ${passesThreshold ? '✅ PASS' : '❌ FAIL'}`);

        if (passesThreshold) {
            const lead = {
                id: `lead-${raw.daoId}-${Date.now()}`,
                daoId: raw.daoId,
                protocolName: raw.protocolName,
                tvl: raw.tvl,
                hasActiveProposal: raw.hasActiveProposal,
                recentExploit: raw.recentExploit,
                source: raw.source,
                priority: "HIGH",
                status: "QUALIFIED",
                timestamp: new Date().toISOString(),
                heparScore: score,
                qualifyingThreshold: QUALIFYING_THRESHOLD
            };

            await container.items.create(lead);
            leadsWritten++;
            context.log(`[${new Date().toISOString()}] [Hepar Lead Scan] -> Wrote QUALIFIED lead: ${lead.daoId} [Score: ${score}] [Source: ${raw.source}]`);

            // Organ enrichment pipeline: enrich and persist
            try {
                await enrichLeadWithOrgans(lead, context);
                leadsEnriched++;
            } catch (err: any) {
                context.log.error(`[Hepar Lead Scan] Organ enrichment failed for ${lead.daoId}: ${err.message}`);
                trackException(err, { daoId: lead.daoId });
            }
        }
    }

    context.log(`[${new Date().toISOString()}] [Hepar Lead Scan] Run complete. Written: ${leadsWritten} | Enriched: ${leadsEnriched} | Skipped (dedup): ${leadsSkipped} | Total scanned: ${rawLeads.length}`);

    trackMetric("hepar.leads.qualified", leadsWritten);
    trackMetric("hepar.leads.enriched", leadsEnriched);
    trackMetric("hepar.leads.skipped_dedup", leadsSkipped);
    trackEvent("hepar.lead-scan.completed", {
        written: String(leadsWritten),
        enriched: String(leadsEnriched),
        skipped: String(leadsSkipped)
    });
    await flushTelemetry();

    context.res = { status: 200, body: `Hepar Lead Scan complete. ${leadsWritten} leads written, ${leadsEnriched} enriched.` };
};

function calculateLeadScore(raw: RawLead): number {
    let score = 0;

    // TVL tiers (higher TVL = higher score)
    if (raw.tvl >= 10_000_000_000) score += 80;      // $10B+
    else if (raw.tvl >= 1_000_000_000) score += 60;  // $1B+
    else if (raw.tvl >= 100_000_000) score += 45;    // $100M+
    else if (raw.tvl >= 10_000_000) score += 30;     // $10M+

    // Active governance = strong signal
    if (raw.hasActiveProposal) score += 25;

    // Recent exploit = major red flag (but still score it for visibility)
    if (raw.recentExploit) score += 15;

    // Bonus for major, established protocols (name-based heuristics)
    const name = (raw.protocolName || '').toLowerCase();
    if (name.includes('aave') || name.includes('uniswap') || name.includes('lido') || name.includes('curve')) {
        score += 15;
    }

    return Math.min(100, score);
}


export default azureFunction;
