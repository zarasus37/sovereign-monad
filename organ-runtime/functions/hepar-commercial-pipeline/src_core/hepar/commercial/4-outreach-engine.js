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
exports.runOutreachEngine = void 0;
const cosmos_config_1 = require("./cosmos-config");
function runOutreachEngine() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log(`[${new Date().toISOString()}] Starting Outreach Engine...`);
        const proposalsContainer = yield (0, cosmos_config_1.getContainer)("proposals");
        const outreachContainer = yield (0, cosmos_config_1.getContainer)("outreach");
        // Fetch proposals that haven't been sent yet
        const { resources: proposals } = yield proposalsContainer.items.query("SELECT * from c").fetchAll();
        for (const proposal of proposals) {
            console.log(`[${new Date().toISOString()}] -> Identifying outreach surface for: ${proposal.daoId}`);
            // Mock identification logic
            const channelUsed = 'GOVERNANCE_FORUM';
            console.log(`   - Surface identified: ${channelUsed}`);
            const contextMessage = `We noted recent governance activity and completed a preemptive Hepar assessment on your upcoming protocol deployment. Please review the attached findings.`;
            console.log(`   - Delivering proposal via ${channelUsed} with context message...`);
            // Mock email or webhook delivery system here
            const outreachRecord = {
                id: `outreach-${proposal.daoId}-${Date.now()}`,
                daoId: proposal.daoId,
                proposalId: proposal.proposalId,
                channelUsed,
                proposalVersion: 'v1.0',
                status: 'SENT',
                timestamp: new Date().toISOString(),
                followUpCount: 0
            };
            yield outreachContainer.items.upsert(outreachRecord);
            console.log(`[${new Date().toISOString()}] -> Logged outreach attempt to Cosmos DB [Outreach]: ${outreachRecord.id}`);
        }
        console.log(`[${new Date().toISOString()}] Outreach Engine run complete.`);
    });
}
exports.runOutreachEngine = runOutreachEngine;
//# sourceMappingURL=4-outreach-engine.js.map