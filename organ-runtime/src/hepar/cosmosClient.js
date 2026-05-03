"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a, _b, _c, _d;
Object.defineProperty(exports, "__esModule", { value: true });
exports.initCosmos = exports.client = void 0;
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
const cosmos_1 = require("@azure/cosmos");
// Load .env from the package root regardless of where this file is compiled to
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const dbName = (_a = process.env.COSMOS_DB_NAME) !== null && _a !== void 0 ? _a : 'hepar';
const cOpportunities = (_b = process.env.COSMOS_CONTAINER_OPPORTUNITIES) !== null && _b !== void 0 ? _b : 'opportunities';
const cMandates = (_c = process.env.COSMOS_CONTAINER_MANDATES) !== null && _c !== void 0 ? _c : 'mandates';
const cSignals = (_d = process.env.COSMOS_CONTAINER_SIGNALS) !== null && _d !== void 0 ? _d : 'hepar-signals';
if (!endpoint || !key) {
    throw new Error('[hepar/cosmosClient] COSMOS_ENDPOINT and COSMOS_KEY must be present in environment. ' +
        'Copy .env.example to .env and fill in your Azure Cosmos DB credentials.');
}
exports.client = new cosmos_1.CosmosClient({ endpoint, key });
/**
 * Creates the hepar database (with shared 400 RU/s throughput) and all three
 * containers if they do not already exist.  Containers share the database-level
 * throughput pool, keeping total account RU/s well within budget.
 */
function initCosmos() {
    return __awaiter(this, void 0, void 0, function* () {
        // Provision throughput at the database level so containers share the pool.
        // createIfNotExists is idempotent — safe to call on every start-up.
        const { database } = yield exports.client.databases.createIfNotExists({
            id: dbName,
            throughput: 400, // shared RU/s — containers below inherit this, no per-container cost
        });
        const { container: opportunities } = yield database.containers.createIfNotExists({
            id: cOpportunities,
            partitionKey: { paths: ['/mandateId'] },
        });
        const { container: mandates } = yield database.containers.createIfNotExists({
            id: cMandates,
            partitionKey: { paths: ['/mandateId'] },
        });
        const { container: signals } = yield database.containers.createIfNotExists({
            id: cSignals,
            partitionKey: { paths: ['/signalType'] },
        });
        console.log(`[hepar/cosmosClient] Connected — db="${dbName}" ` +
            `containers=["${cOpportunities}", "${cMandates}", "${cSignals}"]`);
        return { database, opportunities, mandates, signals };
    });
}
exports.initCosmos = initCosmos;
// ---------------------------------------------------------------------------
// Run directly for connection verification:
//   npx ts-node src/hepar/cosmosClient.ts           (create if not exists)
//   npx ts-node src/hepar/cosmosClient.ts --clean   (drop + recreate fresh)
// ---------------------------------------------------------------------------
if (require.main === module) {
    (() => __awaiter(void 0, void 0, void 0, function* () {
        const clean = process.argv.includes('--clean');
        if (clean) {
            console.log(`[hepar/cosmosClient] --clean flag set: dropping database "${dbName}" …`);
            try {
                yield exports.client.database(dbName).delete();
                console.log(`[hepar/cosmosClient] Database "${dbName}" deleted.`);
            }
            catch (_e) {
                console.log(`[hepar/cosmosClient] Database "${dbName}" did not exist — proceeding.`);
            }
        }
        yield initCosmos();
        console.log('[hepar/cosmosClient] Verification complete — all containers ready.');
        process.exit(0);
    }))().catch((err) => {
        console.error('[hepar/cosmosClient] Initialisation failed:', err);
        process.exit(1);
    });
}
//# sourceMappingURL=cosmosClient.js.map