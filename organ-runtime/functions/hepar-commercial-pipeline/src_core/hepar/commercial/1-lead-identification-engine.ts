import { getContainer } from './cosmos-config';
import { classifySignal } from '../../synapse/synapse-core';

interface Lead {
    id: string; // Internal id
    daoId: string;
    protocolName: string;
    tvl: number;
    hasActiveProposal: boolean;
    recentExploit: boolean;
    priority: 'URGENT' | 'IMMEDIATE' | 'HIGH' | 'NONE';
    status: 'QUALIFIED' | 'DISQUALIFIED';
    timestamp: string;
    synapseUrgency: 'IMMEDIATE' | 'STANDARD' | 'LONGITUDINAL' | 'HOLD';
}

export async function runLeadIdentificationEngine() {
    console.log(`[${new Date().toISOString()}] Starting Lead Identification Engine...`);
    const leadsContainer = await getContainer("leads");

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
        let priority: Lead['priority'] = 'NONE';
        
        const description = (raw.recentExploit ? "exploit " : "") + (raw.hasActiveProposal ? "governance " : "") + "lead data";
        const synapseSignal = classifySignal({
            id: `sig-${raw.daoId}`,
            protocolName: raw.protocolName,
            description,
            confidence: 0.9,
            capitalSeverity: raw.tvl > 1000000 ? 5 : 1
        });

        // Score each lead
        if (synapseSignal.urgency === 'IMMEDIATE') {
            priority = raw.recentExploit ? 'URGENT' : 'IMMEDIATE';
        } else if (raw.tvl > 1000000) {
            priority = 'HIGH';
        }

        const isQualified = priority !== 'NONE';
        
        if (isQualified) {
            const lead: Lead = {
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
