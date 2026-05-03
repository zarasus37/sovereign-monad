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
exports.initPneuma = exports.getPneumaContainer = void 0;
const cosmos_1 = require("@azure/cosmos");
const endpoint = process.env.COSMOS_ENDPOINT || "https://localhost:8081";
const key = process.env.COSMOS_KEY || "C2y6yDjf5/R+ob0N8A7Cgv30VRDJIWEHLM+4QDU5DE2nQ9nDuVTqobD4b8mGGyPMbIZnqyMsEcaGQy67XIw/Jw==";
const client = new cosmos_1.CosmosClient({ endpoint, key });
const databaseId = "hepar"; // Shared database
function getPneumaContainer(containerId) {
    return __awaiter(this, void 0, void 0, function* () {
        const { database } = yield client.databases.createIfNotExists({ id: databaseId });
        let partitionKey = { paths: ["/id"] };
        if (containerId === "pneuma-market")
            partitionKey = { paths: ["/marketId"] };
        if (containerId === "pneuma-execution")
            partitionKey = { paths: ["/executionId"] };
        if (containerId === "pneuma-regime")
            partitionKey = { paths: ["/regimeId"] };
        const { container } = yield database.containers.createIfNotExists({
            id: containerId,
            partitionKey
        });
        return container;
    });
}
exports.getPneumaContainer = getPneumaContainer;
function initPneuma() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`[Pneuma] Initializing Cosmos DB connections...`);
        yield getPneumaContainer('pneuma-market');
        yield getPneumaContainer('pneuma-execution');
        yield getPneumaContainer('pneuma-regime');
        console.log(`[Pneuma] Cosmos DB live — Containers verified.`);
    });
}
exports.initPneuma = initPneuma;
//# sourceMappingURL=cosmosClient.js.map