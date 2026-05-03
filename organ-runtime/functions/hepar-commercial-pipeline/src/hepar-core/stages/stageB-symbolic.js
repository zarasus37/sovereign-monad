"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvisoryStubEngine = exports.DEFAULT_INVARIANTS = void 0;
exports.symbolicProofterm = symbolicProofterm;
exports.runStageB = runStageB;
exports.DEFAULT_INVARIANTS = [
    {
        invariantId: 'AUTH-001',
        invariantClass: 'AUTHORIZATION',
        description: 'Only authorized address(es) can call privileged functions (onlyOwner, onlyRole)',
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
    {
        invariantId: 'UPGRADE-001',
        invariantClass: 'UPGRADE',
        description: 'Implementation address cannot be changed without satisfying the configured timelock',
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
    {
        invariantId: 'ACCT-001',
        invariantClass: 'ACCOUNTING',
        description: 'Total protocol reserves never decrease without a corresponding authorized withdrawal event',
    },
    {
        invariantId: 'ACCT-002',
        invariantClass: 'ACCOUNTING',
        description: 'Protocol debt cannot exceed the defined ceiling at any reachable state',
    },
    {
        invariantId: 'ACCT-003',
        invariantClass: 'ACCOUNTING',
        description: 'Token minting cannot produce supply beyond the defined cap',
    },
    {
        invariantId: 'ACCT-004',
        invariantClass: 'ACCOUNTING',
        description: 'Token burn cannot destroy more than the balance held by the calling address',
    },
    {
        invariantId: 'ACCT-005',
        invariantClass: 'ACCOUNTING',
        description: 'Reserve conservation: opening_balance + deposits == closing_balance + withdrawals',
    },
    {
        invariantId: 'REENT-001',
        invariantClass: 'REENTRANCY_STATE',
        description: 'No external call is made before state mutation is finalized (checks-effects-interactions)',
    },
    {
        invariantId: 'REENT-002',
        invariantClass: 'REENTRANCY_STATE',
        description: 'State machine cannot reach an invalid transition (e.g. PAUSED -> ACTIVE without auth)',
    },
    {
        invariantId: 'REENT-003',
        invariantClass: 'REENTRANCY_STATE',
        description: 'A reentrant call cannot produce a different post-state outcome than a non-reentrant call',
    },
];
function symbolicProofterm(result) {
    switch (result) {
        case 'counterexample-found':
            return 1;
        case 'unknown/timeout':
            return 0.5;
        case 'proved-safe':
            return 0;
        default: {
            const _exhaustive = result;
            throw new Error(`Unhandled SymbolicResult: ${_exhaustive}`);
        }
    }
}
class AdvisoryStubEngine {
    counterexamples;
    provedSafe;
    timeoutMs;
    constructor(options = {}) {
        this.counterexamples = options.knownCounterexamples ?? new Map();
        this.provedSafe = options.knownProvedSafe ?? new Set();
        this.timeoutMs = options.defaultTimeoutMs ?? 30_000;
    }
    check(invariant) {
        if (this.counterexamples.has(invariant.invariantId)) {
            return {
                result: 'counterexample-found',
                counterexample: this.counterexamples.get(invariant.invariantId),
                engineStatus: 'STUB',
            };
        }
        if (this.provedSafe.has(invariant.invariantId)) {
            return {
                result: 'proved-safe',
                engineStatus: 'STUB',
            };
        }
        return {
            result: 'unknown/timeout',
            timeoutMs: this.timeoutMs,
            engineStatus: 'STUB',
        };
    }
}
exports.AdvisoryStubEngine = AdvisoryStubEngine;
function runStageB(input = {}) {
    const invariants = input.invariants ?? exports.DEFAULT_INVARIANTS;
    const engine = input.engine ?? new AdvisoryStubEngine();
    const runId = input.runId ?? `stageB-${Date.now()}-advisory`;
    let allLive = true;
    const invariantResults = invariants.map((inv) => {
        const engineResult = engine.check(inv);
        if (engineResult.engineStatus !== 'LIVE')
            allLive = false;
        const result = {
            invariantClass: inv.invariantClass,
            invariantId: inv.invariantId,
            description: inv.description,
            result: engineResult.result,
            proofterm: symbolicProofterm(engineResult.result),
            engineStatus: engineResult.engineStatus,
        };
        if (engineResult.result === 'counterexample-found' && engineResult.counterexample) {
            result.counterexample = engineResult.counterexample;
        }
        if (engineResult.result === 'unknown/timeout' && engineResult.timeoutMs !== undefined) {
            result.timeoutMs = engineResult.timeoutMs;
        }
        return result;
    });
    let provedSafe = 0;
    let counterexamplesFound = 0;
    let unknownTimeout = 0;
    let hardBlockFromSymbolic = false;
    for (const r of invariantResults) {
        switch (r.result) {
            case 'proved-safe':
                provedSafe++;
                break;
            case 'counterexample-found':
                counterexamplesFound++;
                break;
            case 'unknown/timeout':
                unknownTimeout++;
                break;
        }
        if (r.result === 'counterexample-found' &&
            (r.invariantClass === 'AUTHORIZATION' || r.invariantClass === 'UPGRADE')) {
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
