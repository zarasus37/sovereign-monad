"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPneumaContainer = getPneumaContainer;
exports.initPneuma = initPneuma;
const cosmos_1 = require("@azure/cosmos");
const endpoint = process.env.COSMOS_ENDPOINT || "https://localhost:8081";
const key = process.env.COSMOS_KEY || "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";
const client = new cosmos_1.CosmosClient({ endpoint, key });
const databaseId = "hepar"; // Shared database
async function getPneumaContainer(containerId) {
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    let partitionKey = { paths: ["/id"] };
    if (containerId === "pneuma-market")
        partitionKey = { paths: ["/marketId"] };
    if (containerId === "pneuma-execution")
        partitionKey = { paths: ["/executionId"] };
    if (containerId === "pneuma-regime")
        partitionKey = { paths: ["/regimeId"] };
    const { container } = await database.containers.createIfNotExists({
        id: containerId,
        partitionKey
    });
    return container;
}
async function initPneuma() {
    console.log(`[Pneuma] Initializing Cosmos DB connections...`);
    await getPneumaContainer('pneuma-market');
    await getPneumaContainer('pneuma-execution');
    await getPneumaContainer('pneuma-regime');
    console.log(`[Pneuma] Cosmos DB live — Containers verified.`);
}
