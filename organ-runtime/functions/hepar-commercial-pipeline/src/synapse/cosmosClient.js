"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSynapseContainer = getSynapseContainer;
exports.initSynapse = initSynapse;
const cosmos_1 = require("@azure/cosmos");
const endpoint = process.env.COSMOS_ENDPOINT || "https://localhost:8081";
const key = process.env.COSMOS_KEY || "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";
const client = new cosmos_1.CosmosClient({ endpoint, key });
const databaseId = "hepar"; // Shared database
async function getSynapseContainer(containerId) {
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    let partitionKey = { paths: ["/id"] };
    if (containerId === "synapse-signals")
        partitionKey = { paths: ["/signalId"] };
    if (containerId === "synapse-routing")
        partitionKey = { paths: ["/routingId"] };
    if (containerId === "synapse-coordination")
        partitionKey = { paths: ["/coordinationId"] };
    const { container } = await database.containers.createIfNotExists({
        id: containerId,
        partitionKey
    });
    return container;
}
async function initSynapse() {
    console.log(`[Synapse] Initializing Cosmos DB connections...`);
    await getSynapseContainer('synapse-signals');
    await getSynapseContainer('synapse-routing');
    await getSynapseContainer('synapse-coordination');
    console.log(`[Synapse] Cosmos DB live — Containers verified.`);
}
