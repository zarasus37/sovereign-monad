"use strict";
// hepar-core/HeparOrchestrator.ts
// Main entry point: coordinates Stages A–D with full pipeline execution
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeparOrchestrator = void 0;
exports.createDefaultHeparOrchestrator = createDefaultHeparOrchestrator;
const stageA_static_1 = require("./stages/stageA-static");
const stageB_symbolic_1 = require("./stages/stageB-symbolic");
const stageC_montecarlo_1 = require("./stages/stageC-montecarlo");
const stageD_consensus_1 = require("./stages/stageD-consensus");
const index_1 = require("./agents/index");
class HeparOrchestrator {
    stageA;
    stageB;
    stageC;
    stageD;
    constructor(config) {
        this.stageA = new stageA_static_1.StageA(config.stageA);
        this.stageB = new stageB_symbolic_1.StageB(config.stageB);
        // Create agent registry and initialize Stage C
        const agents = (0, index_1.createAgentRegistry)(config.stageC.masterSeed, 'STUB');
        this.stageC = new stageC_montecarlo_1.StageC(config.stageC, agents);
        this.stageD = new stageD_consensus_1.StageD(config.stageD);
    }
    /**
     * Execute full Hepar pipeline: A → B → C → D
     */
    async executeFullPipeline(protocolId, addressesToProbe) {
        const startTime = performance.now();
        let stageAResult = null;
        let stageBResult = null;
        let stageCResult = null;
        let stageDResult = null;
        try {
            // Stage A: Static forensics
            console.log('[HeparOrchestrator] Starting Stage A (Static Forensics)...');
            stageAResult = await this.stageA.analyze(protocolId, addressesToProbe);
            console.log(`[HeparOrchestrator] Stage A completed with ${stageAResult.findings.length} findings.`);
            // Stage B: Symbolic proving
            console.log('[HeparOrchestrator] Starting Stage B (Symbolic Proving)...');
            stageBResult = await this.stageB.prove(protocolId, stageAResult.findings.map(f => f.vectorId));
            console.log(`[HeparOrchestrator] Stage B completed with ${stageBResult.invariantViolations.length} violations.`);
            // Stage C: Monte Carlo execution
            console.log('[HeparOrchestrator] Starting Stage C (Monte Carlo Execution)...');
            stageCResult = await this.stageC.execute(protocolId, addressesToProbe);
            console.log(`[HeparOrchestrator] Stage C completed with ${stageCResult.totalFindings} findings across ${stageCResult.totalPaths} paths.`);
            // Stage D: Consensus fusion
            console.log('[HeparOrchestrator] Starting Stage D (Consensus Fusion)...');
            stageDResult = this.stageD.fuse(stageBResult, stageCResult, protocolId);
            console.log(`[HeparOrchestrator] Stage D completed with decision: ${stageDResult.decision}`);
            return {
                stageA: stageAResult,
                stageB: stageBResult,
                stageC: stageCResult,
                stageD: stageDResult,
                totalTime: performance.now() - startTime,
                pipelineStatus: 'SUCCESS',
            };
        }
        catch (err) {
            console.error('[HeparOrchestrator] Pipeline error:', err);
            return {
                stageA: stageAResult,
                stageB: stageBResult,
                stageC: stageCResult,
                stageD: stageDResult,
                totalTime: performance.now() - startTime,
                pipelineStatus: stageAResult ? 'PARTIAL' : 'FAILURE',
            };
        }
    }
    /**
     * Execute up to a specific stage
     */
    async executeUpToStage(stage, protocolId, addressesToProbe) {
        const startTime = performance.now();
        let stageAResult = null;
        let stageBResult = null;
        let stageCResult = null;
        let stageDResult = null;
        try {
            if (stage === 'A' || stage === 'B' || stage === 'C' || stage === 'D') {
                console.log(`[HeparOrchestrator] Executing up to Stage ${stage}...`);
                stageAResult = await this.stageA.analyze(protocolId, addressesToProbe);
                if (stage === 'B' || stage === 'C' || stage === 'D') {
                    stageBResult = await this.stageB.prove(protocolId, stageAResult.findings.map(f => f.vectorId));
                    if (stage === 'C' || stage === 'D') {
                        stageCResult = await this.stageC.execute(protocolId, addressesToProbe);
                        if (stage === 'D') {
                            stageDResult = this.stageD.fuse(stageBResult, stageCResult, protocolId);
                        }
                    }
                }
            }
            return {
                stageA: stageAResult,
                stageB: stageBResult,
                stageC: stageCResult,
                stageD: stageDResult,
                totalTime: performance.now() - startTime,
                pipelineStatus: 'SUCCESS',
            };
        }
        catch (err) {
            console.error(`[HeparOrchestrator] Error executing up to Stage ${stage}:`, err);
            return {
                stageA: stageAResult,
                stageB: stageBResult,
                stageC: stageCResult,
                stageD: stageDResult,
                totalTime: performance.now() - startTime,
                pipelineStatus: stageAResult ? 'PARTIAL' : 'FAILURE',
            };
        }
    }
}
exports.HeparOrchestrator = HeparOrchestrator;
/**
 * Factory: Create a pre-configured HeparOrchestrator with sensible defaults
 */
function createDefaultHeparOrchestrator() {
    return new HeparOrchestrator({
        stageA: {
            bytecodeThreshold: 500,
            patternMatchingDepth: 3,
        },
        stageB: {
            timeoutPerInvariant: 5000,
            allowStubMode: true,
        },
        stageC: {
            pathsPerAgent: 50,
            agentsToRun: ['PRIVILEGE', 'ARITHMETIC', 'REENTRANCY', 'ECONOMIC', 'STATE'],
            masterSeed: `hepar_main_${Date.now()}`,
            timeoutMs: 30000,
            allowStubMode: true,
        },
        stageD: {
            consensusThreshold: 0.5,
            severityWeights: { BLOCK: 2.0, WARN: 1.0, ALLOW: 0.5 },
            allowPartialConsensus: true,
        },
    });
}
