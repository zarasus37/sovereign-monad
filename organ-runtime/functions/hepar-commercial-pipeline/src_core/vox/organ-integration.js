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
exports.triggerVoxVerification = void 0;
const vox_core_1 = require("./vox-core");
const cosmosClient_1 = require("./cosmosClient");
// Integration mockup connecting Vox to Hepar, Cortex, Synapse, Pneuma
function triggerVoxVerification(mandateId, protocolId, claimsInput, heparCtx, cortexCtx, pneumaCtx, clientNdaConfirmed) {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`[Vox] Triggering narrative verification for mandate: ${mandateId}`);
        // Domain 1: Capture
        const narratives = (0, vox_core_1.captureNarratives)(protocolId, claimsInput);
        // Domain 2 & 3: Verify and Detect
        const { verifiedClaims, integrity } = (0, vox_core_1.verifyTruthAndDetectManipulation)(protocolId, narratives, heparCtx, cortexCtx, pneumaCtx);
        // Domain 4: Distribute
        const allFiveOrgansFired = true; // since this function is triggered when all are done
        const dist = (0, vox_core_1.distributeIntelligence)(mandateId, integrity, heparCtx.classification, allFiveOrgansFired, clientNdaConfirmed);
        // Write to Vox containers
        const narrativesContainer = yield (0, cosmosClient_1.getVoxContainer)('vox-narratives');
        const integrityContainer = yield (0, cosmosClient_1.getVoxContainer)('vox-integrity');
        const distContainer = yield (0, cosmosClient_1.getVoxContainer)('vox-distribution');
        for (const c of verifiedClaims) {
            yield narrativesContainer.items.upsert(c);
        }
        yield integrityContainer.items.upsert(integrity);
        yield distContainer.items.upsert(dist);
        // Synapse integration
        if (integrity.triggersImmediateSynapse) {
            console.log(`[Synapse Integration] IMMEDIATE signal sent due to HIGH manipulation confidence.`);
        }
        // Pipeline integration hook
        if (dist.tier === 'PUBLIC') {
            console.log(`[Distribution] PUBLIC tier eligible. Written to vox-distribution.`);
        }
        else if (dist.tier === 'NDA') {
            console.log(`[Distribution] NDA tier eligible. Notifying commercial pipeline.`);
        }
        return { narratives, integrity, dist };
    });
}
exports.triggerVoxVerification = triggerVoxVerification;
//# sourceMappingURL=organ-integration.js.map