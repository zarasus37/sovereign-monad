import { CosmosClient, Container } from '@azure/cosmos';

const endpoint = process.env.COSMOS_ENDPOINT || "https://localhost:8081";
const key = process.env.COSMOS_KEY || "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";

const client = new CosmosClient({ endpoint, key });
const databaseId = "hepar"; // Use shared database 'hepar'

export async function getCortexContainer(containerId: 'cortex-research' | 'cortex-mandates' | 'cortex-signals'): Promise<Container> {
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    
    let partitionKey = { paths: ["/id"] };
    if (containerId === "cortex-research") partitionKey = { paths: ["/researchId"] };
    if (containerId === "cortex-mandates") partitionKey = { paths: ["/mandateId"] };
    if (containerId === "cortex-signals") partitionKey = { paths: ["/signalType"] };

    const { container } = await database.containers.createIfNotExists({
        id: containerId,
        partitionKey
    });
    
    return container;
}

export async function initCortex() {
    console.log(`[Cortex] Initializing Cosmos DB connections...`);
    await getCortexContainer('cortex-research');
    await getCortexContainer('cortex-mandates');
    await getCortexContainer('cortex-signals');
    console.log(`[Cortex] Cosmos DB live — Containers verified.`);
}
