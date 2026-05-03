"use strict";
// hepar-core/agents/HeparStateAgent.ts
// Detects state consistency violations, invariant breaks, and logical fallacies
Object.defineProperty(exports, "__esModule", { value: true });
exports.HeparStateAgent = void 0;
const stageC_utils_1 = require("../stages/stageC-utils");
class HeparStateAgent {
    constructor(seed) {
        this.seed = seed;
        this.agentId = 'STATE';
        this.findings = [];
        this.pathsExecuted = 0;
        this.uniqueBranches = new Set();
        this.rng = new stageC_utils_1.SeededLCG(seed);
    }
    run() {
        const startTime = Date.now();
        this.findings = this.generateSyntheticFindings();
        this.pathsExecuted = this.rng.nextInt(30, 70);
        this.uniqueBranches = new Set([
            'balance_invariant_violated',
            'token_locked_forever',
            'accounting_mismatch',
            'state_desync_with_ledger',
        ]);
        return {
            agentId: this.agentId,
            seed: this.seed,
            findings: this.findings,
            pathsExecuted: this.pathsExecuted,
            uniqueBranchesHit: this.uniqueBranches.size,
            coverageRatio: 0.62,
            unknownRatio: 0.14,
            executionStatus: 'STUB',
            completedAt: Date.now() - startTime,
        };
    }
    generateSyntheticFindings() {
        const findings = [];
        const templates = [
            {
                description: 'Total supply invariant can be violated',
                severity: 0.87,
                estLoss: { low: 50000, high: 1000000 },
            },
            {
                description: 'Locked tokens permanently unretrievable',
                severity: 0.93,
                estLoss: { low: 100000, high: 10000000 },
            },
            {
                description: 'Balance mapping desynchronized from ledger',
                severity: 0.74,
                estLoss: { low: 1000, high: 100000 },
            },
        ];
        for (let i = 0; i < this.rng.nextInt(1, 3); i++) {
            const t = templates[i % templates.length];
            findings.push({
                vectorId: `state_${this.rng.next().toString(16)}`,
                agentId: this.agentId,
                severity: t.severity,
                description: t.description,
                exploitPreconditions: ['Execution of specific transaction sequence', 'State mutation ordering'],
                estLoss: t.estLoss,
                reproducibilitySeed: this.seed,
                traceId: `trace_state_${i}`,
                reproScore: 0.65 + this.rng.nextFloat(0, 0.25),
            });
        }
        return findings;
    }
}
exports.HeparStateAgent = HeparStateAgent;
//# sourceMappingURL=HeparStateAgent.js.map