"use strict";
// hepar-core/stages/stageC-montecarlo.ts
// Stage C: Monte Carlo Path Execution and Agent Coordination
// Simulates execution paths, invokes agents in parallel, aggregates results
Object.defineProperty(exports, "__esModule", { value: true });
exports.StageC = void 0;
const stageC_utils_1 = require("./stageC-utils");
class StageC {
    config;
    agents;
    constructor(config, agents) {
        this.config = config;
        this.agents = agents;
    }
    async execute(protocolId, addressesToProbe) {
        const startTime = performance.now();
        const campaignResults = new Map();
        const allFindings = [];
        let totalPaths = 0;
        try {
            // Run each agent in series (or parallel with Promise.all for real concurrency)
            for (const agentId of this.config.agentsToRun) {
                const executor = this.agents.get(agentId);
                if (!executor) {
                    console.warn(`[StageC] Agent ${agentId} not registered.`);
                    continue;
                }
                const agentSeed = (0, stageC_utils_1.deriveAgentSeed)(this.config.masterSeed, Array.from(this.config.agentsToRun).indexOf(agentId), protocolId);
                const result = executor.run(agentSeed);
                campaignResults.set(agentId, result);
                allFindings.push(...result.findings);
                totalPaths += result.pathsExecuted;
            }
            return {
                stageId: 'C',
                statusCode: 200,
                campaignResults,
                aggregateFindings: this.deduplicateFindings(allFindings),
                totalPaths,
                totalFindings: allFindings.length,
                executionTime: performance.now() - startTime,
                executedAt: Date.now(),
            };
        }
        catch (err) {
            console.error('[StageC] Error during execution:', err);
            return {
                stageId: 'C',
                statusCode: 500,
                campaignResults,
                aggregateFindings: [],
                totalPaths,
                totalFindings: 0,
                executionTime: performance.now() - startTime,
                executedAt: Date.now(),
            };
        }
    }
    deduplicateFindings(findings) {
        const seen = new Set();
        const dedup = [];
        for (const f of findings) {
            const sig = `${f.vectorId}:${f.agentId}:${f.description}`;
            if (!seen.has(sig)) {
                seen.add(sig);
                dedup.push(f);
            }
        }
        return dedup;
    }
    /**
     * Example: Generate synthetic execution traces for testing/STUB mode
     */
    static generateSyntheticTraces(config, protocolId) {
        const rng = new stageC_utils_1.SeededLCG(config.masterSeed);
        const traces = [];
        for (let i = 0; i < Math.min(config.pathsPerAgent, 5); i++) {
            const callSeq = ['delegatecall', 'call', 'staticcall', 'callcode'];
            traces.push({
                executionId: `trace-${i}`,
                traceHash: `0x${rng.next().toString(16).padStart(64, '0')}`,
                contractAddress: `0x${rng.next().toString(16).padStart(40, '0')}`,
                initiatorAddress: `0x${rng.next().toString(16).padStart(40, '0')}`,
                callSequence: rng.pickN(callSeq, rng.nextInt(1, 3)),
                stateReads: { key0: `0x${rng.next().toString(16)}`, key1: `0x${rng.next().toString(16)}` },
                stateWrites: { key0: `0x${rng.next().toString(16)}` },
                gasUsed: rng.nextInt(21000, 5000000),
                valueFlow: BigInt(rng.nextInt(0, 1000000000)),
            });
        }
        return traces;
    }
}
exports.StageC = StageC;
