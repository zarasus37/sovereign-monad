import { getContainer } from './cosmos-config';

export async function runFollowUpEngine() {
    console.log(`[${new Date().toISOString()}] Starting Follow Up Engine...`);
    const outreachContainer = await getContainer("outreach");

    // Fetch all active SENT outreach records
    const { resources: outreachRecords } = await outreachContainer.items.query("SELECT * from c WHERE c.status = 'SENT'").fetchAll();

    const now = Date.now();
    const HOURS_72 = 72 * 60 * 60 * 1000;
    const DAYS_7 = 7 * 24 * 60 * 60 * 1000;

    for (const record of outreachRecords) {
        // MOCK: Check if response received
        const responseReceived = false; 

        if (responseReceived) {
            console.log(`[${new Date().toISOString()}] -> [ATTENTION] Response received for ${record.daoId}. Flagging for Founder Review.`);
            record.status = 'RESPONDED';
            await outreachContainer.items.upsert(record);
            continue; // DO NOT automate response to human engagement
        }

        const timeSinceSent = now - new Date(record.timestamp).getTime();

        if (timeSinceSent > DAYS_7 && record.followUpCount < 2) {
            console.log(`[${new Date().toISOString()}] -> Sending 7-day final follow up to ${record.daoId} with founding client deadline framing...`);
            record.followUpCount = 2;
            record.lastFollowUpTimestamp = new Date().toISOString();
            await outreachContainer.items.upsert(record);
        } else if (timeSinceSent > HOURS_72 && record.followUpCount < 1) {
            console.log(`[${new Date().toISOString()}] -> Sending 72-hour follow up to ${record.daoId} with protocol monitoring alert (checking if findings changed)...`);
            record.followUpCount = 1;
            record.lastFollowUpTimestamp = new Date().toISOString();
            await outreachContainer.items.upsert(record);
        }
    }
    
    console.log(`[${new Date().toISOString()}] Follow Up Engine run complete.`);
}
