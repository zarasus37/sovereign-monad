import https from "https";
import http from "http";

/**
 * Normalized lead shape matching what calculateLeadScore() expects.
 */
export interface RawLead {
    daoId: string;
    protocolName: string;
    tvl: number;
    hasActiveProposal: boolean;
    recentExploit: boolean;
    source: string;
}

// ─── HTTP helper (no external deps) ──────────────────────────────────────────

function httpGet(url: string, headers?: Record<string, string>): Promise<string> {
    return new Promise((resolve, reject) => {
        const mod = url.startsWith("https") ? https : http;
        const req = mod.get(url, { headers: headers || {} }, (res) => {
            if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                httpGet(res.headers.location, headers).then(resolve).catch(reject);
                return;
            }
            let data = "";
            res.on("data", (chunk: string) => { data += chunk; });
            res.on("end", () => resolve(data));
            res.on("error", reject);
        });
        req.on("error", reject);
        req.setTimeout(15000, () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
    });
}

function httpPost(url: string, body: string, headers?: Record<string, string>): Promise<string> {
    return new Promise((resolve, reject) => {
        const parsed = new URL(url);
        const mod = parsed.protocol === "https:" ? https : http;
        const options = {
            hostname: parsed.hostname,
            port: parsed.port,
            path: parsed.pathname + parsed.search,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(body),
                ...(headers || {})
            }
        };
        const req = mod.request(options, (res) => {
            let data = "";
            res.on("data", (chunk: string) => { data += chunk; });
            res.on("end", () => resolve(data));
            res.on("error", reject);
        });
        req.on("error", reject);
        req.setTimeout(15000, () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
        req.write(body);
        req.end();
    });
}

async function withRetry<T>(fn: () => Promise<T>, label: string, attempts = 3): Promise<T | null> {
    for (let i = 0; i < attempts; i++) {
        try {
            return await fn();
        } catch (err: any) {
            const delay = Math.pow(2, i) * 1000;
            if (i < attempts - 1) {
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }
    return null;
}

// ─── DefiLlama ───────────────────────────────────────────────────────────────

const DEFILLAMA_URL = "https://api.llama.fi/protocols";
const MIN_TVL = 500_000; // $500k minimum TVL

async function fetchDefiLlamaProtocols(): Promise<RawLead[]> {
    const raw = await withRetry(() => httpGet(DEFILLAMA_URL), "DefiLlama");
    if (!raw) return [];

    const protocols: any[] = JSON.parse(raw);
    return protocols
        .filter((p: any) => p.tvl && p.tvl >= MIN_TVL)
        .slice(0, 50) // Cap at 50 per scan to stay within rate/resource limits
        .map((p: any) => ({
            daoId: p.slug || p.name?.toLowerCase().replace(/\s+/g, "-") || "unknown",
            protocolName: p.name || "Unknown Protocol",
            tvl: p.tvl || 0,
            hasActiveProposal: false, // DefiLlama doesn't track proposals
            recentExploit: Array.isArray(p.hacks) && p.hacks.length > 0,
            source: "defillama"
        }));
}

// ─── Tally (DAOs with active proposals) ──────────────────────────────────────

const TALLY_URL = "https://api.tally.xyz/query";

const TALLY_QUERY = `
  query {
    governors(sort: { field: TOTAL_PROPOSALS, order: DESC }, pagination: { limit: 30 }) {
      id
      name
      slug
      proposalStats { total active }
      tokens { marketCap }
    }
  }
`;

async function fetchTallyDAOs(): Promise<RawLead[]> {
    const raw = await withRetry(
        () => httpPost(TALLY_URL, JSON.stringify({ query: TALLY_QUERY }), {
            "Api-Key": process.env["TALLY_API_KEY"] || ""
        }),
        "Tally"
    );
    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw);
        const governors = parsed?.data?.governors || [];
        return governors
            .filter((g: any) => g.proposalStats?.total > 0)
            .map((g: any) => ({
                daoId: g.slug || g.id || "unknown",
                protocolName: g.name || "Unknown DAO",
                tvl: g.tokens?.[0]?.marketCap || 0,
                hasActiveProposal: (g.proposalStats?.active || 0) > 0,
                recentExploit: false,
                source: "tally"
            }));
    } catch {
        return [];
    }
}

// ─── Snapshot (spaces with recent proposals) ─────────────────────────────────

const SNAPSHOT_URL = "https://hub.snapshot.org/graphql";

const SNAPSHOT_QUERY = `
  query {
    spaces(first: 30, skip: 0, orderBy: "followers", orderDirection: desc, where: { minScore_gte: 1 }) {
      id
      name
      followers
      proposalsCount
      activeProposals
    }
  }
`;

async function fetchSnapshotSpaces(): Promise<RawLead[]> {
    const raw = await withRetry(
        () => httpPost(SNAPSHOT_URL, JSON.stringify({ query: SNAPSHOT_QUERY })),
        "Snapshot"
    );
    if (!raw) return [];

    try {
        const parsed = JSON.parse(raw);
        const spaces = parsed?.data?.spaces || [];
        return spaces
            .filter((s: any) => s.proposalsCount > 0)
            .map((s: any) => ({
                daoId: s.id || "unknown",
                protocolName: s.name || "Unknown Space",
                tvl: 0, // Snapshot doesn't track TVL
                hasActiveProposal: (s.activeProposals || 0) > 0,
                recentExploit: false,
                source: "snapshot"
            }));
    } catch {
        return [];
    }
}

// ─── Unified fetcher with deduplication ──────────────────────────────────────

export async function fetchLiveLeads(context: any): Promise<RawLead[]> {
    context.log("[Hepar Lead Scan] Fetching live data from DefiLlama, Tally, and Snapshot...");

    const [defiLlama, tally, snapshot] = await Promise.all([
        fetchDefiLlamaProtocols(),
        fetchTallyDAOs(),
        fetchSnapshotSpaces()
    ]);

    context.log(`[Hepar Lead Scan] Raw sources — DefiLlama: ${defiLlama.length}, Tally: ${tally.length}, Snapshot: ${snapshot.length}`);

    // Merge all sources
    const all = [...defiLlama, ...tally, ...snapshot];

    // Deduplicate by daoId (prefer DefiLlama > Tally > Snapshot for TVL data)
    const seen = new Map<string, RawLead>();
    for (const lead of all) {
        const key = lead.daoId.toLowerCase();
        const existing = seen.get(key);
        if (!existing || lead.tvl > existing.tvl) {
            // Merge proposal status across sources
            if (existing) {
                lead.hasActiveProposal = lead.hasActiveProposal || existing.hasActiveProposal;
                lead.recentExploit = lead.recentExploit || existing.recentExploit;
                lead.tvl = Math.max(lead.tvl, existing.tvl);
            }
            seen.set(key, lead);
        }
    }

    const deduplicated = Array.from(seen.values());
    context.log(`[Hepar Lead Scan] After deduplication: ${deduplicated.length} unique leads`);

    return deduplicated;
}
