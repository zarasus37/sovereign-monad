"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runLeadIdentificationEngine = runLeadIdentificationEngine;
const cosmos_config_1 = require("./cosmos-config");
const synapse_core_1 = require("../../synapse/synapse-core");
async function runLeadIdentificationEngine() {
    console.log(`[${new Date().toISOString()}] Starting Lead Identification Engine...`);
    const leadsContainer = await (0, cosmos_config_1.getContainer)("leads");
    // Mock API integrations
    console.log("-> Fetching data from DefiLlama API (TVL, category, recent activity)...");
    console.log("-> Fetching data from Tally API (on-chain governance)...");
    console.log("-> Fetching data from Snapshot API (off-chain governance)...");
    // Simulated gathered data
    const rawLeads = [
        {
            daoId: 'aave.eth',
            protocolName: 'Aave V4 Deployment',
            tvl: 5000000000,
            hasActiveProposal: true,
            recentExploit: false
        },
        {
            daoId: 'euler.eth',
            protocolName: 'Euler V2',
            tvl: 800000,
            hasActiveProposal: false,
            recentExploit: true
        },
        {
            daoId: 'uniswap.eth',
            protocolName: 'Uniswap V4 Hooks',
            tvl: 3000000000,
            hasActiveProposal: false,
            recentExploit: false
        }
    ];
    for (const raw of rawLeads) {
        let priority = 'NONE';
        const description = (raw.recentExploit ? "exploit " : "") + (raw.hasActiveProposal ? "governance " : "") + "lead data";
        const synapseSignal = (0, synapse_core_1.classifySignal)({
            id: `sig-${raw.daoId}`,
            protocolName: raw.protocolName,
            description,
            confidence: 0.9,
            capitalSeverity: raw.tvl > 1000000 ? 5 : 1
        });
        // Score each lead
        if (synapseSignal.urgency === 'IMMEDIATE') {
            priority = raw.recentExploit ? 'URGENT' : 'IMMEDIATE';
        }
        else if (raw.tvl > 1000000) {
            priority = 'HIGH';
        }
        const isQualified = priority !== 'NONE';
        if (isQualified) {
            const lead = {
                id: `lead-${raw.daoId}-${Date.now()}`,
                daoId: raw.daoId,
                protocolName: raw.protocolName,
                tvl: raw.tvl,
                hasActiveProposal: raw.hasActiveProposal,
                recentExploit: raw.recentExploit,
                priority,
                status: 'QUALIFIED',
                timestamp: new Date().toISOString(),
                synapseUrgency: synapseSignal.urgency
            };
            await leadsContainer.items.upsert(lead);
            console.log(`[${new Date().toISOString()}] -> Wrote QUALIFIED lead to Cosmos DB: ${lead.daoId} [Priority: ${lead.priority}]`);
        }
    }
    console.log(`[${new Date().toISOString()}] Lead Identification Engine run complete.`);
}
