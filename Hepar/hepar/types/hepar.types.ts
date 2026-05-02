/**
 * HEPAR - Organ 1 of the Sovereign Monad Six-Organ Ecosystem
 * Core type definitions
 *
 * Tier: ADVISORY
 * All outputs are fixture-verified only, NOT live-telemetry-verified.
 * Do NOT claim live status for anything that is fixture-only.
 */

// ---------------------------------------------------------------------------
// SymbolicResult
// Three states, all required. Dropping any state is a tier-discipline
// violation per Stage B spec.
// ---------------------------------------------------------------------------

export type SymbolicResult =
  | 'proved-safe'
  | 'counterexample-found'
  | 'unknown/timeout';

// ---------------------------------------------------------------------------
// ConvergenceLabel
// Derived from how many of the 5 Monte Carlo agents independently surface
// the same finding.
//   5/5 -> CERTAIN   (100%)
//   4/5 -> HIGH      (80%)
//   3/5 -> PROBABLE  (60%)
//   2/5 -> POSSIBLE  (40%)
//   1/5 -> EDGE_CASE (20%)
// ---------------------------------------------------------------------------

export type ConvergenceLabel =
  | 'CERTAIN'
  | 'HIGH'
  | 'PROBABLE'
  | 'POSSIBLE'
  | 'EDGE_CASE';

// ---------------------------------------------------------------------------
// ActionBand
// Output of Stage D consensus fusion.
//   0-19   ALLOW
//   20-39  GUARDED_ALLOW
//   40-59  RESTRICTED
//   60-79  DENY
//   80-100 HARDBLOCK
//
// SINGLE-SCALAR PROHIBITION: never use ActionBand alone for go/no-go.
// Always accompany with top critical vectors, consensus rates, symbolic
// status, estimated loss bands, and coverage / unknown ratios.
// ---------------------------------------------------------------------------

export type ActionBand =
  | 'ALLOW'
  | 'GUARDED_ALLOW'
  | 'RESTRICTED'
  | 'DENY'
  | 'HARDBLOCK';

// ---------------------------------------------------------------------------
// RegistryStatus
//   GREEN  - continuously monitored, nothing critical (NOT "safe forever")
//   YELLOW - under active watch
//   RED    - high risk / do not allocate (requires independent reviewer)
//   BLACK  - confirmed scam/exploit (requires full legal posture)
// ---------------------------------------------------------------------------

export type RegistryStatus = 'GREEN' | 'YELLOW' | 'RED' | 'BLACK';

// ---------------------------------------------------------------------------
// TierLabel - operational tier of this Hepar run
// ---------------------------------------------------------------------------

export type TierLabel = 'ADVISORY' | 'DECISION_SUPPORT' | 'AUTHORITATIVE';

// ---------------------------------------------------------------------------
// FindingVector
// Atomic risk finding produced by one or more Monte Carlo agents and/or
// the deterministic / symbolic stages.
// ---------------------------------------------------------------------------

export interface FindingVector {
  /** Stable, unique identifier for this finding (e.g. "PRIV-001") */
  vectorId: string;

  /**
   * Severity on the 0-10 scale:
   *   9-10: CRITICAL (loss-of-funds, exploitable today)
   *   7-8:  HIGH     (exploitable under specific conditions)
   *   4-6:  MEDIUM   (theoretical / low-probability)
   *   1-3:  LOW
   *   0:    INFO
   */
  severity: number;

  /**
   * Fraction of agents that independently surfaced this vector.
   * consensus = agentsFound / totalAgents  in [0, 1]
   */
  consensus: number;

  /**
   * Reproducibility score in [0, 1].
   * Do independent reruns reproduce this finding?
   */
  repro: number;

  /**
   * Output of Stage B bounded symbolic proving for this vector's invariant.
   * proofterm mapping:
   *   'counterexample-found' -> 1.0
   *   'unknown/timeout'      -> 0.5
   *   'proved-safe'          -> 0.0
   */
  proofStatus: SymbolicResult;

  /**
   * Estimated maximum loss if exploited (planning band only -
   * no external pricing in Advisory tier).
   */
  estLoss: { low: number; high: number };

  /** How many agents independently found this vector (numerator of consensus) */
  agentsFound: number;

  /** Total agents in the ensemble (always 5 in current config) */
  totalAgents: number;

  /**
   * Trace / seed IDs for reproducibility reruns.
   * Must be populated for any severity >= 7 finding before publication.
   */
  reproducibilityTraceIds: string[];

  /** Human-readable description of the vector */
  description?: string;

  /** Exploit preconditions (e.g. "requires flashloan > $1M liquidity") */
  exploitPreconditions?: string[];

  /** Convergence label derived from consensus ratio */
  convergenceLabel?: ConvergenceLabel;
}

// ---------------------------------------------------------------------------
// SevenDimensionScores - all seven risk dimensions (0-100 each)
// ---------------------------------------------------------------------------

export interface SevenDimensionScores {
  /** Dim 1 - Bytecode Privilege Score (weight 20%) */
  privilegeScore: number;

  /**
   * Dim 2 - Proxy-Admin Control Score (weight 18%)
   * Proxy type, ProxyAdmin controller, signer count, upgrade delay.
   */
  proxyAdminScore: number;

  /**
   * Dim 3 - LP Unlock Concentration Score (weight 17%)
   * Gini coefficient, unlock timeline, deployer historical behavior.
   */
  lpUnlockScore: number;

  /**
   * Dim 4 - Wallet Graph Taint Score (weight 20%)
   * REQUIRES dedicated chain analytics pipeline (Chainalysis/TRM/Arkham or
   * independent ingestion). This is a dedicated subprogram, not a trivial
   * lookup. Value is null when pipeline is unavailable - do NOT substitute
   * a mock value.
   */
  walletTaintScore: number | null;

  /**
   * Dim 5 - Adversarial Execution Score (weight 15%)
   * Derived from Stage C Monte Carlo output.
   */
  adversarialScore: number;

  /**
   * Dim 6 - Economic Viability Score (weight 10%)
   * Yield source quality, revenue/emission ratio, governance participation.
   */
  economicViabilityScore: number;

  /**
   * Dim 7 - Composite Risk Score (weighted aggregate, 0-100)
   * Weights: privilege 20%, proxyAdmin 18%, lpUnlock 17%, walletTaint 20%,
   *          adversarial 15%, economicViability 10%
   * Computed by globalScore.ts - do not derive inline.
   */
  compositeScore: number;
}

// ---------------------------------------------------------------------------
// HeparRunResult - full output of one complete Hepar assessment pass
// ---------------------------------------------------------------------------

export interface HeparRunResult {
  /** Unique run identifier (UUID v4 recommended) */
  heparRunId: string;

  /** Protocol identifier (contract address or stable slug) */
  protocolId: string;

  /** All seven dimension scores */
  scores: SevenDimensionScores;

  /**
   * Global risk score (0-100), computed by Stage D consensus fusion.
   * SINGLE-SCALAR PROHIBITION: this field alone MUST NOT be used for go/no-go.
   */
  globalRiskScore: number;

  /**
   * Action band derived from globalRiskScore + top-vector escalation checks.
   * Must always be accompanied by topVectors when consumed.
   */
  actionBand: ActionBand;

  /**
   * Top finding vectors (ordered by risk contribution, descending).
   * Required for SINGLE-SCALAR PROHIBITION compliance.
   */
  topVectors: FindingVector[];

  /**
   * Merkle root of the full off-chain evidence package
   * (IPFS/Arweave reference for detailed traces).
   */
  evidenceRoot: string;

  /** Whether this result has been posted to Monad mainnet */
  postedOnChain: boolean;

  /** Tier label at time of this run - currently always ADVISORY */
  tierLabel: TierLabel;

  /** ISO-8601 timestamp of run completion */
  completedAt: string;

  /** Flow coverage ratio in [0, 1] from Stage C */
  coverageRatio: number;

  /**
   * Ratio of Stage B results that are unknown/timeout rather than
   * proved-safe or counterexample-found.
   */
  unknownRatio: number;

  /** Registry status at time of run */
  registryStatus: RegistryStatus;

  /** Whether the run was escalated to Cortex for review */
  cortexEscalated: boolean;
}

// ---------------------------------------------------------------------------
// AttestationPayload - compact on-chain record posted to Monad mainnet
//
// Monad's role: coordination and attestation path ONLY.
// Monad does NOT speed local CPU-bound symbolic or stochastic analysis.
// Do NOT conflate EVM transaction parallelism with off-chain compute.
// ---------------------------------------------------------------------------

export interface AttestationPayload {
  /** Protocol being assessed (address or stable slug) */
  protocolId: string;

  /** Keccak-256 hash of the assessed bytecode */
  codeHash: string;

  /** Hashes of all dependency contracts assessed in this run */
  dependencyHashes: string[];

  /** Unique run ID - must match HeparRunResult.heparRunId */
  heparRunId: string;

  /**
   * Global risk score at time of attestation (0-100).
   * On-chain record only - single-scalar prohibition still applies off-chain.
   */
  riskScore: number;

  /** Fingerprints + consensus rates for top vectors */
  topVectors: Array<{
    vectorId: string;
    severity: number;
    consensusRate: number;
    convergenceLabel: ConvergenceLabel;
  }>;

  /** Flow coverage ratio from Stage C in [0, 1] */
  coverageRatio: number;

  /** Stage B unknown/timeout ratio in [0, 1] */
  unknownRatio: number;

  /**
   * Merkle root referencing the full off-chain evidence package
   * (detailed traces on IPFS/Arweave).
   */
  evidenceMerkleRoot: string;

  /** Ordered list of signing addresses for this attestation */
  signerSet: string[];

  /** Minimum signatures required for a valid attestation */
  signerThreshold: number;

  /** ISO-8601 timestamp of attestation creation */
  attestedAt: string;
}
