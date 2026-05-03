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
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.client = void 0;
exports.initCosmos = initCosmos;
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
const cosmos_1 = require("@azure/cosmos");
// Load .env from the package root regardless of where this file is compiled to
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;
const dbName = process.env.COSMOS_DB_NAME ?? 'hepar';
const cOpportunities = process.env.COSMOS_CONTAINER_OPPORTUNITIES ?? 'opportunities';
const cMandates = process.env.COSMOS_CONTAINER_MANDATES ?? 'mandates';
const cSignals = process.env.COSMOS_CONTAINER_SIGNALS ?? 'hepar-signals';
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
async function initCosmos() {
    // Provision throughput at the database level so containers share the pool.
    // createIfNotExists is idempotent — safe to call on every start-up.
    const { database } = await exports.client.databases.createIfNotExists({
        id: dbName,
        throughput: 400, // shared RU/s — containers below inherit this, no per-container cost
    });
    const { container: opportunities } = await database.containers.createIfNotExists({
        id: cOpportunities,
        partitionKey: { paths: ['/mandateId'] },
    });
    const { container: mandates } = await database.containers.createIfNotExists({
        id: cMandates,
        partitionKey: { paths: ['/mandateId'] },
    });
    const { container: signals } = await database.containers.createIfNotExists({
        id: cSignals,
        partitionKey: { paths: ['/signalType'] },
    });
    console.log(`[hepar/cosmosClient] Connected — db="${dbName}" ` +
        `containers=["${cOpportunities}", "${cMandates}", "${cSignals}"]`);
    return { database, opportunities, mandates, signals };
}
// ---------------------------------------------------------------------------
// Run directly for connection verification:
//   npx ts-node src/hepar/cosmosClient.ts           (create if not exists)
//   npx ts-node src/hepar/cosmosClient.ts --clean   (drop + recreate fresh)
// ---------------------------------------------------------------------------
if (require.main === module) {
    (async () => {
        const clean = process.argv.includes('--clean');
        if (clean) {
            console.log(`[hepar/cosmosClient] --clean flag set: dropping database "${dbName}" …`);
            try {
                await exports.client.database(dbName).delete();
                console.log(`[hepar/cosmosClient] Database "${dbName}" deleted.`);
            }
            catch {
                console.log(`[hepar/cosmosClient] Database "${dbName}" did not exist — proceeding.`);
            }
        }
        await initCosmos();
        console.log('[hepar/cosmosClient] Verification complete — all containers ready.');
        process.exit(0);
    })().catch((err) => {
        console.error('[hepar/cosmosClient] Initialisation failed:', err);
        process.exit(1);
    });
}
