"use strict";
// hepar-core/stages/stageD-consensus.ts
// Stage D: Consensus Fusion and Decision Integration
// Merges SymbolicResult from Stage B and AgentFindings from Stage C into attestations
Object.defineProperty(exports, "__esModule", { value: true });
exports.StageD = void 0;
class StageD {
    config;
    constructor(config) {
        this.config = config;
    }
    /**
     * Fuse Stage B symbolic results and Stage C agent findings into a final decision.
     */
    fuse(stageBResult, stageCResult, protocolId) {
        const startTime = performance.now();
        const votes = [];
        const findings = [];
        // Stage B contributes symbolic invariant violations
        if (stageBResult && stageBResult.statusCode === 200) {
            for (const inv of stageBResult.invariantViolations) {
                findings.push({
                    vectorId: inv.invariantId,
                    vectorType: 'SYMBOLIC_INVARIANT',
                    severity: inv.severity,
                    description: inv.description,
                    confidence: inv.confidence,
                });
                // Vote from Stage B
                votes.push({
                    voterId: 'STAGE_B_SYMBOLIC',
                    decision: inv.severity >= 0.8 ? 'BLOCK' : inv.severity >= 0.5 ? 'WARN' : 'ALLOW',
                    confidence: inv.confidence,
                    reasoning: `Symbolic engine: ${inv.description}`,
                });
            }
        }
        // Stage C contributes agent findings
        if (stageCResult && stageCResult.statusCode === 200) {
            for (const agentResult of stageCResult.campaignResults.values()) {
                for (const finding of agentResult.findings) {
                    findings.push({
                        vectorId: finding.vectorId,
                        vectorType: 'AGENT_FINDING',
                        severity: finding.severity,
                        description: finding.description,
                        confidence: finding.reproScore,
                    });
                    // Vote from agent
                    votes.push({
                        voterId: `AGENT_${agentResult.agentId}`,
                        decision: finding.severity >= 0.8 ? 'BLOCK' : finding.severity >= 0.5 ? 'WARN' : 'ALLOW',
                        confidence: finding.reproScore,
                        reasoning: `${agentResult.agentId} agent: ${finding.description}`,
                    });
                }
            }
        }
        // Consensus: aggregate votes
        const decision = this.aggregateVotes(votes);
        const confidence = this.computeConfidence(votes);
        const band = this.mapDecisionToBand(decision, confidence);
        const attestation = {
            protocolId,
            decision,
            confidence,
            findings,
            attestationTime: Date.now(),
            stageDConfig: JSON.stringify(this.config),
        };
        return {
            stageId: 'D',
            statusCode: 200,
            decision,
            confidence,
            attestation,
            votes,
            aggregatedBand: band,
            fusionTime: performance.now() - startTime,
            executedAt: Date.now(),
        };
    }
    aggregateVotes(votes) {
        if (votes.length === 0)
            return 'ALLOW';
        const tally = { BLOCK: 0, WARN: 0, ALLOW: 0, INVESTIGATE: 0 };
        for (const vote of votes) {
            tally[vote.decision] += vote.confidence;
        }
        const total = votes.reduce((sum, v) => sum + v.confidence, 0);
        const thresholdVotes = total * this.config.consensusThreshold;
        if (tally.BLOCK >= thresholdVotes)
            return 'BLOCK';
        if (tally.WARN >= thresholdVotes)
            return 'WARN';
        if (tally.INVESTIGATE > 0 && tally.INVESTIGATE >= thresholdVotes)
            return 'INVESTIGATE';
        return 'ALLOW';
    }
    computeConfidence(votes) {
        if (votes.length === 0)
            return 0;
        return votes.reduce((sum, v) => sum + v.confidence, 0) / votes.length;
    }
    mapDecisionToBand(decision, confidence) {
        const baseScore = decision === 'BLOCK' ? 1.0 : decision === 'WARN' ? 0.6 : decision === 'INVESTIGATE' ? 0.4 : 0.1;
        return {
            band: decision,
            score: baseScore * confidence,
            confidence,
            escalationPath: decision === 'BLOCK' ? ['ALERT_OPS', 'CANCEL_TXN', 'NOTIFY_ECOSYSTEM'] : [],
        };
    }
}
exports.StageD = StageD;
