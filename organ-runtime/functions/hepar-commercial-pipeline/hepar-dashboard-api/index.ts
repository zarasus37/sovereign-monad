import { AzureFunction, Context, HttpRequest } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    context.log(`[${new Date().toISOString()}] hepar-dashboard-api HTTP trigger function processed a request.`);

    const endpoint = process.env.COSMOS_ENDPOINT;
    const key = process.env.COSMOS_KEY;
    const databaseId = process.env.COSMOS_DB_NAME || "hepar";
    
    if (!endpoint || !key) {
        context.res = {
            status: 500,
            body: { error: "Cosmos DB connection string is not defined in environment variables." }
        };
        return;
    }

    try {
        const client = new CosmosClient({ endpoint, key });
        const database = client.database(databaseId);
        const container = database.container("Leads");

        // Query all pipeline data
        const querySpec = {
            query: "SELECT * from c"
        };

        const { resources: items } = await container.items.query(querySpec).fetchAll();

        // Calculate summary metrics for the dashboard
        const totalLeads = items.length;
        const qualifiedLeads = items.filter(lead => lead.Score >= 80).length;
        const activeConsults = items.filter(lead => lead.Status === 'ACTIVE CONSULT').length;
        const generatedProposals = items.filter(lead => lead.ProposalGenerated).length;
        const dispatchedProposals = items.filter(lead => lead.Status === 'DISPATCHED').length;

        const dashboardData = {
            metrics: {
                totalLeads,
                qualifiedLeads,
                generatedProposals,
                dispatchedProposals,
                activeConsults
            },
            pipeline: items
        };

        context.res = {
            status: 200,
            headers: {
                "Content-Type": "application/json"
            },
            body: dashboardData
        };
    } catch (error: any) {
        context.log.error("Error fetching data from Cosmos DB:", error);
        context.res = {
            status: 500,
            body: { error: "Failed to retrieve pipeline data from database.", details: error.message }
        };
    }
};

export default httpTrigger;
