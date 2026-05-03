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
exports.runMonitoringNotificationEngine = void 0;
const cosmos_config_1 = require("./cosmos-config");
function runMonitoringNotificationEngine() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`[${new Date().toISOString()}] Starting Monitoring and Notification Engine...`);
        const opportunitiesContainer = yield (0, cosmos_config_1.getContainer)("opportunities");
        const outreachContainer = yield (0, cosmos_config_1.getContainer)("outreach");
        // Fetch all assessed protocols (opportunities)
        const { resources: opportunities } = yield opportunitiesContainer.items.query("SELECT * from c").fetchAll();
        for (const opp of opportunities) {
            console.log(`[${new Date().toISOString()}] -> Running continuous Hepar monitoring for: ${opp.protocolName}`);
            // Mock classification change check
            const classificationChanged = false; // Set to true to simulate
            const classificationHardBlock = false;
            if (classificationChanged) {
                console.log(`[${new Date().toISOString()}] -> Classification changed for ${opp.protocolName}! Triggering notifications.`);
                if (classificationHardBlock) {
                    console.log(`[${new Date().toISOString()}] -> [ATTENTION] HARDBLOCK detected on active client protocol. Flagging for Founder Review.`);
                }
                // Check if DAO received an assessment
                const { resources: outreachRecords } = yield outreachContainer.items.query(`SELECT * from c WHERE c.daoId = '${opp.daoId}'`).fetchAll();
                for (const record of outreachRecords) {
                    if (record.status !== 'RESPONDED') {
                        console.log(`[${new Date().toISOString()}] -> Re-engaging ${opp.daoId}: "Since our initial assessment the risk profile of ${opp.protocolName} has changed — updated report attached"`);
                    }
                }
            }
        }
        console.log(`[${new Date().toISOString()}] Monitoring and Notification Engine run complete.`);
    });
}
exports.runMonitoringNotificationEngine = runMonitoringNotificationEngine;
//# sourceMappingURL=6-monitoring-notification-engine.js.map