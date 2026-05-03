import { CosmosClient, Container } from '@azure/cosmos';

const endpoint = process.env.COSMOS_ENDPOINT || "https://localhost:8081";
const key = process.env.COSMOS_KEY || "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";

const client = new CosmosClient({ endpoint, key });
const databaseId = process.env.COSMOS_DB_NAME || "hepar";

export async function getContainer(containerId: string): Promise<Container> {
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    
    let partitionKey = { paths: ["/id"] };
    if (containerId === "leads") {
        partitionKey = { paths: ["/daoId"] };
    } else if (containerId === "opportunities") {
        partitionKey = { paths: ["/mandateId"] };
    } else if (containerId === "proposals") {
        partitionKey = { paths: ["/proposalId"] };
    } else if (containerId === "outreach") {
        partitionKey = { paths: ["/daoId"] };
    } else if (containerId === "clients") {
        partitionKey = { paths: ["/daoId"] };
    }

    const { container } = await database.containers.createIfNotExists({
        id: containerId,
        partitionKey
    });
    
    return container;
}
