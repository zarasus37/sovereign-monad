import { CosmosClient, Container } from '@azure/cosmos';

const endpoint = process.env.COSMOS_ENDPOINT || "https://localhost:8081";
const key = process.env.COSMOS_KEY || "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";

const client = new CosmosClient({ endpoint, key });
const databaseId = "hepar"; // Shared database

export async function getPneumaContainer(containerId: 'pneuma-market' | 'pneuma-execution' | 'pneuma-regime'): Promise<Container> {
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    
    let partitionKey = { paths: ["/id"] };
    if (containerId === "pneuma-market") partitionKey = { paths: ["/marketId"] };
    if (containerId === "pneuma-execution") partitionKey = { paths: ["/executionId"] };
    if (containerId === "pneuma-regime") partitionKey = { paths: ["/regimeId"] };

    const { container } = await database.containers.createIfNotExists({
        id: containerId,
        partitionKey
    });
    
    return container;
}

export async function initPneuma() {
    console.log(`[Pneuma] Initializing Cosmos DB connections...`);
    await getPneumaContainer('pneuma-market');
    await getPneumaContainer('pneuma-execution');
    await getPneumaContainer('pneuma-regime');
    console.log(`[Pneuma] Cosmos DB live — Containers verified.`);
}
