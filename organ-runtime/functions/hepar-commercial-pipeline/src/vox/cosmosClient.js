"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVoxContainer = getVoxContainer;
exports.initVox = initVox;
const cosmos_1 = require("@azure/cosmos");
const endpoint = process.env.COSMOS_ENDPOINT || "https://localhost:8081";
const key = process.env.COSMOS_KEY || "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";
const client = new cosmos_1.CosmosClient({ endpoint, key });
const databaseId = "hepar"; // Shared database
async function getVoxContainer(containerId) {
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    let partitionKey = { paths: ["/id"] };
    if (containerId === "vox-narratives")
        partitionKey = { paths: ["/narrativeId"] };
    if (containerId === "vox-integrity")
        partitionKey = { paths: ["/integrityId"] };
    if (containerId === "vox-distribution")
        partitionKey = { paths: ["/distributionId"] };
    const { container } = await database.containers.createIfNotExists({
        id: containerId,
        partitionKey
    });
    return container;
}
async function initVox() {
    console.log(`[Vox] Initializing Cosmos DB connections...`);
    await getVoxContainer('vox-narratives');
    await getVoxContainer('vox-integrity');
    await getVoxContainer('vox-distribution');
    console.log(`[Vox] Cosmos DB live — Containers verified.`);
}
