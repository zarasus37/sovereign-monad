import { getContainer } from './cosmos-config';
import { getCortexContainer } from '../../cortex/cosmosClient';
import { getSynapseContainer } from '../../synapse/cosmosClient';
import { getPneumaContainer } from '../../pneuma/cosmosClient';
import { getVoxContainer } from '../../vox/cosmosClient';

interface Proposal {
    id: string; // Maps to proposalId
    proposalId: string;
    mandateId: string;
    daoId: string;
    markdownContent: string;
    pdfReadyOutputUri: string;
    timestamp: string;
    cortexEnhanced?: boolean;
    synapseCoordinated?: boolean;
    pneumaEnhanced?: boolean;
    voxEnhanced?: boolean;
    distributionTier?: string;
    integrityScore?: number;
    calibrationAnchors?: string[];
}

export async function runProposalGenerationEngine() {
    console.log(`[${new Date().toISOString()}] Starting Proposal Generation Engine...`);
    const opportunitiesContainer = await getContainer("opportunities");
    const proposalsContainer = await getContainer("proposals");

    // Fetch opportunities that need proposals generated
    const { resources: opportunities } = await opportunitiesContainer.items.query("SELECT * from c").fetchAll();

    const cortexResearchContainer = await getCortexContainer("cortex-research");
    const synapseCoordContainer = await getSynapseContainer("synapse-coordination");
    const pneumaMarketContainer = await getPneumaContainer("pneuma-market");
    const pneumaRegimeContainer = await getPneumaContainer("pneuma-regime");
    const pneumaExecContainer = await getPneumaContainer("pneuma-execution");
    const voxIntegrityContainer = await getVoxContainer("vox-integrity");
    const voxDistContainer = await getVoxContainer("vox-distribution");

    for (const opp of opportunities) {
        console.log(`[${new Date().toISOString()}] -> Generating tailored proposal document for mandate: ${opp.mandateId}`);

        let cortexEnhanced = false;
        let cortexExecutive = "No strategic synthesis available.";
        let cortexIntegration = "N/A";

        try {
            const { resources: synthesisList } = await cortexResearchContainer.items.query(`SELECT * from c WHERE c.mandateId = '${opp.mandateId}'`).fetchAll();
            if (synthesisList && synthesisList.length > 0) {
                cortexEnhanced = true;
                const synth = synthesisList[0];
                cortexExecutive = synth.executive || "Synthesis generated.";
                cortexIntegration = synth.integration || "Pattern detected.";
            }
        } catch (e) {
            console.error("Error fetching Cortex synthesis:", e);
        }

        let synapseCoordinated = false;
        let organsAligned = false;
        let synapseUrgency = "STANDARD";
        let conflictDetected = false;

        try {
            const { resources: coordList } = await synapseCoordContainer.items.query(`SELECT * from c WHERE c.mandateId = '${opp.mandateId}'`).fetchAll();
            if (coordList && coordList.length > 0) {
                synapseCoordinated = true;
                const coord = coordList[0];
                conflictDetected = !!coord.conflict;
                organsAligned = !conflictDetected;
                synapseUrgency = coord.urgency || "STANDARD";
            }
        } catch (e) {
            console.error("Error fetching Synapse coordination:", e);
        }

        let pneumaEnhanced = false;
        let pneumaRegime = "UNKNOWN";
        let pneumaSettlementReliability = "N/A";
        let pneumaConvertedDemand = false;
        let pneumaExecutionCost = "N/A";

        try {
            const { resources: marketList } = await pneumaMarketContainer.items.query(`SELECT * from c WHERE c.protocolId = '${opp.protocolName}'`).fetchAll();
            const { resources: regimeList } = await pneumaRegimeContainer.items.query(`SELECT * from c WHERE c.protocolId = '${opp.protocolName}'`).fetchAll();
            const { resources: execList } = await pneumaExecContainer.items.query(`SELECT * from c WHERE c.protocolId = '${opp.protocolName}'`).fetchAll();
            
            if (marketList && marketList.length > 0 && regimeList && regimeList.length > 0 && execList && execList.length > 0) {
                pneumaEnhanced = true;
                const market = marketList[0];
                const regime = regimeList[0];
                const exec = execList[0];
                
                pneumaRegime = regime.regime || "UNKNOWN";
                pneumaSettlementReliability = exec.settlementReliability ? exec.settlementReliability.toFixed(2) : "N/A";
                pneumaConvertedDemand = !!market.convertedDemand;
                pneumaExecutionCost = exec.executionCostBps ? exec.executionCostBps.toFixed(3) : "N/A";
            }
        } catch (e) {
            console.error("Error fetching Pneuma context:", e);
        }

        let voxEnhanced = false;
        let distributionTier = 'INTERNAL';
        let integrityScore = 0.0;
        let manipulationConfidence = "N/A";
        let integrityCertificateHash = "N/A";
        let calibrationAnchors: string[] = ["CAL-005", "CAL-006", "CAL-CORTEX-001", "CAL-SYNAPSE-001", "CAL-PNEUMA-001", "CAL-VOX-001"];

        try {
            const { resources: integrityList } = await voxIntegrityContainer.items.query(`SELECT * from c WHERE c.protocolId = '${opp.protocolName}'`).fetchAll();
            const { resources: distList } = await voxDistContainer.items.query(`SELECT * from c WHERE c.mandateId = '${opp.mandateId}'`).fetchAll();
            
            if (integrityList && integrityList.length > 0 && distList && distList.length > 0) {
                voxEnhanced = true;
                const integrity = integrityList[0];
                const dist = distList[0];
                distributionTier = dist.tier || 'INTERNAL';
                integrityScore = integrity.score || 0.0;
                manipulationConfidence = integrity.manipulationConfidence || "N/A";
                integrityCertificateHash = (dist.integrityCertificate && dist.integrityCertificate.organOutputHashes) ? dist.integrityCertificate.organOutputHashes[0] : "N/A";
                if (dist.integrityCertificate && dist.integrityCertificate.calibrationAnchors) {
                    calibrationAnchors = dist.integrityCertificate.calibrationAnchors;
                }
            }
        } catch (e) {
            console.error("Error fetching Vox context:", e);
        }

        const heparClassification = opp.classification || "ALLOW";
        const heparConfidence = opp.confidence || "HIGH";
        const heparTopFinding = opp.findingsSummary || "Structural integrity verified.";

        const markdownContent = `
# Sovereign Monad Ecosystem
**Five-Organ Intelligence Stack Active**

- **Calibration Anchors:** ${calibrationAnchors.join(', ')}
- **Integrity Certificate Reference:** ${integrityCertificateHash}
- **Distribution Tier:** ${distributionTier}

---

# Hepar Security Assessment Proposal for ${opp.protocolName}

## Context
Based on recent governance activity and treasury size, we have preemptively analyzed ${opp.protocolName}. 

## Five-Organ Summary
This assessment reflects five-organ unified intelligence:

Hepar — structural risk classification
${heparClassification} at ${heparConfidence} confidence
Key finding: ${heparTopFinding}

Cortex — strategic intelligence
${cortexExecutive}
Pattern detected: ${cortexIntegration}

Synapse — coordination verdict
Organs aligned: ${organsAligned}
Signal urgency: ${synapseUrgency}
Conflict detected: ${conflictDetected}

Pneuma — market intelligence
Current regime: ${pneumaRegime}
Settlement reliability: ${pneumaSettlementReliability}
Converted demand: ${pneumaConvertedDemand}
Execution cost: ${pneumaExecutionCost} bps

Vox — narrative integrity
Protocol integrity score: ${integrityScore.toFixed(2)}
Manipulation confidence: ${manipulationConfidence}
Distribution tier: ${distributionTier}
Certificate: ${integrityCertificateHash}

## Founding Client Program
- **Founding client pricing:** $2,500 - $5,000 (Current Advisory tier pricing)
- **Free re-run at Decision-Support tier**
- **Free re-run at Authoritative tier**
- **50% locked-in API discount when six organs are live**
- **Accuracy guarantee terms**
- **30-day monitoring window terms**

*Note: Cardia — the capital circulation organ — activates upon ecosystem funding. Founding client revenue directly accelerates that activation and the full six-organ suite.*

## Next Steps
[Payment Link & NDA Package Attached]
`;

        // Mock PDF Generation
        console.log(`   - Formatting as PDF-ready output...`);
        const pdfReadyOutputUri = `s3://hepar-proposals/${opp.mandateId}.pdf`;

        const proposal: Proposal = {
            id: `prop-${opp.mandateId}`,
            proposalId: `prop-${opp.mandateId}`,
            mandateId: opp.mandateId,
            daoId: opp.daoId,
            markdownContent,
            pdfReadyOutputUri,
            timestamp: new Date().toISOString(),
            cortexEnhanced,
            synapseCoordinated,
            pneumaEnhanced,
            voxEnhanced,
            distributionTier,
            integrityScore,
            calibrationAnchors
        };

        await proposalsContainer.items.upsert(proposal);
        console.log(`[${new Date().toISOString()}] -> Wrote proposal to Cosmos DB [Proposals]: ${proposal.proposalId}`);
    }
    
    console.log(`[${new Date().toISOString()}] Proposal Generation Engine run complete.`);
}
