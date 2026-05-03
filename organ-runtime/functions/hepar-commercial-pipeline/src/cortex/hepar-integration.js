"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleNewHeparAssessment = handleNewHeparAssessment;
const cosmosClient_1 = require("./cosmosClient");
const cortex_core_1 = require("./cortex-core");
const cosmos_1 = require("@azure/cosmos");
const endpoint = process.env.COSMOS_ENDPOINT || "https://localhost:8081";
const key = process.env.COSMOS_KEY || "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";
const client = new cosmos_1.CosmosClient({ endpoint, key });
async function handleNewHeparAssessment(assessment) {
    const researchContainer = await (0, cosmosClient_1.getCortexContainer)('cortex-research');
    // Simulate fetching context from somewhere if needed
    const context = [];
    const synthesis = (0, cortex_core_1.synthesize)(assessment, context);
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
    }
    catch (e) {
        console.error("Failed to update opportunity with cortexSynthesisId", e);
    }
}
