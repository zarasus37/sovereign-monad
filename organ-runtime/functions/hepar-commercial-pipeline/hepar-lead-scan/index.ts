import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { getContainer } from '../../../src/hepar/commercial/cosmos-config';

const azureFunction: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log('Hepar Lead Scan trigger function processed a request.');

    const container = await getContainer('leads');

    const lead = {
        id: `lead-${Date.now()}`,
        daoId: "monad-ecosystem",
        priority: "STANDARD",
        source: "scan",
        timestamp: new Date().toISOString(),
        status: "NEW",
        urgency: "STANDARD"
    };

    await container.items.create(lead);

    context.res = {
        // status: 200, /* Defaults to "200" */
        body: `Lead created: ${lead.id}`
    };
};

export default azureFunction;
