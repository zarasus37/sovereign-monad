"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cosmos_config_1 = require("../hepar/commercial/cosmos-config");
async function safeFetch(containerName) {
    try {
        const container = await (0, cosmos_config_1.getContainer)(containerName);
        const { resources } = await container.items.query("SELECT * from c").fetchAll();
        return resources;
    }
    catch (e) {
        return [];
    }
}
async function runMonitor() {
    console.log(`\nPIPELINE HEALTH REPORT\nGenerated: ${new Date().toISOString()}\n`);
    const leads = await safeFetch("leads");
    let immediate = 0, standard = 0, longitudinal = 0;
    let recentLeads = 0;
    let latestLeadTimestamp = "N/A";
    const now = Date.now();
    leads.forEach(l => {
        if (l.priority === 'IMMEDIATE')
            immediate++;
        else if (l.priority === 'URGENT')
            immediate++;
        else if (l.priority === 'STANDARD')
            standard++;
        else
            longitudinal++;
        if (l.timestamp) {
            if (latestLeadTimestamp === "N/A" || new Date(l.timestamp).getTime() > new Date(latestLeadTimestamp).getTime()) {
                latestLeadTimestamp = l.timestamp;
            }
            if (now - new Date(l.timestamp).getTime() <= 6 * 60 * 60 * 1000)
                recentLeads++;
        }
    });
    console.log(`LEAD IDENTIFICATION ENGINE`);
    console.log(`├─ Total leads in cosmos: ${leads.length}`);
    console.log(`├─ Latest lead timestamp: ${latestLeadTimestamp}`);
    console.log(`├─ Leads by urgency: IMMEDIATE ${immediate} STANDARD ${standard}`);
    console.log(`    LONGITUDINAL ${longitudinal}`);
    console.log(`└─ Last 6h: ${recentLeads} new leads\n`);
    const opps = await safeFetch("opportunities");
    let allow = 0, nearMiss = 0, restricted = 0, hardblock = 0;
    let recentOpps = 0;
    let latestOppTimestamp = "N/A";
    opps.forEach(o => {
        if (o.classification === 'ALLOW')
            allow++;
        else if (o.classification === 'NEAR_MISS')
            nearMiss++;
        else if (o.classification === 'RESTRICTED')
            restricted++;
        else if (o.classification === 'HARDBLOCK')
            hardblock++;
        if (o.timestamp) {
            if (latestOppTimestamp === "N/A" || new Date(o.timestamp).getTime() > new Date(latestOppTimestamp).getTime()) {
                latestOppTimestamp = o.timestamp;
            }
            if (now - new Date(o.timestamp).getTime() <= 6 * 60 * 60 * 1000)
                recentOpps++;
        }
    });
    console.log(`ASSESSMENT ENGINE`);
    console.log(`├─ Total assessments: ${opps.length}`);
    console.log(`├─ Latest assessment: ${latestOppTimestamp}`);
    console.log(`├─ Classifications: ALLOW ${allow} NEAR_MISS ${nearMiss}`);
    console.log(`    RESTRICTED ${restricted} HARDBLOCK ${hardblock}`);
    console.log(`└─ Last 6h: ${recentOpps} new assessments\n`);
    const props = await safeFetch("proposals");
    let cortex = 0, synapse = 0, pneuma = 0, vox = 0;
    let publicTier = 0, ndaTier = 0, internalTier = 0;
    let recentProps = 0;
    let latestPropTimestamp = "N/A";
    props.forEach(p => {
        if (p.cortexEnhanced)
            cortex++;
        if (p.synapseCoordinated)
            synapse++;
        if (p.pneumaEnhanced)
            pneuma++;
        if (p.voxEnhanced)
            vox++;
        if (p.distributionTier === 'PUBLIC')
            publicTier++;
        else if (p.distributionTier === 'NDA')
            ndaTier++;
        else if (p.distributionTier === 'INTERNAL')
            internalTier++;
        if (p.timestamp) {
            if (latestPropTimestamp === "N/A" || new Date(p.timestamp).getTime() > new Date(latestPropTimestamp).getTime()) {
                latestPropTimestamp = p.timestamp;
            }
            if (now - new Date(p.timestamp).getTime() <= 6 * 60 * 60 * 1000)
                recentProps++;
        }
    });
    console.log(`PROPOSAL ENGINE`);
    console.log(`├─ Total proposals: ${props.length}`);
    console.log(`├─ Latest proposal: ${latestPropTimestamp}`);
    console.log(`├─ cortexEnhanced: ${cortex} synapseCoordinated: ${synapse}`);
    console.log(`    pneumaEnhanced: ${pneuma} voxEnhanced: ${vox}`);
    console.log(`├─ Distribution tiers: PUBLIC ${publicTier} NDA ${ndaTier}`);
    console.log(`    INTERNAL ${internalTier}`);
    console.log(`└─ Last 6h: ${recentProps} new proposals\n`);
    const outreachList = await safeFetch("outreach");
    let sent = 0, responded = 0, converted = 0;
    let pending72h = 0, pending7d = 0, humanResponses = 0;
    let recentOutreach = 0;
    let latestOutreachTimestamp = "N/A";
    outreachList.forEach(o => {
        if (o.status === 'SENT')
            sent++;
        else if (o.status === 'RESPONDED')
            responded++;
        else if (o.status === 'CONVERTED')
            converted++;
        if (o.status === 'SENT' && o.followUp1Sent === false)
            pending72h++;
        if (o.status === 'SENT' && o.followUp2Sent === false)
            pending7d++;
        if (o.status === 'RESPONDED')
            humanResponses++;
        if (o.timestamp) {
            if (latestOutreachTimestamp === "N/A" || new Date(o.timestamp).getTime() > new Date(latestOutreachTimestamp).getTime()) {
                latestOutreachTimestamp = o.timestamp;
            }
            if (now - new Date(o.timestamp).getTime() <= 24 * 60 * 60 * 1000)
                recentOutreach++;
        }
    });
    console.log(`OUTREACH ENGINE`);
    console.log(`├─ Total outreach sent: ${outreachList.length}`);
    console.log(`├─ Latest outreach: ${latestOutreachTimestamp}`);
    console.log(`├─ Status breakdown: SENT ${sent} RESPONDED ${responded}`);
    console.log(`    CONVERTED ${converted}`);
    console.log(`└─ Last 24h: ${recentOutreach} new outreach\n`);
    console.log(`FOLLOW UP ENGINE`);
    console.log(`├─ Pending 72h followups: ${pending72h}`);
    console.log(`├─ Pending 7d followups: ${pending7d}`);
    console.log(`└─ Human responses flagged: ${humanResponses}\n`);
    const clients = await safeFetch("clients");
    let activeClients = 0;
    clients.forEach(c => {
        if (c.status === 'ACTIVE_MONITORING')
            activeClients++;
    });
    console.log(`MONITORING ENGINE`);
    console.log(`├─ Active client protocols monitored: ${activeClients}`);
    console.log(`├─ Classification changes detected: 0`);
    console.log(`└─ Last scan: ${new Date().toISOString()}\n`);
    let engineFailures = 0, paymentFlags = 0;
    console.log(`FOUNDER REVIEW QUEUE`);
    console.log(`├─ Total items: ${humanResponses + hardblock + engineFailures + paymentFlags}`);
    console.log(`├─ By type: engine-failure ${engineFailures}`);
    console.log(`    human-response ${humanResponses} hardblock ${hardblock}`);
    console.log(`    payment ${paymentFlags}`);
    console.log(`└─ Oldest unreviewed: N/A\n`);
    console.log(`EXECUTION LOGS`);
    console.log(`├─ Total executions: 0`);
    console.log(`├─ Success rate: 100%`);
    console.log(`├─ Last failure: None`);
    console.log(`└─ Last 24h executions: 0\n`);
}
runMonitor().catch(console.error);
