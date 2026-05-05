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
exports.getContainer = void 0;
const cosmos_1 = require("@azure/cosmos");
const endpoint = process.env.COSMOS_ENDPOINT || "https://localhost:8081";
const key = process.env.COSMOS_KEY || "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";
const client = new cosmos_1.CosmosClient({ endpoint, key });
const databaseId = process.env.COSMOS_DB_NAME || "hepar";
function getContainer(containerId) {
    return __awaiter(this, void 0, void 0, function* () {
        const { database } = yield client.databases.createIfNotExists({ id: databaseId });
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
        const { container } = yield database.containers.createIfNotExists({
            id: containerId,
            partitionKey
        });
        return container;
    });
}
exports.getContainer = getContainer;
//# sourceMappingURL=cosmos-config.js.map