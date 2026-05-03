import { getCortexContainer } from './cosmosClient';
import { synthesize, HeparAssessment } from './cortex-core';
import { CosmosClient } from '@azure/cosmos';

const endpoint = process.env.COSMOS_ENDPOINT || "https://localhost:8081";
const key = process.env.COSMOS_KEY || "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";
const client = new CosmosClient({ endpoint, key });

export async function handleNewHeparAssessment(assessment: HeparAssessment) {
    const researchContainer = await getCortexContainer('cortex-research');
    
    // Simulate fetching context from somewhere if needed
    const context: HeparAssessment[] = []; 
    
    const synthesis = synthesize(assessment, context);
    
    // Write synthesis output to cortex-research
    await researchContainer.items.upsert(synthesis);
    console.log(`[Hepar Integration] Cortex synthesis generated for mandate ${assessment.mandateId}`);

    // Update opportunities container
    const { database } = await client.databases.createIfNotExists({ id: "hepar_commercial" });
    const opportunitiesContainer = database.container("opportunities");
    
    // Fetch and patch
    try {
        const { resource: opp } = await opportunitiesContainer.item(assessment.id, assessment.mandateId).read();
        if (opp) {
            opp.cortexSynthesisId = synthesis.id;
            await opportunitiesContainer.items.upsert(opp);
        }
    } catch (e) {
        console.error("Failed to update opportunity with cortexSynthesisId", e);
    }
}
