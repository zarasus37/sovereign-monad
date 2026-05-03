'use strict';
// organ-runtime/src/hepar/cosmosUpdateBatch01.ts
// CAL-006 pre-condition 3: retroactively annotate all Batch 1 Cosmos DB
// documents with protocol_context_confirmed: false on stub-template-driven
// findings. Does NOT alter any classification, score, or actionBand.
//
// Run with:
//   cd organ-runtime && npx ts-node src/hepar/cosmosUpdateBatch01.ts

import * as path from 'path';
import * as dotenv from 'dotenv';
import { initCosmos } from './cosmosClient';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Batch 1 protocol names — used to scope the query to only these documents
const BATCH1_PROTOCOLS = new Set([
  'Uniswap V3',
  'Aave V3',
  'Curve Finance',
  'GMX V2',
  'Compound V3',
  'Ekubo Protocol',
]);

// Stub-template vectorId pattern: AGENTID-TEMPLATE_ID-SEED
// e.g. PRIVILEGE-PRIV-T03-24150429, ARITHMETIC-ARITH-T01-31582472
// Forced findings (CURVE-VYPER-REENTRANCY-CLASS, COMPOUND-V3-...) do NOT match.
const STUB_TEMPLATE_RE = /^(PRIVILEGE|ARITHMETIC|REENTRANCY|ECONOMIC|STATE)-[A-Z]+-T\d+-[0-9a-f]+$/;

function isStubTemplateVectorId(vectorId: string): boolean {
  return STUB_TEMPLATE_RE.test(vectorId);
}

interface Batch1Finding {
  vectorId: string;
  severity: number;
  convergenceLabel: string;
  description: string;
  protocol_context_confirmed?: boolean;
}

interface Batch1Doc {
  id: string;
  mandateId: string;
  protocolName: string;
  stage: string;
  classification: string;
  confidence: number;
  findings: Batch1Finding[];
  wildcard: boolean;
  tierLabel: string;
  cal006_patch?: {
    applied_at: string;
    stub_findings_annotated: number;
    policy: string;
  };
  [key: string]: unknown;
}

async function main(): Promise<void> {
  console.log('[cosmosUpdateBatch01] Connecting to Cosmos DB…');
  const cosmosRefs = await initCosmos();

  // Cross-partition query for all FULL_PIPELINE documents
  console.log('[cosmosUpdateBatch01] Querying opportunities container…');
  const { resources } = await cosmosRefs.opportunities.items
    .query<Batch1Doc>('SELECT * FROM c WHERE c.stage = "FULL_PIPELINE"')
    .fetchAll();

  console.log(`[cosmosUpdateBatch01] Found ${resources.length} FULL_PIPELINE document(s).`);

  const batch1Docs = resources.filter(d => BATCH1_PROTOCOLS.has(d.protocolName));
  console.log(`[cosmosUpdateBatch01] ${batch1Docs.length} document(s) match Batch 1 protocols.`);

  let totalAnnotated = 0;

  for (const doc of batch1Docs) {
    const findings: Batch1Finding[] = doc.findings ?? [];
    let stubCount = 0;

    const updatedFindings = findings.map(f => {
      if (isStubTemplateVectorId(f.vectorId)) {
        stubCount++;
        return { ...f, protocol_context_confirmed: false };
      }
      return f;
    });

    const patchedDoc: Batch1Doc = {
      ...doc,
      findings: updatedFindings,
      cal006_patch: {
        applied_at:              new Date().toISOString(),
        stub_findings_annotated: stubCount,
        policy:
          'CAL-006 pre-condition 3: stub-template-driven findings annotated with ' +
          'protocol_context_confirmed=false. No classification or score changed. ' +
          'Forward policy only.',
      },
    };

    await cosmosRefs.opportunities.items.upsert(patchedDoc);
    totalAnnotated += stubCount;

    console.log(
      `[cosmosUpdateBatch01]  ${doc.protocolName.padEnd(20)} ` +
      `stub findings annotated: ${stubCount} ` +
      `(${updatedFindings.map(f => f.vectorId).join(', ')})`,
    );
  }

  console.log(`\n[cosmosUpdateBatch01] Patch complete.`);
  console.log(`  Documents patched : ${batch1Docs.length}`);
  console.log(`  Findings annotated: ${totalAnnotated}`);
  console.log(`  Field added       : protocol_context_confirmed = false`);
  console.log(`  Classification    : UNCHANGED (forward policy only)`);
}

main().catch((err: unknown) => {
  console.error('[cosmosUpdateBatch01] Fatal error:', err);
  process.exit(1);
});
