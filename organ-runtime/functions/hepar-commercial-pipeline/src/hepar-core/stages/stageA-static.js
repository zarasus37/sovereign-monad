"use strict";
/**
 * HEPAR - stageA-static.ts
 * Tier: ADVISORY (fixture-verified only, not live-telemetry-verified)
 *
 * Stage A - Static Forensics: deterministic prefilter over protocol surfaces.
 *
 * Four surfaces analysed:
 *   BYTECODE_PRIVILEGE - onlyOwner, admin, pause/unpause checks
 *   PROXY_ADMIN        - proxy type, ProxyAdmin controller, upgrade authority
 *   LP_UNLOCK          - LP holder distribution, unlock timeline, Gini coefficient
 *   WALLET_TAINT       - deployer tx history, cluster linkage
 *                        *** REQUIRES dedicated chain analytics pipeline ***
 *                        Advisory tier stub returns PIPELINE_REQUIRED always.
 *                        Do NOT substitute a mock clean value.
 *
 * Scoring deduction model (per surface, start = 100):
 *   severity 8-10 -> deduct 30
 *   severity 5-7  -> deduct 15
 *   severity 1-4  -> deduct 5
 *   floor at 0
 *
 * Output: StageAResult
 *   hardBlockCandidates - findings with severity >= 8 or hardBlock flag set
 *   weightedFindings    - all findings ordered by severity desc
 *   dimensionScores     - per-surface scores (0-100)
 *   dataSourceStatus    - PIPELINE_REQUIRED for WALLET_TAINT in Advisory tier
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.deductForSeverity = deductForSeverity;
exports.computeSurfaceScore = computeSurfaceScore;
exports.walletTaintAdvisoryStub = walletTaintAdvisoryStub;
exports.runStageA = runStageA;
// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------
const SEVERITY_CRITICAL_THRESHOLD = 8;
function deductForSeverity(severity) {
    if (severity < 0 || severity > 10) {
        throw new RangeError(`severity must be in [0, 10], got ${severity}`);
    }
    if (severity >= 8)
        return 30;
    if (severity >= 5)
        return 15;
    if (severity >= 1)
        return 5;
    return 0;
}
function computeSurfaceScore(findings, surface) {
    const surfaceFindings = findings.filter((f) => f.surface === surface);
    const totalDeduction = surfaceFindings.reduce((sum, f) => sum + deductForSeverity(f.severity), 0);
    return Math.max(0, 100 - totalDeduction);
}
function walletTaintAdvisoryStub() {
    return {
        score: 50,
        status: 'PIPELINE_REQUIRED',
        findings: [
            {
                surface: 'WALLET_TAINT',
                severity: 0,
                description: 'Wallet graph taint analysis requires a dedicated chain analytics ' +
                    'pipeline (Chainalysis, TRM, Arkham, or independent ingestion). ' +
                    'Score is provisional (50/neutral). Do NOT treat as assessed clean.',
                evidence: [
                    'Advisory tier: PIPELINE_REQUIRED',
                    'Dedicated subprogram not connected',
                ],
                hardBlock: false,
                dataSourceStatus: 'PIPELINE_REQUIRED',
            },
        ],
    };
}
function runStageA(findings, runId) {
    for (const f of findings) {
        if (f.severity < 0 || f.severity > 10) {
            throw new RangeError(`StageAFinding severity must be in [0, 10], got ${f.severity} for "${f.description}"`);
        }
    }
    const analysedFindings = findings.filter((f) => f.surface !== 'WALLET_TAINT');
    const walletTaintResult = walletTaintAdvisoryStub();
    const allFindings = [...analysedFindings, ...walletTaintResult.findings];
    const hardBlockCandidates = allFindings.filter((f) => f.hardBlock || f.severity >= SEVERITY_CRITICAL_THRESHOLD);
    const weightedFindings = [...allFindings].sort((a, b) => b.severity - a.severity);
    const dimensionScores = {
        byteCodePrivilege: computeSurfaceScore(analysedFindings, 'BYTECODE_PRIVILEGE'),
        proxyAdmin: computeSurfaceScore(analysedFindings, 'PROXY_ADMIN'),
        lpUnlock: computeSurfaceScore(analysedFindings, 'LP_UNLOCK'),
        walletTaint: walletTaintResult.score,
    };
    return {
        hardBlockCandidates,
        weightedFindings,
        dimensionScores,
        dataSourceStatus: {
            walletTaint: walletTaintResult.status,
        },
        stageARunId: runId ?? `stageA-${Date.now()}-advisory`,
        completedAt: Date.now(),
    };
}
