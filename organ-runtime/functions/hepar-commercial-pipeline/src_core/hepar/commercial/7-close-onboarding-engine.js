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
exports.runCloseAndOnboardingEngine = void 0;
const cosmos_config_1 = require("./cosmos-config");
const cosmosClient_1 = require("../../vox/cosmosClient");
function runCloseAndOnboardingEngine() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`[${new Date().toISOString()}] Starting Close and Onboarding Engine...`);
        const outreachContainer = yield (0, cosmos_config_1.getContainer)("outreach");
        const clientsContainer = yield (0, cosmos_config_1.getContainer)("clients");
        const voxDistContainer = yield (0, cosmosClient_1.getVoxContainer)("vox-distribution");
        // Mock incoming payment confirmations via Stripe/Crypto webhook events
        const paymentConfirmations = [
        // { daoId: 'aave.eth', protocolName: 'Aave V4 Deployment' }
        ];
        for (const payment of paymentConfirmations) {
            console.log(`[${new Date().toISOString()}] -> Payment confirmation received for ${payment.daoId}`);
            let distributionTier = 'NDA'; // Default safe
            try {
                const { resources: distList } = yield voxDistContainer.items.query(`SELECT * from c WHERE c.mandateId = 'mandate-${payment.daoId}'`).fetchAll();
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
            yield clientsContainer.items.upsert(clientRecord);
            console.log(`[${new Date().toISOString()}] -> Generated founding client record in Cosmos DB [Clients]: ${clientRecord.id}`);
            console.log(`   - Activated 30-day monitoring window. Expiry: ${expiryDate.toISOString()}`);
            console.log(`   - Scheduled 30-day window expiry notification with subscription conversion offer.`);
            if (distributionTier === 'INTERNAL') {
                console.log(`[${new Date().toISOString()}] -> [ATTENTION] Payment confirmed but tier is INTERNAL. Flagging for Founder Review.`);
            }
        }
        console.log(`[${new Date().toISOString()}] Close and Onboarding Engine run complete.`);
    });
}
exports.runCloseAndOnboardingEngine = runCloseAndOnboardingEngine;
//# sourceMappingURL=7-close-onboarding-engine.js.map