/**
 * HEPAR - stageB-symbolic.ts
 * Tier: ADVISORY (fixture-verified only, not live-telemetry-verified)
 *
 * Stage B - Bounded Symbolic Proving (NON-OPTIONAL).
 * Dropping this stage reduces Hepar to fuzzing-only and is a tier-discipline
 * violation. Stage B provides forensic-fidelity claims beyond stochastic
 * confidence.
 *
 * Runs targeted symbolic/concolic checks on four invariant classes:
 *   AUTHORIZATION    - onlyOwner, role transfer, pause/unpause rights
 *   UPGRADE          - implementation/auth/timelock constraints
 *   ACCOUNTING       - reserve conservation, debt/mint/burn bounds
 *   REENTRANCY_STATE - call graph / state mutation ordering
 *
 * NOT full symbolic execution of arbitrary code (intractable for DeFi).
 * Bounded checks on critical surfaces only.
 *
 * ADVISORY-TIER ENGINE STUB:
 * Live engines (Halmos, Manticore, Mythril, custom EVM prover) are not yet
 * integrated. The stub:
 *   - Defaults to 'unknown/timeout' for everything it cannot resolve
 *   - Never silently returns 'proved-safe' (false validation)
 *   - Accepts injected counterexamples and proved-safe results for testing
 *   - Marks every result with engineStatus: 'STUB' | 'LIVE'
 *   - Is structured so replacing the engine adapter requires no restructuring
 *
 * PROOFTERM MAPPING (binding - must match vectorScoring.ts):
 *   'counterexample-found' -> 1
 *   'unknown/timeout'      -> 0.5
 *   'proved-safe'          -> 0
 *
 * HARD-BLOCK ESCALATION:
 * Any counterexample-found on AUTHORIZATION or UPGRADE invariants sets
 * hardBlockFromSymbolic = true. This is deterministic evidence, not
 * probabilistic - it must not be averaged away by Stage D consensus.
 */

import type { SymbolicResult } from '../../types/hepar.types';

// ---------------------------------------------------------------------------
// Invariant class taxonomy
// ---------------------------------------------------------------------------

export type InvariantClass =
  | 'AUTHORIZATION'
  | 'UPGRADE'
  | 'ACCOUNTING'
  | 'REENTRANCY_STATE';

// ---------------------------------------------------------------------------
// Output types
// ---------------------------------------------------------------------------

export interface SymbolicInvariantResult {
  invariantClass: InvariantClass;
  invariantId: string;
  description: string;
  result: SymbolicResult;
  /** proofterm: counterexample-found=1, unknown/timeout=0.5, proved-safe=0 */
  proofterm: 0 | 0.5 | 1;
  /** Violating call sequence. Populated only when result = counterexample-found. */
  counterexample?: string[];
  /** Elapsed time in ms. Populated only when result = unknown/timeout. */
  timeoutMs?: number;
  /** STUB in Advisory tier. LIVE when a real engine adapter is connected. */
  engineStatus: 'STUB' | 'LIVE';
}

export interface StageBResult {
  invariantResults: SymbolicInvariantResult[];
  summary: {
    provedSafe: number;
    counterexamplesFound: number;
    unknownTimeout: number;
    totalChecked: number;
  };
  /**
   * True if any AUTHORIZATION or UPGRADE invariant returned counterexample-found.
   * Deterministic hard-block signal fed to Stage D - not averaged with stochastic score.
   */
  hardBlockFromSymbolic: boolean;
  stageBRunId: string;
  completedAt: number;
  /** STUB in Advisory tier. */
  engineStatus: 'STUB' | 'LIVE';
}

// ---------------------------------------------------------------------------
// Invariant definition catalogue
// All default invariants checked by Stage B. In production, per-protocol
// invariants would be derived from the bytecode/ABI under analysis.
// ---------------------------------------------------------------------------

export interface InvariantDefinition {
  invariantId: string;
  invariantClass: InvariantClass;
  description: string;
}

export const DEFAULT_INVARIANTS: InvariantDefinition[] = [
  // -- AUTHORIZATION --
  {
    invariantId: 'AUTH-001',
    invariantClass: 'AUTHORIZATION',
    description:
      'Only authorized address(es) can call privileged functions (onlyOwner, onlyRole)',
  },
  {
    invariantId: 'AUTH-002',
    invariantClass: 'AUTHORIZATION',
    description: 'Role transfer cannot be executed by a non-owner caller',
  },
  {
    invariantId: 'AUTH-003',
    invariantClass: 'AUTHORIZATION',
    description: 'Pause/unpause cannot be triggered by an arbitrary (unprivileged) caller',
  },
  {
    invariantId: 'AUTH-004',
    invariantClass: 'AUTHORIZATION',
    description: 'No execution path exists where an unprivileged caller reaches privileged state',
  },

  // -- UPGRADE --
  {
    invariantId: 'UPGRADE-001',
    invariantClass: 'UPGRADE',
    description:
      'Implementation address cannot be changed without satisfying the configured timelock',
  },
  {
    invariantId: 'UPGRADE-002',
    invariantClass: 'UPGRADE',
    description: 'ProxyAdmin cannot be transferred without satisfying governance threshold',
  },
  {
    invariantId: 'UPGRADE-003',
    invariantClass: 'UPGRADE',
    description: 'No upgrade path exists that bypasses the authorization constraint',
  },
  {
    invariantId: 'UPGRADE-004',
    invariantClass: 'UPGRADE',
    description: 'Storage layout is preserved across any upgrade operation (where detectable)',
  },

  // -- ACCOUNTING --
  {
    invariantId: 'ACCT-001',
    invariantClass: 'ACCOUNTING',
    description:
      'Total protocol reserves never decrease without a corresponding authorized withdrawal event',
  },
  {
    invariantId: 'ACCT-002',
    invariantClass: 'ACCOUNTING',
    description: 'Protocol debt cannot exceed the defined ceiling at any reachable state',
  },
  {
    invariantId: 'ACCT-003',
    invariantClass: 'ACCOUNTING',
    description: 'Token minting cannot produce supply beyond the configured cap',
  },
  {
    invariantId: 'ACCT-004',
    invariantClass: 'ACCOUNTING',
    description: 'Token burn cannot destroy more than the balance held by the calling address',
  },
  {
    invariantId: 'ACCT-005',
    invariantClass: 'ACCOUNTING',
    description:
      'Reserve conservation: opening_balance + deposits == closing_balance + withdrawals',
  },

  // -- REENTRANCY_STATE --
  {
    invariantId: 'REENT-001',
    invariantClass: 'REENTRANCY_STATE',
    description:
      'No external call is made before state mutation is finalized (checks-effects-interactions)',
  },
  {
    invariantId: 'REENT-002',
    invariantClass: 'REENTRANCY_STATE',
    description:
      'State machine cannot reach an invalid transition (e.g. PAUSED -> ACTIVE without auth)',
  },
  {
    invariantId: 'REENT-003',
    invariantClass: 'REENTRANCY_STATE',
    description:
      'A reentrant call cannot produce a different post-state outcome than a non-reentrant call',
  },
];

// ---------------------------------------------------------------------------
// Proofterm helper (mirrors vectorScoring.ts - binding mapping)
// ---------------------------------------------------------------------------

export function symbolicProofterm(result: SymbolicResult): 0 | 0.5 | 1 {
  switch (result) {
    case 'counterexample-found': return 1;
    case 'unknown/timeout':      return 0.5;
    case 'proved-safe':          return 0;
    default: {
      const _exhaustive: never = result;
      throw new Error(`Unhandled SymbolicResult: ${_exhaustive}`);
    }
  }
}

// ---------------------------------------------------------------------------
// Engine adapter interface
// Swap in a live adapter (Halmos, Manticore, custom EVM prover) without
// restructuring the stage. Advisory tier uses AdvisoryStubEngine.
// ---------------------------------------------------------------------------

export interface EngineAdapterResult {
  result: SymbolicResult;
  counterexample?: string[];
  timeoutMs?: number;
  engineStatus: 'STUB' | 'LIVE';
}

export interface EngineAdapter {
  check(invariant: InvariantDefinition): EngineAdapterResult;
}

// ---------------------------------------------------------------------------
// Advisory-tier stub engine
// ---------------------------------------------------------------------------

export interface AdvisoryStubOptions {
  /**
   * Map from invariantId to violating call sequence.
   * Invariants present here will return 'counterexample-found'.
   */
  knownCounterexamples?: Map<string, string[]>;
  /**
   * Set of invariantIds known to be proved-safe (test injection only).
   * Invariants present here will return 'proved-safe'.
   * knownCounterexamples takes priority if the same id appears in both.
   */
  knownProvedSafe?: Set<string>;
  /**
   * Simulated elapsed ms for unknown/timeout results (default: 30000).
   */
  defaultTimeoutMs?: number;
}

/**
 * AdvisoryStubEngine
 *
 * Honest stub: returns unknown/timeout for everything it has not been told
 * about. Never claims proved-safe unless explicitly injected. Never claims
 * counterexample-found unless explicitly injected.
 *
 * This is the correct Advisory-tier default because claiming proved-safe
 * without actually running a prover would be false validation.
 */
export class AdvisoryStubEngine implements EngineAdapter {
  private readonly counterexamples: Map<string, string[]>;
  private readonly provedSafe: Set<string>;
  private readonly timeoutMs: number;

  constructor(options: AdvisoryStubOptions = {}) {
    this.counterexamples = options.knownCounterexamples ?? new Map();
    this.provedSafe      = options.knownProvedSafe      ?? new Set();
    this.timeoutMs       = options.defaultTimeoutMs     ?? 30_000;
  }

  check(invariant: InvariantDefinition): EngineAdapterResult {
    // Priority: explicit counterexample > explicit proved-safe > unknown/timeout
    if (this.counterexamples.has(invariant.invariantId)) {
      return {
        result: 'counterexample-found',
        counterexample: this.counterexamples.get(invariant.invariantId)!,
        engineStatus: 'STUB',
      };
    }
    if (this.provedSafe.has(invariant.invariantId)) {
      return {
        result: 'proved-safe',
        engineStatus: 'STUB',
      };
    }
    // Default: honest unknown - we have not actually checked this
    return {
      result: 'unknown/timeout',
      timeoutMs: this.timeoutMs,
      engineStatus: 'STUB',
    };
  }
}

// ---------------------------------------------------------------------------
// runStageB - main entry point
// ---------------------------------------------------------------------------

export interface StageBInput {
  /**
   * Invariants to check. Defaults to DEFAULT_INVARIANTS if not supplied.
   * Pass a custom list to restrict to protocol-specific invariants.
   */
  invariants?: InvariantDefinition[];
  /**
   * Engine adapter to use. Defaults to AdvisoryStubEngine (unknown/timeout).
   * Inject a configured stub (with counterexamples/proved-safe maps) for
   * testing, or a live engine adapter for production use.
   */
  engine?: EngineAdapter;
  /** Optional run identifier; generated if not provided. */
  runId?: string;
}

/**
 * runStageB
 *
 * Orchestrates bounded symbolic proving over all invariant classes.
 * Hard-block escalation: any AUTHORIZATION or UPGRADE counterexample-found
 * sets hardBlockFromSymbolic=true regardless of composite score.
 *
 * The engine adapter is the only seam that changes between Advisory stub and
 * live production. All orchestration, escalation, and output structuring
 * remain identical regardless of which engine runs.
 */
export function runStageB(input: StageBInput = {}): StageBResult {
  const invariants = input.invariants ?? DEFAULT_INVARIANTS;
  const engine     = input.engine     ?? new AdvisoryStubEngine();
  const runId      = input.runId      ?? `stageB-${Date.now()}-advisory`;

  // Determine overall engineStatus: LIVE only if ALL results are LIVE
  // (mixed would mean partial live coverage - safer to flag STUB)
  let allLive = true;

  const invariantResults: SymbolicInvariantResult[] = invariants.map((inv) => {
    const engineResult = engine.check(inv);

    if (engineResult.engineStatus !== 'LIVE') allLive = false;

    const result: SymbolicInvariantResult = {
      invariantClass: inv.invariantClass,
      invariantId:    inv.invariantId,
      description:    inv.description,
      result:         engineResult.result,
      proofterm:      symbolicProofterm(engineResult.result),
      engineStatus:   engineResult.engineStatus,
    };

    if (engineResult.result === 'counterexample-found' && engineResult.counterexample) {
      result.counterexample = engineResult.counterexample;
    }
    if (engineResult.result === 'unknown/timeout' && engineResult.timeoutMs !== undefined) {
      result.timeoutMs = engineResult.timeoutMs;
    }

    return result;
  });

  // Summary counts
  let provedSafe          = 0;
  let counterexamplesFound = 0;
  let unknownTimeout      = 0;
  let hardBlockFromSymbolic = false;

  for (const r of invariantResults) {
    switch (r.result) {
      case 'proved-safe':          provedSafe++;           break;
      case 'counterexample-found': counterexamplesFound++; break;
      case 'unknown/timeout':      unknownTimeout++;       break;
    }

    // Hard-block escalation: AUTHORIZATION or UPGRADE counterexample is
    // deterministic evidence - must not be averaged away by Stage D
    if (
      r.result === 'counterexample-found' &&
      (r.invariantClass === 'AUTHORIZATION' || r.invariantClass === 'UPGRADE')
    ) {
      hardBlockFromSymbolic = true;
    }
  }

  return {
    invariantResults,
    summary: {
      provedSafe,
      counterexamplesFound,
      unknownTimeout,
      totalChecked: invariantResults.length,
    },
    hardBlockFromSymbolic,
    stageBRunId: runId,
    completedAt: Date.now(),
    engineStatus: allLive ? 'LIVE' : 'STUB',
  };
}
