"use strict";
// hepar-core/examples/full-pipeline.ts
// Example: Running the full Hepar pipeline end-to-end
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
const HeparOrchestrator_1 = require("../HeparOrchestrator");
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log('[Example] Initializing Hepar Orchestrator...');
        const orchestrator = (0, HeparOrchestrator_1.createDefaultHeparOrchestrator)();
        // Example: Analyze a Uniswap V3 Router
        const protocolId = 'uniswap-v3';
        const addressesToProbe = [
            '0xE592427A0AEce92De3Edee1F18E0157C05861564',
            '0xC36442b4a4522E871399CD717aBD90098519f91B', // PositionManager
        ];
        console.log(`\n[Example] Analyzing protocol: ${protocolId}`);
        console.log(`[Example] Probing ${addressesToProbe.length} contracts...\n`);
        try {
            // Execute full pipeline
            const pipelineResult = yield orchestrator.executeFullPipeline(protocolId, addressesToProbe);
            // Log Stage A results
            if (pipelineResult.stageA) {
                console.log(`=== STAGE A (Static Forensics) ===`);
                console.log(`Status: ${pipelineResult.stageA.statusCode}`);
                console.log(`Findings: ${pipelineResult.stageA.findings.length}`);
                console.log(`Execution time: ${pipelineResult.stageA.executionTime.toFixed(2)}ms\n`);
                // Print sample findings
                pipelineResult.stageA.findings.slice(0, 2).forEach((f, i) => {
                    console.log(`  Finding ${i + 1}: ${f.description}`);
                    console.log(`    Severity: ${f.severity.toFixed(2)}`);
                    console.log(`    Pattern: ${f.pattern}`);
                });
            }
            // Log Stage B results
            if (pipelineResult.stageB) {
                console.log(`\n=== STAGE B (Symbolic Proving) ===`);
                console.log(`Status: ${pipelineResult.stageB.statusCode}`);
                console.log(`Invariant Violations: ${pipelineResult.stageB.invariantViolations.length}`);
                console.log(`Execution time: ${pipelineResult.stageB.executionTime.toFixed(2)}ms\n`);
                pipelineResult.stageB.invariantViolations.slice(0, 2).forEach((v, i) => {
                    console.log(`  Violation ${i + 1}: ${v.description}`);
                    console.log(`    Severity: ${v.severity.toFixed(2)}`);
                    console.log(`    Confidence: ${v.confidence.toFixed(2)}`);
                });
            }
            // Log Stage C results
            if (pipelineResult.stageC) {
                console.log(`\n=== STAGE C (Monte Carlo Execution) ===`);
                console.log(`Status: ${pipelineResult.stageC.statusCode}`);
                console.log(`Total Findings: ${pipelineResult.stageC.totalFindings}`);
                console.log(`Paths Executed: ${pipelineResult.stageC.totalPaths}`);
                console.log(`Execution time: ${pipelineResult.stageC.executionTime.toFixed(2)}ms\n`);
                console.log(`Campaign Results:`);
                for (const [agentId, result] of pipelineResult.stageC.campaignResults) {
                    console.log(`  ${agentId}: ${result.findings.length} findings, ${result.pathsExecuted} paths`);
                }
            }
            // Log Stage D results (final decision)
            if (pipelineResult.stageD) {
                console.log(`\n=== STAGE D (Consensus Fusion) ===`);
                console.log(`Status: ${pipelineResult.stageD.statusCode}`);
                console.log(`DECISION: ${pipelineResult.stageD.decision}`);
                console.log(`Confidence: ${pipelineResult.stageD.confidence.toFixed(2)}`);
                console.log(`Execution time: ${pipelineResult.stageD.fusionTime.toFixed(2)}ms\n`);
                console.log(`Vote Summary:`);
                const voteCounts = { BLOCK: 0, WARN: 0, ALLOW: 0, INVESTIGATE: 0 };
                pipelineResult.stageD.votes.forEach(v => {
                    voteCounts[v.decision]++;
                });
                Object.entries(voteCounts).forEach(([decision, count]) => {
                    if (count > 0)
                        console.log(`  ${decision}: ${count} votes`);
                });
            }
            // Summary
            console.log(`\n=== PIPELINE SUMMARY ===`);
            console.log(`Status: ${pipelineResult.pipelineStatus}`);
            console.log(`Total Time: ${pipelineResult.totalTime.toFixed(2)}ms`);
            // Stage D is the authoritative verdict
            if (pipelineResult.stageD) {
                console.log(`\nFINAL VERDICT:`);
                console.log(`  Decision: ${pipelineResult.stageD.decision}`);
                console.log(`  Confidence: ${(pipelineResult.stageD.confidence * 100).toFixed(0)}%`);
                console.log(`  Action Band: ${pipelineResult.stageD.aggregatedBand.band}`);
                if (pipelineResult.stageD.aggregatedBand.escalationPath.length > 0) {
                    console.log(`  Escalation: ${pipelineResult.stageD.aggregatedBand.escalationPath.join(' → ')}`);
                }
            }
        }
        catch (err) {
            console.error('[Example] Pipeline error:', err);
            process.exitCode = 1;
        }
    });
}
if (require.main === module) {
    main();
}
//# sourceMappingURL=full-pipeline.js.map