import { captureNarratives, verifyTruthAndDetectManipulation, distributeIntelligence } from './vox-core';
import { getVoxContainer } from './cosmosClient';

// Integration mockup connecting Vox to Hepar, Cortex, Synapse, Pneuma
export async function triggerVoxVerification(mandateId: string, protocolId: string, claimsInput: any[], heparCtx: any, cortexCtx: any, pneumaCtx: any, clientNdaConfirmed: boolean) {
    console.log(`[Vox] Triggering narrative verification for mandate: ${mandateId}`);
    
    // Domain 1: Capture
    const narratives = captureNarratives(protocolId, claimsInput);
    
    // Domain 2 & 3: Verify and Detect
    const { verifiedClaims, integrity } = verifyTruthAndDetectManipulation(protocolId, narratives, heparCtx, cortexCtx, pneumaCtx);
    
    // Domain 4: Distribute
    const allFiveOrgansFired = true; // since this function is triggered when all are done
    const dist = distributeIntelligence(mandateId, integrity, heparCtx.classification, allFiveOrgansFired, clientNdaConfirmed);

    // Write to Vox containers
    const narrativesContainer = await getVoxContainer('vox-narratives');
    const integrityContainer = await getVoxContainer('vox-integrity');
    const distContainer = await getVoxContainer('vox-distribution');

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
    } else if (dist.tier === 'NDA') {
        console.log(`[Distribution] NDA tier eligible. Notifying commercial pipeline.`);
    }

    return { narratives, integrity, dist };
}
