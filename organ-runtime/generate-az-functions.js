const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'functions', 'hepar-commercial-pipeline');
if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath, { recursive: true });
}

// Write host.json
fs.writeFileSync(path.join(basePath, 'host.json'), JSON.stringify({
    version: "2.0",
    logging: {
        applicationInsights: {
            samplingSettings: {
                isEnabled: true,
                excludedTypes: "Request"
            }
        }
    },
    extensionBundle: {
        id: "Microsoft.Azure.Functions.ExtensionBundle",
        version: "[4.0.0, 5.0.0)"
    }
}, null, 2));

const sharedDir = path.join(basePath, 'shared');
if (!fs.existsSync(sharedDir)) fs.mkdirSync(sharedDir);

fs.writeFileSync(path.join(sharedDir, 'logger.ts'), `
import { CosmosClient } from '@azure/cosmos';

const endpoint = process.env.COSMOS_ENDPOINT || "";
const key = process.env.COSMOS_KEY || "";
const client = new CosmosClient({ endpoint, key });
const databaseId = "hepar_commercial";

export async function logExecution(functionName: string, state: 'STARTED' | 'COMPLETED' | 'FAILED', details?: any) {
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    const { container } = await database.containers.createIfNotExists({ id: 'execution-logs', partitionKey: { paths: ["/functionName"] } });
    await container.items.create({
        id: \`\${functionName}-\${Date.now()}\`,
        functionName,
        state,
        details,
        timestamp: new Date().toISOString()
    });
}

export async function logFounderReview(reviewType: string, reason: string, context: any) {
    const { database } = await client.databases.createIfNotExists({ id: databaseId });
    const { container } = await database.containers.createIfNotExists({ id: 'founder-review', partitionKey: { paths: ["/reviewType"] } });
    await container.items.create({
        id: \`review-\${Date.now()}\`,
        reviewType,
        reason,
        context,
        timestamp: new Date().toISOString()
    });
}
`);

const functions = [
    {
        name: 'hepar-lead-scan',
        trigger: {
            type: 'timerTrigger',
            name: 'myTimer',
            direction: 'in',
            schedule: '0 0 */6 * * *'
        },
        engine: '1-lead-identification-engine',
        engineMethod: 'runLeadIdentificationEngine'
    },
    {
        name: 'hepar-assessment-trigger',
        trigger: {
            type: 'cosmosDBTrigger',
            name: 'documents',
            direction: 'in',
            leaseCollectionName: 'leases',
            connectionStringSetting: 'CosmosDBConnection',
            databaseName: 'hepar_commercial',
            collectionName: 'leads',
            createLeaseCollectionIfNotExists: true
        },
        engine: '2-assessment-trigger-engine',
        engineMethod: 'runAssessmentTriggerEngine'
    },
    {
        name: 'hepar-proposal-gen',
        trigger: {
            type: 'cosmosDBTrigger',
            name: 'documents',
            direction: 'in',
            leaseCollectionName: 'leases',
            connectionStringSetting: 'CosmosDBConnection',
            databaseName: 'hepar_commercial',
            collectionName: 'opportunities',
            createLeaseCollectionIfNotExists: true
        },
        engine: '3-proposal-generation-engine',
        engineMethod: 'runProposalGenerationEngine'
    },
    {
        name: 'hepar-outreach',
        trigger: {
            type: 'cosmosDBTrigger',
            name: 'documents',
            direction: 'in',
            leaseCollectionName: 'leases',
            connectionStringSetting: 'CosmosDBConnection',
            databaseName: 'hepar_commercial',
            collectionName: 'proposals',
            createLeaseCollectionIfNotExists: true
        },
        engine: '4-outreach-engine',
        engineMethod: 'runOutreachEngine'
    },
    {
        name: 'hepar-followup',
        trigger: {
            type: 'timerTrigger',
            name: 'myTimer',
            direction: 'in',
            schedule: '0 0 */12 * * *'
        },
        engine: '5-follow-up-engine',
        engineMethod: 'runFollowUpEngine'
    },
    {
        name: 'hepar-monitor',
        trigger: {
            type: 'timerTrigger',
            name: 'myTimer',
            direction: 'in',
            schedule: '0 0 0 * * *' // Every 24 hours
        },
        engine: '6-monitoring-notification-engine',
        engineMethod: 'runMonitoringNotificationEngine'
    },
    {
        name: 'hepar-close',
        trigger: {
            type: 'httpTrigger',
            name: 'req',
            direction: 'in',
            methods: ['post'],
            authLevel: 'function'
        },
        engine: '7-close-onboarding-engine',
        engineMethod: 'runCloseAndOnboardingEngine'
    }
];

for (const f of functions) {
    const fPath = path.join(basePath, f.name);
    if (!fs.existsSync(fPath)) fs.mkdirSync(fPath);

    const functionJson = {
        bindings: [f.trigger],
        scriptFile: "../dist/" + f.name + "/index.js"
    };

    fs.writeFileSync(path.join(fPath, 'function.json'), JSON.stringify(functionJson, null, 2));

    const isHttp = f.trigger.type === 'httpTrigger';
    const isCosmos = f.trigger.type === 'cosmosDBTrigger';
    const isTimer = f.trigger.type === 'timerTrigger';

    const indexTs = `
import { AzureFunction, Context${isHttp ? ', HttpRequest' : ''} } from "@azure/functions";
import { ${f.engineMethod} } from "../../../src/hepar/commercial/${f.engine}";
import { logExecution, logFounderReview } from "../shared/logger";

const timerTrigger: AzureFunction = async function (context: Context${isHttp ? ', req: HttpRequest' : (isTimer ? ', myTimer: any' : ', documents: any[]')}): Promise<void> {
    context.log(\`[\${new Date().toISOString()}] \${context.executionContext.functionName} triggered.\`);
    
    await logExecution(context.executionContext.functionName, 'STARTED');

    try {
        // Execute the underlying engine
        await ${f.engineMethod}();

        // If the function handles events that require founder review, we log it.
        // E.g., HTTP webhook for payment, or tracking Cosmos changes.
        ${isHttp ? `
        if (req && req.body && req.body.paymentStatus === 'confirmed') {
            await logFounderReview('PAYMENT_CONFIRMED', 'Payment received via Stripe', req.body);
        }
        ` : ''}

        ${f.name === 'hepar-monitor' ? `
        // In reality, monitoring engine might detect a HARDBLOCK, the wrapper can't easily know unless it reads Cosmos
        // but we ensure the wrapper logs its completion successfully.
        ` : ''}
        
        await logExecution(context.executionContext.functionName, 'COMPLETED');
    } catch (error) {
        context.log.error(\`[\${new Date().toISOString()}] Error in \${context.executionContext.functionName}: \`, error);
        await logExecution(context.executionContext.functionName, 'FAILED', { error: error.message });
        throw error;
    }
};

export default timerTrigger;
`;

    fs.writeFileSync(path.join(fPath, 'index.ts'), indexTs.trim() + '\\n');
}

console.log("Azure Functions generation complete.");
