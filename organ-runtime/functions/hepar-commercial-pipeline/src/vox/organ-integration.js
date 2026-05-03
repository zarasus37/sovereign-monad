"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.triggerVoxVerification = triggerVoxVerification;
const vox_core_1 = require("./vox-core");
const cosmosClient_1 = require("./cosmosClient");
// Integration mockup connecting Vox to Hepar, Cortex, Synapse, Pneuma
async function triggerVoxVerification(mandateId, protocolId, claimsInput, heparCtx, cortexCtx, pneumaCtx, clientNdaConfirmed) {
    console.log(`[Vox] Triggering narrative verification for mandate: ${mandateId}`);
    // Domain 1: Capture
    const narratives = (0, vox_core_1.captureNarratives)(protocolId, claimsInput);
    // Domain 2 & 3: Verify and Detect
    const { verifiedClaims, integrity } = (0, vox_core_1.verifyTruthAndDetectManipulation)(protocolId, narratives, heparCtx, cortexCtx, pneumaCtx);
    // Domain 4: Distribute
    const allFiveOrgansFired = true; // since this function is triggered when all are done
    const dist = (0, vox_core_1.distributeIntelligence)(mandateId, integrity, heparCtx.classification, allFiveOrgansFired, clientNdaConfirmed);
    // Write to Vox containers
    const narrativesContainer = await (0, cosmosClient_1.getVoxContainer)('vox-narratives');
    const integrityContainer = await (0, cosmosClient_1.getVoxContainer)('vox-integrity');
    const distContainer = await (0, cosmosClient_1.getVoxContainer)('vox-distribution');
    for (const c of verifiedClaims) {
        await narrativesContainer.items.upsert(c);
    }
    await integrityContainer.items.upsert(integrity);
    await distContainer.items.upsert(dist);
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
}
