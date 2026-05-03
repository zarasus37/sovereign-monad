import { getContainer } from './cosmos-config';
import { getCortexContainer } from '../../cortex/cosmosClient';

interface Proposal {
    id: string; // Maps to proposalId
    proposalId: string;
    mandateId: string;
    daoId: string;
    markdownContent: string;
    pdfReadyOutputUri: string;
    timestamp: string;
    cortexEnhanced?: boolean;
}

export async function runProposalGenerationEngine() {
    console.log(`[${new Date().toISOString()}] Starting Proposal Generation Engine...`);
    const opportunitiesContainer = await getContainer("opportunities");
    const proposalsContainer = await getContainer("proposals");

    // Fetch opportunities that need proposals generated
    const { resources: opportunities } = await opportunitiesContainer.items.query("SELECT * from c").fetchAll();

    const cortexResearchContainer = await getCortexContainer("cortex-research");

    for (const opp of opportunities) {
        console.log(`[${new Date().toISOString()}] -> Generating tailored proposal document for mandate: ${opp.mandateId}`);

        let cortexEnhanced = false;
        let synthesisSection = "";

        try {
            const { resources: synthesisList } = await cortexResearchContainer.items.query(`SELECT * from c WHERE c.mandateId = '${opp.mandateId}'`).fetchAll();
            if (synthesisList && synthesisList.length > 0) {
                cortexEnhanced = true;
                const synth = synthesisList[0];
                synthesisSection = `
## Cortex Strategic Intelligence
*Institutional-Depth Synthesis*
- **Perception:** ${synth.perception}
- **Integration:** ${synth.integration}
- **Memory & Identity:** ${synth.memory}
- **Executive Control:** ${synth.executive}
`;
            }
        } catch (e) {
            console.error("Error fetching Cortex synthesis:", e);
        }

        // Generate tailored proposal document
        const markdownContent = `
# Hepar Security Assessment Proposal for ${opp.protocolName}

## Context
Based on recent governance activity and treasury size, we have preemptively analyzed ${opp.protocolName}. 

## Findings Summary
Our Hepar pipeline completed Stages A through D on live bytecode (${opp.bytecodeHash}).
**Key Finding:** ${opp.findingsSummary}
${synthesisSection}

## Hepar Accuracy Guarantee Terms
We guarantee our findings with a strict SLA.

## Offerings
- **30-Day Monitoring Window:** Continuous runtime verification of the protocol.
- **Founding Client Program Terms:** Special fee structure for early adopters.

## Next Steps
[Payment Link & NDA Package Attached]
`;

        // Mock PDF Generation
        console.log(`   - Formatting as PDF-ready output...`);
        const pdfReadyOutputUri = `s3://hepar-proposals/${opp.mandateId}.pdf`;

        const proposal: Proposal = {
            id: `prop-${opp.mandateId}`,
            proposalId: `prop-${opp.mandateId}`,
            mandateId: opp.mandateId,
            daoId: opp.daoId,
            markdownContent,
            pdfReadyOutputUri,
            timestamp: new Date().toISOString(),
            cortexEnhanced
        };

        await proposalsContainer.items.upsert(proposal);
        console.log(`[${new Date().toISOString()}] -> Wrote proposal to Cosmos DB [Proposals]: ${proposal.proposalId}`);
    }
    
    console.log(`[${new Date().toISOString()}] Proposal Generation Engine run complete.`);
}
