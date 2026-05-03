"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildHeparConsensusSnapshot = void 0;
function clamp01(value) {
    return Math.max(0, Math.min(1, value));
}
function clamp100(value) {
    return Math.max(0, Math.min(100, value));
}
function severityScore(severity) {
    switch (severity) {
        case 'low':
            return 2;
        case 'medium':
            return 5;
        case 'high':
            return 8;
        case 'critical':
            return 10;
    }
}
function maxSeverity(a, b) {
    return severityScore(a) >= severityScore(b) ? a : b;
}
function proofTerm(status) {
    switch (status) {
        case 'counterexample':
            return 1;
        case 'unknown':
            return 0.5;
        case 'proved_safe':
            return 0;
    }
}
function decisionBand(score) {
    if (score <= 19)
        return 'allow';
    if (score <= 39)
        return 'guarded_allow';
    if (score <= 59)
        return 'restricted';
    if (score <= 79)
        return 'deny';
    return 'hard_block';
}
function confidence(meanCoverage, unknownSymbolicRatio, maxConsensusRate) {
    if (meanCoverage >= 0.8 && unknownSymbolicRatio <= 0.2 && maxConsensusRate >= 0.8) {
        return 'high';
    }
    if (meanCoverage >= 0.6 && unknownSymbolicRatio <= 0.5) {
        return 'medium';
    }
    return 'low';
}
function findingKey(finding) {
    return finding.vectorId.trim().toLowerCase();
}
function summarizeCampaign(campaign) {
    const totalAgents = campaign.agentRuns.length;
    const totalSamples = campaign.agentRuns.reduce((sum, run) => sum + Math.max(0, run.pathSamples), 0);
    const meanCoverage = totalAgents === 0
        ? 0
        : clamp01(campaign.agentRuns.reduce((sum, run) => sum + clamp01(run.coverage), 0) / totalAgents);
    const symbolicVerdicts = new Map();
    for (const verdict of campaign.symbolicVerdicts || []) {
        symbolicVerdicts.set(verdict.vectorId.trim().toLowerCase(), verdict.status);
    }
    const vectors = new Map();
    for (const run of campaign.agentRuns) {
        const seenInRun = new Set();
        for (const finding of run.findings) {
            const key = findingKey(finding);
            if (!key)
                continue;
            let aggregate = vectors.get(key);
            if (!aggregate) {
                aggregate = {
                    vectorId: finding.vectorId,
                    title: finding.title,
                    severity: finding.severity,
                    estimatedLossUsd: Math.max(0, finding.estimatedLossUsd || 0),
                    agents: new Set(),
                    reproducibleAgents: new Set(),
                };
                vectors.set(key, aggregate);
            }
            aggregate.severity = maxSeverity(aggregate.severity, finding.severity);
            aggregate.estimatedLossUsd = Math.max(aggregate.estimatedLossUsd, Math.max(0, finding.estimatedLossUsd || 0));
            if (!aggregate.title && finding.title) {
                aggregate.title = finding.title;
            }
            if (!seenInRun.has(key)) {
                aggregate.agents.add(run.agentId);
                if (finding.reproducible) {
                    aggregate.reproducibleAgents.add(run.agentId);
                }
                seenInRun.add(key);
            }
        }
    }
    const vectorResults = [];
    for (const [key, aggregate] of vectors.entries()) {
        const severity = aggregate.severity;
        const sevScore = severityScore(severity);
        const agentsFound = aggregate.agents.size;
        const consensusRate = totalAgents === 0 ? 0 : clamp01(agentsFound / totalAgents);
        const reproducibilityRate = agentsFound === 0 ? 0 : clamp01(aggregate.reproducibleAgents.size / agentsFound);
        const symbolicStatus = symbolicVerdicts.get(key) || 'unknown';
        const term = proofTerm(symbolicStatus);
        const riskContribution = sevScore * (0.55 * consensusRate + 0.25 * reproducibilityRate + 0.2 * term);
        vectorResults.push({
            vectorId: aggregate.vectorId,
            title: aggregate.title || aggregate.vectorId,
            severity,
            severityScore: sevScore,
            agentsFound,
            totalAgents,
            consensusRate,
            reproducibilityRate,
            symbolicStatus,
            proofTerm: term,
            estimatedLossUsd: aggregate.estimatedLossUsd,
            riskContribution: Math.round(riskContribution * 1000) / 1000,
        });
    }
    vectorResults.sort((a, b) => b.riskContribution - a.riskContribution);
    const baseRisk = vectorResults.reduce((sum, vector) => sum + vector.riskContribution, 0) * 3;
    const criticalBonus = vectorResults
        .filter((vector) => vector.consensusRate === 1)
        .reduce((sum, vector) => sum + vector.severityScore * 0.5, 0);
    const unknownCount = vectorResults.filter((vector) => vector.symbolicStatus === 'unknown').length;
    const unknownSymbolicRatio = vectorResults.length === 0 ? 0 : unknownCount / vectorResults.length;
    const coveragePenalty = meanCoverage < 0.6 ? (0.6 - meanCoverage) * 20 : 0;
    const unknownPenalty = unknownSymbolicRatio * 10;
    const riskScore = clamp100(baseRisk + criticalBonus + coveragePenalty + unknownPenalty);
    const maxConsensusRate = vectorResults.length === 0
        ? 0
        : vectorResults.reduce((max, vector) => Math.max(max, vector.consensusRate), 0);
    return {
        campaignId: campaign.id,
        protocolId: campaign.protocolId,
        codeHash: campaign.codeHash,
        totalAgents,
        totalSamples,
        meanCoverage,
        unknownSymbolicRatio,
        riskScore: Math.round(riskScore * 1000) / 1000,
        decisionBand: decisionBand(riskScore),
        consensusConfidence: confidence(meanCoverage, unknownSymbolicRatio, maxConsensusRate),
        vectors: vectorResults,
        criticalVectors: vectorResults
            .filter((vector) => vector.consensusRate >= 0.8 && vector.severityScore >= 8)
            .map((vector) => vector.vectorId),
        attestation: {
            heparRunId: `hepar-${campaign.id}`,
            evidenceRoot: `pending:${campaign.codeHash}`,
            postedOnChain: false,
        },
    };
}
function buildHeparConsensusSnapshot(campaigns) {
    const results = campaigns.map(summarizeCampaign);
    const decisionBandCounts = {
        allow: 0,
        guarded_allow: 0,
        restricted: 0,
        deny: 0,
        hard_block: 0,
    };
    for (const result of results) {
        decisionBandCounts[result.decisionBand] += 1;
    }
    return {
        implemented: true,
        campaignCount: results.length,
        decisionBandCounts,
        results,
    };
}
exports.buildHeparConsensusSnapshot = buildHeparConsensusSnapshot;
//# sourceMappingURL=hepar-consensus.js.map