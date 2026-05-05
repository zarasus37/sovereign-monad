import { CosmosClient } from "@azure/cosmos";

const endpoint = process.env["COSMOS_ENDPOINT"] || "https://localhost:8081/";
const key = process.env["COSMOS_KEY"] || "C2y6yDjf5/R+o0b0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";
const databaseName = process.env["COSMOS_DB_NAME"] || "hepar";

const client = new CosmosClient({ endpoint, key });

export async function getContainer(containerName: string) {
    const database = client.database(databaseName);
    return database.container(containerName);
}