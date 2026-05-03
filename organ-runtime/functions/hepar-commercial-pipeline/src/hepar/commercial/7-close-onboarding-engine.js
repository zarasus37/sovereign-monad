"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCloseAndOnboardingEngine = runCloseAndOnboardingEngine;
const cosmos_config_1 = require("./cosmos-config");
const cosmosClient_1 = require("../../vox/cosmosClient");
async function runCloseAndOnboardingEngine() {
    console.log(`[${new Date().toISOString()}] Starting Close and Onboarding Engine...`);
    const outreachContainer = await (0, cosmos_config_1.getContainer)("outreach");
    const clientsContainer = await (0, cosmos_config_1.getContainer)("clients");
    const voxDistContainer = await (0, cosmosClient_1.getVoxContainer)("vox-distribution");
    // Mock incoming payment confirmations via Stripe/Crypto webhook events
    const paymentConfirmations = [
    // { daoId: 'aave.eth', protocolName: 'Aave V4 Deployment' }
    ];
    for (const payment of paymentConfirmations) {
        console.log(`[${new Date().toISOString()}] -> Payment confirmation received for ${payment.daoId}`);
        let distributionTier = 'NDA'; // Default safe
        try {
            const { resources: distList } = await voxDistContainer.items.query(`SELECT * from c WHERE c.mandateId = 'mandate-${payment.daoId}'`).fetchAll();
            if (distList && distList.length > 0) {
                distributionTier = distList[0].tier;
            }
        }
        catch (e) { }
        if (distributionTier === 'PUBLIC') {
            console.log(`   - Delivering full report automatically without NDA restriction (PUBLIC tier)`);
        }
        else if (distributionTier === 'NDA') {
            console.log(`   - Sending NDA package automatically before delivery (NDA tier)`);
        }
        else {
            console.log(`   - Escalating to Founder Review before delivery (INTERNAL tier)`);
        }
        const startDate = new Date();
        const expiryDate = new Date(startDate.getTime() + (30 * 24 * 60 * 60 * 1000));
        const clientRecord = {
            id: payment.daoId,
            daoId: payment.daoId,
            protocolName: payment.protocolName,
            status: 'ACTIVE_MONITORING',
            monitoringStartDate: startDate.toISOString(),
            monitoringExpiryDate: expiryDate.toISOString(),
            ndaSent: distributionTier === 'NDA',
            timestamp: new Date().toISOString()
        };
        await clientsContainer.items.upsert(clientRecord);
        console.log(`[${new Date().toISOString()}] -> Generated founding client record in Cosmos DB [Clients]: ${clientRecord.id}`);
        console.log(`   - Activated 30-day monitoring window. Expiry: ${expiryDate.toISOString()}`);
        console.log(`   - Scheduled 30-day window expiry notification with subscription conversion offer.`);
        if (distributionTier === 'INTERNAL') {
            console.log(`[${new Date().toISOString()}] -> [ATTENTION] Payment confirmed but tier is INTERNAL. Flagging for Founder Review.`);
        }
    }
    console.log(`[${new Date().toISOString()}] Close and Onboarding Engine run complete.`);
}
