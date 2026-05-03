'use strict';
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
Object.defineProperty(exports, "__esModule", { value: true });
// organ-runtime/src/hepar/cosmosUpdateBatch01.ts
// CAL-006 pre-condition 3: retroactively annotate all Batch 1 Cosmos DB
// documents with protocol_context_confirmed: false on stub-template-driven
// findings. Does NOT alter any classification, score, or actionBand.
//
// Run with:
//   cd organ-runtime && npx ts-node src/hepar/cosmosUpdateBatch01.ts
const path = __importStar(require("path"));
const dotenv = __importStar(require("dotenv"));
const cosmosClient_1 = require("./cosmosClient");
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
function isStubTemplateVectorId(vectorId) {
    return STUB_TEMPLATE_RE.test(vectorId);
}
function main() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        console.log('[cosmosUpdateBatch01] Connecting to Cosmos DB…');
        const cosmosRefs = yield (0, cosmosClient_1.initCosmos)();
        // Cross-partition query for all FULL_PIPELINE documents
        console.log('[cosmosUpdateBatch01] Querying opportunities container…');
        const { resources } = yield cosmosRefs.opportunities.items
            .query('SELECT * FROM c WHERE c.stage = "FULL_PIPELINE"')
            .fetchAll();
        console.log(`[cosmosUpdateBatch01] Found ${resources.length} FULL_PIPELINE document(s).`);
        const batch1Docs = resources.filter(d => BATCH1_PROTOCOLS.has(d.protocolName));
        console.log(`[cosmosUpdateBatch01] ${batch1Docs.length} document(s) match Batch 1 protocols.`);
        let totalAnnotated = 0;
        for (const doc of batch1Docs) {
            const findings = (_a = doc.findings) !== null && _a !== void 0 ? _a : [];
            let stubCount = 0;
            const updatedFindings = findings.map(f => {
                if (isStubTemplateVectorId(f.vectorId)) {
                    stubCount++;
                    return Object.assign(Object.assign({}, f), { protocol_context_confirmed: false });
                }
                return f;
            });
            const patchedDoc = Object.assign(Object.assign({}, doc), { findings: updatedFindings, cal006_patch: {
                    applied_at: new Date().toISOString(),
                    stub_findings_annotated: stubCount,
                    policy: 'CAL-006 pre-condition 3: stub-template-driven findings annotated with ' +
                        'protocol_context_confirmed=false. No classification or score changed. ' +
                        'Forward policy only.',
                } });
            yield cosmosRefs.opportunities.items.upsert(patchedDoc);
            totalAnnotated += stubCount;
            console.log(`[cosmosUpdateBatch01]  ${doc.protocolName.padEnd(20)} ` +
                `stub findings annotated: ${stubCount} ` +
                `(${updatedFindings.map(f => f.vectorId).join(', ')})`);
        }
        console.log(`\n[cosmosUpdateBatch01] Patch complete.`);
        console.log(`  Documents patched : ${batch1Docs.length}`);
        console.log(`  Findings annotated: ${totalAnnotated}`);
        console.log(`  Field added       : protocol_context_confirmed = false`);
        console.log(`  Classification    : UNCHANGED (forward policy only)`);
    });
}
main().catch((err) => {
    console.error('[cosmosUpdateBatch01] Fatal error:', err);
    process.exit(1);
});
//# sourceMappingURL=cosmosUpdateBatch01.js.map