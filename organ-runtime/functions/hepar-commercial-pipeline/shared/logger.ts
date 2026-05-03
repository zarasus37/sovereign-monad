
import { CosmosClient } from '@azure/cosmos';

const endpoint = process.env.COSMOS_ENDPOINT || "";
const key = process.env.COSMOS_KEY || "";
const client = new CosmosClient({ endpoint, key });
const databaseId = "hepar_commercial";

export async function logExecution(functionName: string, state: 'STARTED' | 'COMPLETED' | 'FAILED', details?: any) {
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    const { container } = await database.containers.createIfNotExists({ id: 'execution-logs', partitionKey: { paths: ["/functionName"] } });
    await container.items.create({
        id: `${functionName}-${Date.now()}`,
        functionName,
        state,
        details,
        timestamp: new Date().toISOString()
    });
}

export async function logFounderReview(reviewType: string, reason: string, context: any) {
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    const { container } = await database.containers.createIfNotExists({ id: 'founder-review', partitionKey: { paths: ["/reviewType"] } });
    await container.items.create({
        id: `review-${Date.now()}`,
        reviewType,
        reason,
        context,
        timestamp: new Date().toISOString()
    });
}
