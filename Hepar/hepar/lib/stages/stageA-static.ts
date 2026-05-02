/**
 * HEPAR - stageA-static.ts
 * Tier: ADVISORY (fixture-verified only, not live-telemetry-verified)
 *
 * Stage A - Static Forensics: deterministic prefilter over protocol surfaces.
 *
 * Six surfaces analysed:
 *   BYTECODE_PRIVILEGE   - onlyOwner, admin, pause/unpause checks
 *   PROXY_ADMIN          - proxy type, ProxyAdmin controller, upgrade authority
 *   LP_UNLOCK            - LP holder distribution, unlock timeline, Gini coefficient
 *   WALLET_TAINT         - deployer tx history, cluster linkage
 *                          *** REQUIRES dedicated chain analytics pipeline ***
 *                          Advisory tier stub returns PIPELINE_REQUIRED always.
 *                          Do NOT substitute a mock clean value.
 *   ACCOUNTING_INVARIANT - reserve conservation, solvency checks, debt ceiling enforcement,
 *                          unchecked transfer return values in balance-critical paths.
 *                          Hard-block: balance-modifying fn reachable without solvency check.
 *   INPUT_VALIDATION     - null/zero inputs accepted on fund-movement functions, missing
 *                          boundary validation on critical parameters (amount, address, root).
 *                          Hard-block: zero-value accepted on a function controlling fund movement.
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

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SurfaceType =
  | 'BYTECODE_PRIVILEGE'
  | 'PROXY_ADMIN'
  | 'LP_UNLOCK'
  | 'WALLET_TAINT'
  | 'ACCOUNTING_INVARIANT'
  | 'INPUT_VALIDATION';

export type DataSourceStatus = 'PIPELINE_REQUIRED' | 'LIVE';

export interface StageAFinding {
  surface: SurfaceType;
  severity: number;       // 0-10
  description: string;
  evidence: string[];
  hardBlock: boolean;
  /** Required for WALLET_TAINT findings; indicates pipeline availability */
  dataSourceStatus?: DataSourceStatus;
}

export interface StageAResult {
  /** Findings that are hard-block candidates (severity >= 8 OR hardBlock=true) */
  hardBlockCandidates: StageAFinding[];

  /** All findings, ordered by severity descending */
  weightedFindings: StageAFinding[];

  dimensionScores: {
    /** Dim 1 - Bytecode Privilege Score (0-100) */
    byteCodePrivilege: number;
    /** Dim 2 - Proxy-Admin Control Score (0-100) */
    proxyAdmin: number;
    /** Dim 3 - LP Unlock Concentration Score (0-100) */
    lpUnlock: number;
    /**
     * Dim 4 - Wallet Graph Taint Score (0-100).
     * Value is PROVISIONAL (50/neutral) when dataSourceStatus = PIPELINE_REQUIRED.
     * Do NOT treat provisional score as assessed clean.
     */
    walletTaint: number;
    /** Dim 5 - Accounting Invariant Score (0-100) */
    accountingInvariant: number;
    /** Dim 6 - Input Validation Score (0-100) */
    inputValidation: number;
  };

  dataSourceStatus: {
    /**
     * PIPELINE_REQUIRED in Advisory tier.
     * A dedicated chain analytics pipeline (Chainalysis/TRM/Arkham or
     * independent ingestion) must be connected before this score is live.
     */
    walletTaint: DataSourceStatus;
  };

  /** Unique identifier for this Stage A run */
  stageARunId: string;

  /** Unix ms timestamp of completion */
  completedAt: number;
}

// ---------------------------------------------------------------------------
// Scoring helpers
// ---------------------------------------------------------------------------

const SEVERITY_CRITICAL_THRESHOLD = 8;

/**
 * deductForSeverity - returns the point deduction for a single finding.
 * severity 8-10 -> 30
 * severity 5-7  -> 15
 * severity 1-4  -> 5
 * severity 0    -> 0 (informational, no deduction)
 */
export function deductForSeverity(severity: number): number {
  if (severity < 0 || severity > 10) {
    throw new RangeError(`severity must be in [0, 10], got ${severity}`);
  }
  if (severity >= 8) return 30;
  if (severity >= 5) return 15;
  if (severity >= 1) return 5;
  return 0;
}

/**
 * computeSurfaceScore - applies deductions for all findings on one surface.
 * Returns a score in [0, 100].
 */
export function computeSurfaceScore(findings: StageAFinding[], surface: SurfaceType): number {
  const surfaceFindings = findings.filter((f) => f.surface === surface);
  const totalDeduction = surfaceFindings.reduce(
    (sum, f) => sum + deductForSeverity(f.severity),
    0,
  );
  return Math.max(0, 100 - totalDeduction);
}

// ---------------------------------------------------------------------------
// Wallet Taint stub
// ---------------------------------------------------------------------------

/**
 * WALLET_TAINT ADVISORY STUB
 *
 * Returns PIPELINE_REQUIRED always. This is not a gap to fill later with a
 * trivial lookup - it represents a dedicated subprogram requirement.
 * The provisional score is 50 (neutral/unknown).
 *
 * Consuming code must check dataSourceStatus === 'PIPELINE_REQUIRED' and
 * surface this to operators before any allocation decision.
 */
export function walletTaintAdvisoryStub(): {
  score: number;
  status: DataSourceStatus;
  findings: StageAFinding[];
} {
  return {
    score: 50,
    status: 'PIPELINE_REQUIRED',
    findings: [
      {
        surface: 'WALLET_TAINT',
        severity: 0,
        description:
          'Wallet graph taint analysis requires a dedicated chain analytics ' +
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

// ---------------------------------------------------------------------------
// runStageA - main entry point
// ---------------------------------------------------------------------------

/**
 * runStageA
 *
 * Accepts pre-analysed findings for the BYTECODE_PRIVILEGE, PROXY_ADMIN, and
 * LP_UNLOCK surfaces (from static analysis tooling). WALLET_TAINT is always
 * handled by the advisory stub regardless of any findings passed in.
 *
 * In production this function would invoke bytecode analysis, proxy graph
 * resolution, and LP concentration analysis. In Advisory tier it processes
 * fixture findings supplied by the caller.
 *
 * @param findings - pre-analysed findings for BYTECODE_PRIVILEGE / PROXY_ADMIN /
 *                   LP_UNLOCK / ACCOUNTING_INVARIANT / INPUT_VALIDATION surfaces.
 *                   WALLET_TAINT findings are ignored if supplied (stub always overrides).
 * @param runId    - optional run identifier; generated if not provided
 */
export function runStageA(
  findings: StageAFinding[],
  runId?: string,
): StageAResult {
  // Validate inputs
  for (const f of findings) {
    if (f.severity < 0 || f.severity > 10) {
      throw new RangeError(
        `StageAFinding severity must be in [0, 10], got ${f.severity} for "${f.description}"`,
      );
    }
    if (f.surface === 'WALLET_TAINT') {
      // Silently drop caller-supplied WALLET_TAINT findings - stub always wins
      continue;
    }
  }

  // Partition: exclude WALLET_TAINT from caller findings
  const analysedFindings = findings.filter((f) => f.surface !== 'WALLET_TAINT');

  // Advisory stub for wallet taint
  const walletTaintResult = walletTaintAdvisoryStub();

  // Combine all findings for reporting
  const allFindings = [...analysedFindings, ...walletTaintResult.findings];

  // Hard-block candidates: severity >= 8 OR explicit hardBlock flag
  const hardBlockCandidates = allFindings.filter(
    (f) => f.hardBlock || f.severity >= SEVERITY_CRITICAL_THRESHOLD,
  );

  // Weighted findings: all, ordered by severity descending
  const weightedFindings = [...allFindings].sort((a, b) => b.severity - a.severity);

  // Dimension scores
  const dimensionScores = {
    byteCodePrivilege:   computeSurfaceScore(analysedFindings, 'BYTECODE_PRIVILEGE'),
    proxyAdmin:          computeSurfaceScore(analysedFindings, 'PROXY_ADMIN'),
    lpUnlock:            computeSurfaceScore(analysedFindings, 'LP_UNLOCK'),
    walletTaint:         walletTaintResult.score,
    accountingInvariant: computeSurfaceScore(analysedFindings, 'ACCOUNTING_INVARIANT'),
    inputValidation:     computeSurfaceScore(analysedFindings, 'INPUT_VALIDATION'),
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
