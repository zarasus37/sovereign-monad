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
exports.runFollowUpEngine = void 0;
const cosmos_config_1 = require("./cosmos-config");
function runFollowUpEngine() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`[${new Date().toISOString()}] Starting Follow Up Engine...`);
        const outreachContainer = yield (0, cosmos_config_1.getContainer)("outreach");
        // Fetch all active SENT outreach records
        const { resources: outreachRecords } = yield outreachContainer.items.query("SELECT * from c WHERE c.status = 'SENT'").fetchAll();
        const now = Date.now();
        const HOURS_72 = 72 * 60 * 60 * 1000;
        const DAYS_7 = 7 * 24 * 60 * 60 * 1000;
        for (const record of outreachRecords) {
            // MOCK: Check if response received
            const responseReceived = false;
            if (responseReceived) {
                console.log(`[${new Date().toISOString()}] -> [ATTENTION] Response received for ${record.daoId}. Flagging for Founder Review.`);
                record.status = 'RESPONDED';
                yield outreachContainer.items.upsert(record);
                continue; // DO NOT automate response to human engagement
            }
            const timeSinceSent = now - new Date(record.timestamp).getTime();
            if (timeSinceSent > DAYS_7 && record.followUpCount < 2) {
                console.log(`[${new Date().toISOString()}] -> Sending 7-day final follow up to ${record.daoId} with founding client deadline framing...`);
                record.followUpCount = 2;
                record.lastFollowUpTimestamp = new Date().toISOString();
                yield outreachContainer.items.upsert(record);
            }
            else if (timeSinceSent > HOURS_72 && record.followUpCount < 1) {
                console.log(`[${new Date().toISOString()}] -> Sending 72-hour follow up to ${record.daoId} with protocol monitoring alert (checking if findings changed)...`);
                record.followUpCount = 1;
                record.lastFollowUpTimestamp = new Date().toISOString();
                yield outreachContainer.items.upsert(record);
            }
        }
        console.log(`[${new Date().toISOString()}] Follow Up Engine run complete.`);
    });
}
exports.runFollowUpEngine = runFollowUpEngine;
//# sourceMappingURL=5-follow-up-engine.js.map