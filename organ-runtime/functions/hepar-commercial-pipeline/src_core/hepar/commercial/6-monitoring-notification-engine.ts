import { getContainer } from './cosmos-config';

export async function runMonitoringNotificationEngine() {
    console.log(`[${new Date().toISOString()}] Starting Monitoring and Notification Engine...`);
    const opportunitiesContainer = await getContainer("opportunities");
    const outreachContainer = await getContainer("outreach");

    // Fetch all assessed protocols (opportunities)
    const { resources: opportunities } = await opportunitiesContainer.items.query("SELECT * from c").fetchAll();

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
            const { resources: outreachRecords } = await outreachContainer.items.query(`SELECT * from c WHERE c.daoId = '${opp.daoId}'`).fetchAll();
            
            for (const record of outreachRecords) {
                if (record.status !== 'RESPONDED') {
                    console.log(`[${new Date().toISOString()}] -> Re-engaging ${opp.daoId}: "Since our initial assessment the risk profile of ${opp.protocolName} has changed — updated report attached"`);
                }
            }
        }
    }
    
    console.log(`[${new Date().toISOString()}] Monitoring and Notification Engine run complete.`);
}
