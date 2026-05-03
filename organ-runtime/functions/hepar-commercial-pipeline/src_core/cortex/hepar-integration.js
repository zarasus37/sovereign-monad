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
exports.handleNewHeparAssessment = void 0;
const cosmosClient_1 = require("./cosmosClient");
const cortex_core_1 = require("./cortex-core");
const cosmos_1 = require("@azure/cosmos");
const endpoint = process.env.COSMOS_ENDPOINT || "https://localhost:8081";
const key = process.env.COSMOS_KEY || "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";
const client = new cosmos_1.CosmosClient({ endpoint, key });
function handleNewHeparAssessment(assessment) {
    return __awaiter(this, void 0, void 0, function* () {
        const researchContainer = yield (0, cosmosClient_1.getCortexContainer)('cortex-research');
        // Simulate fetching context from somewhere if needed
        const context = [];
        const synthesis = (0, cortex_core_1.synthesize)(assessment, context);
        // Write synthesis output to cortex-research
        yield researchContainer.items.upsert(synthesis);
        console.log(`[Hepar Integration] Cortex synthesis generated for mandate ${assessment.mandateId}`);
        // Update opportunities container
        const { database } = yield client.databases.createIfNotExists({ id: "hepar_commercial" });
        const opportunitiesContainer = database.container("opportunities");
        // Fetch and patch
        try {
            const { resource: opp } = yield opportunitiesContainer.item(assessment.id, assessment.mandateId).read();
            if (opp) {
                opp.cortexSynthesisId = synthesis.id;
                yield opportunitiesContainer.items.upsert(opp);
            }
        }
        catch (e) {
            console.error("Failed to update opportunity with cortexSynthesisId", e);
        }
    });
}
exports.handleNewHeparAssessment = handleNewHeparAssessment;
//# sourceMappingURL=hepar-integration.js.map