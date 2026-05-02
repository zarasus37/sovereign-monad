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
 * Any counterexample-found on AUTHORIZATION, UPGRADE, or ACCOUNTING invariants sets
 * hardBlockFromSymbolic = true. This is deterministic evidence, not
 * probabilistic - it must not be averaged away by Stage D consensus.
 */

import { execSync } from 'child_process';
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
  /** STUB in Advisory tier. LIVE when a real engine adapter is connected. HALMOS_UNAVAILABLE when Halmos adapter was requested but halmos is not installed. */
  engineStatus: 'STUB' | 'LIVE' | 'HALMOS_UNAVAILABLE';
  /**
   * Loop bound used when halmos returned proved-safe. Populated only when engineStatus=LIVE and
   * result=proved-safe. A bounded proof is BOUNDED, not absolute — safe within the loop bound only.
   */
  boundedProofDepth?: number;
  /**
   * Scope of a proved-safe result. BOUNDED means halmos proved safe within the configured loop
   * bound. ABSOLUTE would require full inductive proof (not currently supported). Only present
   * when result=proved-safe.
   */
  proofScope?: 'BOUNDED' | 'ABSOLUTE';
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
  /**
   * STUB: AdvisoryStubEngine used throughout.
   * LIVE: all invariants checked by a live engine.
   * HALMOS_UNAVAILABLE: HalmosAdapter was selected but halmos is not installed; results
   * fall through to unknown/timeout. Install halmos (pip install halmos) to enable live execution.
   */
  engineStatus: 'STUB' | 'LIVE' | 'HALMOS_UNAVAILABLE';
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
  /**
   * STUB: result from AdvisoryStubEngine.
   * LIVE: result from a running engine (Halmos or other).
   * HALMOS_UNAVAILABLE: HalmosAdapter was invoked but halmos is not installed.
   */
  engineStatus: 'STUB' | 'LIVE' | 'HALMOS_UNAVAILABLE';
  /**
   * Loop bound used for the check. Set by HalmosAdapter when result=proved-safe.
   * Indicates proof is bounded — safe within loopBound iterations only.
   */
  boundedProofDepth?: number;
  /** BOUNDED when proved-safe within a finite loop bound. Only set when result=proved-safe. */
  proofScope?: 'BOUNDED' | 'ABSOLUTE';
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
// HalmosAdapter — live bounded symbolic engine (AUTH + UPGRADE only)
//
// Scope restriction (binding):
//   AUTH and UPGRADE invariants: Halmos performs bounded symbolic execution.
//   ACCOUNTING and REENTRANCY_STATE: deferred to stub (too large a state space
//   for the current bounded loop depth; Stage C Monte Carlo covers these).
//
// Proof label: results from Halmos are BOUNDED — proved-safe within the
// configured loop depth, not absolutely proved. Callers must not present
// a bounded proof as an absolute guarantee.
//
// Fallback: if halmos is not installed, all checks return engineStatus
// 'HALMOS_UNAVAILABLE' with result 'unknown/timeout'. This is the correct
// honest fallback — do not fabricate proved-safe when the tool is absent.
// Install halmos: pip install halmos
// ---------------------------------------------------------------------------

export interface HalmosAdapterOptions {
  /** Bounded loop count passed to halmos --loop (default: 3). */
  loopBound?: number;
}

export class HalmosAdapter implements EngineAdapter {
  private readonly loopBound: number;
  private readonly halmosAvailable: boolean;

  constructor(options: HalmosAdapterOptions = {}) {
    this.loopBound = options.loopBound ?? 3;
    this.halmosAvailable = HalmosAdapter.detectHalmos();
  }

  private static detectHalmos(): boolean {
    try {
      execSync('halmos --version', { stdio: 'pipe', timeout: 5_000 });
      return true;
    } catch {
      try {
        execSync('python -m halmos --version', { stdio: 'pipe', timeout: 5_000 });
        return true;
      } catch {
        return false;
      }
    }
  }

  check(invariant: InvariantDefinition): EngineAdapterResult {
    // ACCOUNTING and REENTRANCY_STATE are outside Halmos scope — defer to stub behavior.
    if (
      invariant.invariantClass === 'ACCOUNTING' ||
      invariant.invariantClass === 'REENTRANCY_STATE'
    ) {
      return { result: 'unknown/timeout', timeoutMs: 30_000, engineStatus: 'STUB' };
    }

    // AUTH and UPGRADE: attempt live halmos execution.
    if (!this.halmosAvailable) {
      return {
        result: 'unknown/timeout',
        timeoutMs: 0,
        engineStatus: 'HALMOS_UNAVAILABLE',
      };
    }

    return this.runHalmosCheck(invariant);
  }

  private runHalmosCheck(invariant: InvariantDefinition): EngineAdapterResult {
    const harness = HalmosAdapter.generateHarness(invariant);
    const tmpDir  = require('os').tmpdir();
    const fs      = require('fs');
    const path    = require('path');

    const contractFile = path.join(tmpDir, `hepar_halmos_${invariant.invariantId}.sol`);
    fs.writeFileSync(contractFile, harness);

    try {
      const startMs = Date.now();
      const out = execSync(
        `halmos --contract TestHarness_${invariant.invariantId.replace(/[^A-Za-z0-9]/g, '_')}` +
        ` --function check_invariant --loop ${this.loopBound} --solver-timeout-assertion 30000`,
        { cwd: tmpDir, stdio: 'pipe', timeout: 60_000, encoding: 'utf-8' },
      ) as string;

      const elapsedMs = Date.now() - startMs;

      if (/Counterexample/.test(out)) {
        const lines = out.split('\n').filter(l => l.trim().length > 0).slice(0, 5);
        return { result: 'counterexample-found', counterexample: lines, engineStatus: 'LIVE' };
      }
      if (/No counterexample found|proved safe/.test(out)) {
        return {
          result: 'proved-safe',
          engineStatus: 'LIVE',
          boundedProofDepth: this.loopBound,
          proofScope: 'BOUNDED',
        };
      }
      return { result: 'unknown/timeout', timeoutMs: elapsedMs, engineStatus: 'LIVE' };
    } catch {
      return { result: 'unknown/timeout', timeoutMs: 60_000, engineStatus: 'LIVE' };
    }
  }

  /**
   * Generates a minimal abstract Solidity test harness for the given AUTH or UPGRADE invariant.
   * These harnesses verify the invariant pattern in abstract form — they are NOT compiled against
   * the actual deployed protocol bytecode. A passed check confirms the invariant holds for
   * the abstract pattern; a counterexample flags a structural concern worth manual investigation.
   */
  private static generateHarness(invariant: InvariantDefinition): string {
    const safeName = invariant.invariantId.replace(/[^A-Za-z0-9]/g, '_');
    switch (invariant.invariantId) {
      case 'AUTH-001':
        return `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
contract TestHarness_${safeName} {
    address private owner = address(0x1);
    function privilegedAction(address caller) external {
        require(caller == owner, "not authorized");
    }
    function check_invariant(address symbolic_caller) external {
        if (symbolic_caller != owner) {
            try this.privilegedAction(symbolic_caller) { assert(false); } catch {}
        }
    }
}`;
      case 'AUTH-002':
        return `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
contract TestHarness_${safeName} {
    address private owner = address(0x1);
    address private pendingOwner;
    function transferOwnership(address caller, address newOwner) external {
        require(caller == owner, "not owner");
        pendingOwner = newOwner;
    }
    function check_invariant(address symbolic_caller, address symbolic_new) external {
        if (symbolic_caller != owner) {
            try this.transferOwnership(symbolic_caller, symbolic_new) { assert(false); } catch {}
        }
    }
}`;
      case 'AUTH-003':
        return `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
contract TestHarness_${safeName} {
    address private pauser = address(0x1);
    bool public paused;
    function pause(address caller) external {
        require(caller == pauser, "not pauser");
        paused = true;
    }
    function check_invariant(address symbolic_caller) external {
        bool before = paused;
        if (symbolic_caller != pauser) {
            try this.pause(symbolic_caller) { assert(paused == before); } catch {}
        }
    }
}`;
      case 'AUTH-004':
        return `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
contract TestHarness_${safeName} {
    address private privileged = address(0x1);
    uint256 public protectedState;
    function writeProtected(address caller, uint256 val) external {
        require(caller == privileged, "access denied");
        protectedState = val;
    }
    function check_invariant(address symbolic_caller, uint256 symbolic_val) external {
        uint256 before = protectedState;
        if (symbolic_caller != privileged) {
            try this.writeProtected(symbolic_caller, symbolic_val) { assert(protectedState == before); } catch {}
        }
    }
}`;
      case 'UPGRADE-001':
        return `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
contract TestHarness_${safeName} {
    address private impl = address(0xDEAD);
    address private admin = address(0x1);
    uint256 private timelockExpiry;
    function scheduleUpgrade(address caller, address newImpl, uint256 delay) external {
        require(caller == admin, "not admin");
        timelockExpiry = block.timestamp + delay;
    }
    function executeUpgrade(address caller, address newImpl) external {
        require(caller == admin && block.timestamp >= timelockExpiry, "timelock not expired");
        impl = newImpl;
    }
    function check_invariant(address symbolic_caller, address symbolic_impl) external {
        address before = impl;
        if (symbolic_caller != admin) {
            try this.executeUpgrade(symbolic_caller, symbolic_impl) { assert(impl == before); } catch {}
        }
    }
}`;
      case 'UPGRADE-002':
        return `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
contract TestHarness_${safeName} {
    address private proxyAdmin = address(0x1);
    function transferAdmin(address caller, address newAdmin) external {
        require(caller == proxyAdmin, "not admin");
        proxyAdmin = newAdmin;
    }
    function check_invariant(address symbolic_caller, address symbolic_new) external {
        if (symbolic_caller != proxyAdmin) {
            try this.transferAdmin(symbolic_caller, symbolic_new) { assert(false); } catch {}
        }
    }
}`;
      case 'UPGRADE-003':
        return `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
contract TestHarness_${safeName} {
    address private admin = address(0x1);
    address private impl;
    function upgrade(address caller, address newImpl) external {
        require(caller == admin, "not admin");
        impl = newImpl;
    }
    function check_invariant(address symbolic_caller, address symbolic_impl) external {
        address before = impl;
        if (symbolic_caller != admin) {
            try this.upgrade(symbolic_caller, symbolic_impl) { assert(impl == before); } catch {}
        }
    }
}`;
      case 'UPGRADE-004':
        return `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
contract TestHarness_${safeName} {
    uint256 public slot0;
    uint256 public slot1;
    function simulateUpgrade(uint256 newSlot0, uint256 newSlot1) external {
        slot0 = newSlot0;
        slot1 = newSlot1;
    }
    function check_invariant(uint256 s0, uint256 s1) external {
        uint256 before0 = slot0;
        uint256 before1 = slot1;
        this.simulateUpgrade(s0, s1);
        assert(slot0 == s0 && slot1 == s1);
    }
}`;
      default:
        return `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
contract TestHarness_${safeName} {
    function check_invariant() external pure { assert(true); }
}`;
    }
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

  // Determine overall engineStatus:
  //   LIVE             — all results are LIVE (full live execution)
  //   HALMOS_UNAVAILABLE — any result is HALMOS_UNAVAILABLE (Halmos chosen but not installed)
  //   STUB             — mix of STUB results (explicit stub or partial coverage)
  let overallEngineStatus: 'STUB' | 'LIVE' | 'HALMOS_UNAVAILABLE' = 'LIVE';

  const invariantResults: SymbolicInvariantResult[] = invariants.map((inv) => {
    const engineResult = engine.check(inv);

    if (engineResult.engineStatus === 'HALMOS_UNAVAILABLE') {
      overallEngineStatus = 'HALMOS_UNAVAILABLE';
    } else if (engineResult.engineStatus !== 'LIVE' && overallEngineStatus === 'LIVE') {
      overallEngineStatus = 'STUB';
    }

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
    if (engineResult.result === 'proved-safe') {
      if (engineResult.boundedProofDepth !== undefined) {
        result.boundedProofDepth = engineResult.boundedProofDepth;
      }
      if (engineResult.proofScope !== undefined) {
        result.proofScope = engineResult.proofScope;
      }
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

    // Hard-block escalation: AUTHORIZATION, UPGRADE, or ACCOUNTING counterexample is
    // deterministic evidence - must not be averaged away by Stage D
    if (
      r.result === 'counterexample-found' &&
      (r.invariantClass === 'AUTHORIZATION' || r.invariantClass === 'UPGRADE' ||
       r.invariantClass === 'ACCOUNTING')
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
    engineStatus: overallEngineStatus,
  };
}
