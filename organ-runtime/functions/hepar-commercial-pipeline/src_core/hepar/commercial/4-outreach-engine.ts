import { getContainer } from './cosmos-config';

interface OutreachRecord {
    id: string; // Internal id mapping to daoId for partition
    daoId: string;
    proposalId: string;
    channelUsed: 'GOVERNANCE_FORUM' | 'DISCORD' | 'ON_CHAIN';
    proposalVersion: string;
    status: 'SENT' | 'DELIVERY_FAILED' | 'RESPONDED';
    timestamp: string;
    lastFollowUpTimestamp?: string;
    followUpCount: number;
}

export async function runOutreachEngine() {
    console.log(`[${new Date().toISOString()}] Starting Outreach Engine...`);
    const proposalsContainer = await getContainer("proposals");
    const outreachContainer = await getContainer("outreach");

    // Fetch proposals that haven't been sent yet
    const { resources: proposals } = await proposalsContainer.items.query("SELECT * from c").fetchAll();

    for (const proposal of proposals) {
        console.log(`[${new Date().toISOString()}] -> Identifying outreach surface for: ${proposal.daoId}`);

        // Mock identification logic
        const channelUsed = 'GOVERNANCE_FORUM';
        console.log(`   - Surface identified: ${channelUsed}`);

        const contextMessage = `We noted recent governance activity and completed a preemptive Hepar assessment on your upcoming protocol deployment. Please review the attached findings.`;

        console.log(`   - Delivering proposal via ${channelUsed} with context message...`);
        // Mock email or webhook delivery system here

        const outreachRecord: OutreachRecord = {
            id: `outreach-${proposal.daoId}-${Date.now()}`,
            daoId: proposal.daoId,
            proposalId: proposal.proposalId,
            channelUsed,
            proposalVersion: 'v1.0',
            status: 'SENT',
            timestamp: new Date().toISOString(),
            followUpCount: 0
        };

        await outreachContainer.items.upsert(outreachRecord);
        console.log(`[${new Date().toISOString()}] -> Logged outreach attempt to Cosmos DB [Outreach]: ${outreachRecord.id}`);
    }
    
    console.log(`[${new Date().toISOString()}] Outreach Engine run complete.`);
}
