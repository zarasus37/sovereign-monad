import https from "https";

/**
 * Sends a formatted Discord embed notification for a proposal/outreach event.
 * Requires DISCORD_WEBHOOK_URL environment variable.
 */
export async function sendDiscordNotification(record: any): Promise<boolean> {
    const webhookUrl = process.env["DISCORD_WEBHOOK_URL"];
    if (!webhookUrl) {
        return false; // Silently skip if webhook not configured
    }

    const tierEmoji: Record<string, string> = {
        "FULL_ENGAGEMENT": "🟢",
        "STANDARD": "🟡",
        "ADVISORY_ONLY": "🔴"
    };

    const embed = {
        embeds: [{
            title: `${tierEmoji[record.proposalTier] || "⚪"} Hepar Lead: ${record.protocolName}`,
            color: record.proposalTier === "FULL_ENGAGEMENT" ? 0x00ff88
                : record.proposalTier === "ADVISORY_ONLY" ? 0xff4444
                : 0xffaa00,
            fields: [
                { name: "DAO ID", value: record.daoId || "—", inline: true },
                { name: "Priority", value: record.priority || "—", inline: true },
                { name: "Proposal Tier", value: record.proposalTier || "—", inline: true },
                { name: "Channels", value: (record.channels || []).join(", ") || "—", inline: false },
                { name: "Cortex Stress", value: `${record.organSummary?.cortexStressIndex?.toFixed(3) ?? "—"}`, inline: true },
                { name: "Pneuma Fill", value: `${((record.organSummary?.pneumaFillRatio ?? 0) * 100).toFixed(0)}%`, inline: true },
                { name: "Cardia Allocation", value: `$${record.organSummary?.cardiaNetAllocationUsd?.toLocaleString() ?? "0"}`, inline: true },
            ],
            footer: { text: "Hepar Commercial Pipeline — Sovereign Monad" },
            timestamp: new Date().toISOString()
        }]
    };

    return new Promise((resolve) => {
        try {
            const parsed = new URL(webhookUrl);
            const body = JSON.stringify(embed);
            const options = {
                hostname: parsed.hostname,
                port: parsed.port || 443,
                path: parsed.pathname + parsed.search,
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Content-Length": Buffer.byteLength(body)
                }
            };

            const req = https.request(options, (res) => {
                resolve(res.statusCode !== undefined && res.statusCode >= 200 && res.statusCode < 300);
                res.resume(); // drain response
            });

            req.on("error", () => resolve(false));
            req.setTimeout(10000, () => { req.destroy(); resolve(false); });
            req.write(body);
            req.end();
        } catch {
            resolve(false);
        }
    });
}
