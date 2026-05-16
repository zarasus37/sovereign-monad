import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';

export class AutonomousSalesAgent {
    private apiKey?: string;
    private endpoints: Array<{ name?: string; url: string; headers?: Record<string, string> }> = [];

    constructor(apiKey?: string) {
        this.apiKey = apiKey;
        if (!apiKey) {
            console.warn('[AutonomousSalesAgent] No API key provided; running in dry-run mode.');
        }

        const raw = process.env.SALES_AGENT_ENDPOINTS || process.env.SALES_AGENT_ENDPOINT;
        if (raw) {
            try {
                if (process.env.SALES_AGENT_ENDPOINTS) {
                    this.endpoints = JSON.parse(process.env.SALES_AGENT_ENDPOINTS);
                } else {
                    this.endpoints = [{ url: raw, headers: this.buildAuthHeader(apiKey) }];
                }
            } catch (err) {
                console.warn('[AutonomousSalesAgent] Failed to parse SALES_AGENT_ENDPOINTS:', err);
            }
        }
    }

    private buildAuthHeader(apiKey?: string) {
        if (!apiKey) return undefined;
        return { Authorization: `Bearer ${apiKey}` };
    }

    private sanitize(s: any): string {
        if (s === undefined || s === null) return '';
        const str = typeof s === 'string' ? s : JSON.stringify(s);
        const forbidden = ['Cardia', 'Kardia', 'Synapse', 'Pneuma'];
        const re = new RegExp(forbidden.join('|'), 'gi');
        return str.replace(re, '[REDACTED]');
    }

    private composeMessage(manifest: any): string {
        const p = manifest?.tier3ProposalData ?? {};
        const lines: string[] = [];
        lines.push(`Offering: ${this.sanitize(p.productOffering || 'Tier 3 Forensic Audit (NDA)')}`);
        lines.push(`Value: ${this.sanitize(p.valueProposition || '')}`);
        lines.push(`Assurance: ${this.sanitize(p.commercialAssurance || '')}`);
        lines.push(`Evidence: ${this.sanitize(p.technicalEvidence || '')}`);
        lines.push(`Proof: ${this.sanitize(p.proofTerm || '')}`);
        lines.push(`Objective: ${this.sanitize(manifest?.objective || '')}`);
        return lines.filter(Boolean).join('\n');
    }

    public async initiateCampaign(manifest: any): Promise<void> {
        console.log('[AUTONOMOUS SALES AGENT] initiateCampaign', {
            targetProtocol: manifest?.targetProtocol,
            objective: manifest?.objective
        });

        const message = this.composeMessage(manifest);

        if (!this.endpoints || this.endpoints.length === 0) {
            const dryRunDir = process.env.SALES_AGENT_DRY_RUN_DIR || path.join(process.cwd(), 'outreach-dry-run');
            try {
                await fs.promises.mkdir(dryRunDir, { recursive: true });
                const fileName = `${manifest?.targetProtocol || 'unknown'}-${Date.now()}.json`;
                const filePath = path.join(dryRunDir, fileName);
                await fs.promises.writeFile(filePath, JSON.stringify({ manifest, message }, null, 2), 'utf8');
                console.log(`[AUTONOMOUS SALES AGENT] No endpoints configured. Wrote dry-run file: ${filePath}`);
            } catch (err) {
                console.error('[AUTONOMOUS SALES AGENT] Failed to write dry-run file', err);
            }
            return;
        }

        for (const ep of this.endpoints) {
            try {
                const url = ep.url;
                const headers = Object.assign({ 'Content-Type': 'application/json' }, ep.headers || {});
                let body: any;
                if (url.includes('discord.com/api/webhooks')) {
                    body = { content: message };
                } else {
                    body = { manifest, message };
                }

                const res = await fetch(url, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(body),
                    timeout: 10000
                } as any);

                if (!res.ok) {
                    const text = await res.text();
                    console.warn('[AUTONOMOUS SALES AGENT] Non-OK response', url, res.status, text);
                } else {
                    console.log('[AUTONOMOUS SALES AGENT] Dispatched to', url, 'status', res.status);
                }
            } catch (err) {
                console.error('[AUTONOMOUS SALES AGENT] Failed to dispatch to', ep.url, err);
            }
        }
    }
}
