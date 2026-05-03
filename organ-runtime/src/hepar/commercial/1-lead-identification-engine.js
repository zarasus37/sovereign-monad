"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runLeadIdentificationEngine = void 0;
const cosmos_config_1 = require("./cosmos-config");
const synapse_core_1 = require("../../synapse/synapse-core");
function runLeadIdentificationEngine() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`[${new Date().toISOString()}] Starting Lead Identification Engine...`);
        const leadsContainer = yield (0, cosmos_config_1.getContainer)("leads");
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
                yield leadsContainer.items.upsert(lead);
                console.log(`[${new Date().toISOString()}] -> Wrote QUALIFIED lead to Cosmos DB: ${lead.daoId} [Priority: ${lead.priority}]`);
            }
        }
        console.log(`[${new Date().toISOString()}] Lead Identification Engine run complete.`);
    });
}
exports.runLeadIdentificationEngine = runLeadIdentificationEngine;
//# sourceMappingURL=1-lead-identification-engine.js.map