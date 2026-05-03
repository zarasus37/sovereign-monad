"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContainer = getContainer;
const cosmos_1 = require("@azure/cosmos");
const endpoint = process.env.COSMOS_ENDPOINT || "https://localhost:8081";
const key = process.env.COSMOS_KEY || "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";
const client = new cosmos_1.CosmosClient({ endpoint, key });
const databaseId = "hepar_commercial";
async function getContainer(containerId) {
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    let partitionKey = { paths: ["/id"] };
    if (containerId === "leads") {
        partitionKey = { paths: ["/daoId"] };
    }
    else if (containerId === "opportunities") {
        partitionKey = { paths: ["/mandateId"] };
    }
    else if (containerId === "proposals") {
        partitionKey = { paths: ["/proposalId"] };
    }
    else if (containerId === "outreach") {
        partitionKey = { paths: ["/daoId"] };
    }
    else if (containerId === "clients") {
        partitionKey = { paths: ["/daoId"] };
    }
    const { container } = await database.containers.createIfNotExists({
        id: containerId,
        partitionKey
    });
    return container;
}
