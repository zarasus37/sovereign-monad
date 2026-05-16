import { CosmosClient } from '@azure/cosmos';
import { AutonomousSalesAgent } from './agents/AutonomousSalesAgent';
import { AttestationPayload } from '../hepar-core/types/hepar.types';

export class SalesPipelineOrchestrator {
    private cosmosClient: CosmosClient;
    private salesAgent: AutonomousSalesAgent;

    constructor() {
        this.cosmosClient = new CosmosClient(process.env.AZURE_COSMOS_CONNECTION_STRING!);
        this.salesAgent = new AutonomousSalesAgent(process.env.SALES_AGENT_API_KEY!);
    }

    /**
     * Executes the Day-Zero Revenue Pipeline loop.
     * Sweeps enriched leads, translates technical state to commercial value, and initiates outreach.
     */
    public async executeOutreachCycle(): Promise<void> {
        console.log('[HEPAR OUTREACH] Initiating Tier 3 Pipeline Sweep...');

        // 1. Fetch leads enriched by the Stage D Consensus Gate (Python MCTS engine output)
        const leads = await this.fetchEnrichedLeads();

        for (const lead of leads) {
            try {
                // 2. Commercial Translation: Strip internal biological jargon
                const commercialProposal = this.translateToCommercialB2B(lead.attestationPayload as AttestationPayload);

                // 3. Construct the Outreach Manifest
                const outreachManifest = {
                    targetProtocol: lead.protocolName,
                    targetContacts: lead.securityLeads,
                    tier3ProposalData: commercialProposal,
                    objective: 'CLOSE_TIER_3_NDA_PILOT',
                    kpiFocus: ['Liability Reduction', 'False-Positive Reduction', 'Verifiable On-Chain Evidence']
                };

                // 4. Hand off to the Autonomous AI Sales Agent
                await this.salesAgent.initiateCampaign(outreachManifest);

                console.log(`[HEPAR OUTREACH] Campaign deployed for ${lead.protocolName}.`);
            } catch (err) {
                console.error('[HEPAR OUTREACH] Failed to deploy campaign for', lead.protocolName, err);
            }
        }
    }

    private translateToCommercialB2B(payload: AttestationPayload): any {
        // STRICT ADHERENCE: Remove any references to internal ecosystem nomenclature
        // (Cardia / Kardia, Synapse, Pneuma) from all outbound commercial text.
        const sanitize = (s: any) => {
            if (s === undefined || s === null) return s;
            if (typeof s !== 'string') return String(s);
            const forbidden = ['Cardia', 'Kardia', 'Synapse', 'Pneuma'];
            const re = new RegExp(forbidden.join('|'), 'gi');
            return s.replace(re, '[REDACTED]');
        };

        return {
            productOffering: 'Tier 3 Forensic Audit (NDA)',
            valueProposition: 'Continuous, multimodal smart-contract assurance that prevents costly exploits before they occur.',
            technicalEvidence: `Bounded symbolic proving and multi-agent adversarial simulation completed. ${payload.agentCoverage ?? 'N/A'}% coverage achieved.`,
            commercialAssurance: 'Reduces developer remediation time and false-positive rates. Cryptographically verifiable on-chain attestation serves as an immutable liability shield for insurers.',
            proofTerm: sanitize(payload.evidence_chain_root)
        };
    }

    private async fetchEnrichedLeads(): Promise<any[]> {
        const db = this.cosmosClient.database('hepar-pipeline');
        const container = db.container('enriched-leads');
        const { resources } = await container.items
            .query("SELECT * FROM c WHERE c.status = 'ATTESTED' AND c.outreach_status = 'PENDING'")
            .fetchAll();
        return resources;
    }
}
