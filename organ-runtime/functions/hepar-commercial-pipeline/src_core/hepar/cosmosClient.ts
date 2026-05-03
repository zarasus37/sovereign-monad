import * as path from 'path';
import * as dotenv from 'dotenv';
import { CosmosClient, Database, Container } from '@azure/cosmos';

// Load .env from the package root regardless of where this file is compiled to
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const endpoint = process.env.COSMOS_ENDPOINT;
const key      = process.env.COSMOS_KEY;
const dbName   = process.env.COSMOS_DB_NAME                       ?? 'hepar';
const cOpportunities = process.env.COSMOS_CONTAINER_OPPORTUNITIES ?? 'opportunities';
const cMandates      = process.env.COSMOS_CONTAINER_MANDATES      ?? 'mandates';
const cSignals       = process.env.COSMOS_CONTAINER_SIGNALS       ?? 'hepar-signals';

if (!endpoint || !key) {
  throw new Error(
    '[hepar/cosmosClient] COSMOS_ENDPOINT and COSMOS_KEY must be present in environment. ' +
    'Copy .env.example to .env and fill in your Azure Cosmos DB credentials.',
  );
}

export const client = new CosmosClient({ endpoint, key });

export interface CosmosRefs {
  database:      Database;
  opportunities: Container;
  mandates:      Container;
  signals:       Container;
}

/**
 * Creates the hepar database (with shared 400 RU/s throughput) and all three
 * containers if they do not already exist.  Containers share the database-level
 * throughput pool, keeping total account RU/s well within budget.
 */
export async function initCosmos(): Promise<CosmosRefs> {
  // Provision throughput at the database level so containers share the pool.
  // createIfNotExists is idempotent — safe to call on every start-up.
  const { database } = await client.databases.createIfNotExists({
    id: dbName,
    throughput: 400,   // shared RU/s — containers below inherit this, no per-container cost
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

  console.log(
    `[hepar/cosmosClient] Connected — db="${dbName}" ` +
    `containers=["${cOpportunities}", "${cMandates}", "${cSignals}"]`,
  );

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
        await client.database(dbName).delete();
        console.log(`[hepar/cosmosClient] Database "${dbName}" deleted.`);
      } catch {
        console.log(`[hepar/cosmosClient] Database "${dbName}" did not exist — proceeding.`);
      }
    }

    await initCosmos();
    console.log('[hepar/cosmosClient] Verification complete — all containers ready.');
    process.exit(0);
  })().catch((err: unknown) => {
    console.error('[hepar/cosmosClient] Initialisation failed:', err);
    process.exit(1);
  });
}
