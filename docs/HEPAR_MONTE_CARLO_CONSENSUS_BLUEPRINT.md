# Hepar Monte Carlo Consensus Blueprint (v1)

Date context: 2026-04-29

Purpose: define a production-grade Hepar architecture that uses parallel multi-agent stochastic analysis, bounded symbolic proving where feasible, and on-chain attestation of results.

## 1) Core Clarification: "prove safety" vs "estimate exploitability"

`Full symbolic execution mathematically prove safety` is not a reliable universal target for arbitrary DeFi systems because:

1. path/state space is combinatorial and often unbounded with external calls and dynamic environments
2. liveness and economic safety depend on off-chain and cross-protocol behavior that pure bytecode proof cannot fully capture
3. solver timeouts and model incompleteness can produce "unknown" outcomes at scale

Hepar should therefore use:

1. **hard proofs for bounded invariants** (critical surfaces)
2. **probabilistic exploit discovery** (broad surfaces)
3. **consensus confidence** across independent agents

This yields a defensible "assurance envelope" instead of false absolute safety claims.

## 2) Monad Fit (What It Accelerates)

Monad architectural characteristics (parallel execution, asynchronous execution, low block times, high throughput) help Hepar primarily in two ways:

1. **distribution and settlement path**: fast posting, retrieval, and attestation of Hepar outputs
2. **agent coordination path**: frequent batched consensus commits and low-cost evidence anchoring

Important boundary:

1. Monad does **not** automatically speed local CPU-bound analysis by itself
2. off-chain speed comes from your own parallel worker fleet and scheduler
3. Monad is the high-speed coordination + attestation substrate for those results

## 3) Hepar Analysis Stack (Hybrid)

### Stage A - Static Forensics (deterministic prefilter)

1. bytecode privilege checks
2. proxy-admin and upgrade authority graph
3. LP unlock and concentration timeline
4. taint and address-cluster linkage

Output: deterministic hard-block candidates + weighted deterministic findings.

### Stage B - Bounded Symbolic Proving (targeted)

Run symbolic/concolic checks on selected critical surfaces only:

1. authorization invariants (`onlyOwner`, role transfer, pause/unpause rights)
2. upgrade invariants (implementation/auth/timelock constraints)
3. accounting invariants (reserve conservation, debt bounds, mint/burn bounds)
4. reentrancy and state-transition invariants

Output: `proved`, `counterexample-found`, or `unknown/timeout` per invariant.

### Stage C - Multi-Agent Monte Carlo Adversarial Execution

Independent Hepar agents run stochastic campaigns with disjoint seeds and campaign focus:

1. `Hepar-Privilege`
2. `Hepar-Arithmetic`
3. `Hepar-Reentrancy`
4. `Hepar-Economic`
5. `Hepar-State`

Each agent produces:

1. findings list (`vector_id`, severity, exploit preconditions, est_loss)
2. path sample count
3. coverage metrics
4. reproducibility seed and trace IDs

### Stage D - Consensus + Confidence Fusion

Aggregate deterministic + symbolic + Monte Carlo findings into one verdict.

## 4) Consensus Scoring Model (Recommended)

For each vulnerability vector `v`:

1. `severity_v` in `[0,10]`
2. `consensus_v = agents_found_v / total_agents` in `[0,1]`
3. `repro_v` in `[0,1]` (can independent reruns reproduce?)
4. `proof_v` in `{+1 counterexample, 0 unknown, -1 proved-safe-on-bounded-invariant}`

Per-vector risk contribution:

```text
risk_v = severity_v * (0.55*consensus_v + 0.25*repro_v + 0.20*proof_term_v)
where proof_term_v = 1 if counterexample
                 = 0.5 if unknown
                 = 0 if bounded invariant proved safe for that vector
```

Global risk score:

```text
base = Σ risk_v
critical_bonus = Σ (severity_v * 0.5) for vectors with consensus_v = 1.0
uncertainty_penalty = f(low_coverage, high_unknown_ratio)
score = clamp(0, 100, base + critical_bonus + uncertainty_penalty)
```

Recommended action bands:

1. `0-19`: allow (bounded)
2. `20-39`: allow with guardrails + monitor
3. `40-59`: restricted / reduced sizing
4. `60-79`: deny pending remediation
5. `80-100`: hard block

## 5) Consensus Rules (Operational)

Use explicit vector-level consensus thresholds:

1. `>= 0.8` consensus: high-confidence vulnerability
2. `0.4 - 0.79`: probable vulnerability, conditional exploitability
3. `< 0.4`: low-confidence signal unless severity is critical and reproducible

Never use a single scalar score alone for go/no-go. Decision must include:

1. top critical vectors
2. consensus rates
3. symbolic status (`proved/counterexample/unknown`)
4. estimated loss bands

## 6) On-Chain Posting Pattern (Efficient)

Post compact attestations, not raw traces.

Per protocol version:

1. `protocol_id`
2. `code_hash` and dependency hashes
3. `hepar_run_id`
4. `risk_score`
5. top vector fingerprints + consensus rates
6. coverage and unknown ratios
7. merkle root for full off-chain evidence package
8. signer set and threshold metadata

Store detailed traces off-chain (object store/IPFS/arweave optional), referenced by the root.

## 7) Path Explosion Strategy (Practical)

Your Monte Carlo + multi-agent model is valid if these safeguards are applied:

1. disjoint RNG seeds and campaign policies per agent
2. coverage guidance (bias toward uncovered branches/states)
3. periodic corpus exchange between agents (without collapsing independence)
4. reproducibility reruns for high-severity vectors
5. capped budget per protocol with priority escalation when critical vectors emerge

This prevents pure random blind spots and makes confidence claims defensible.

## 8) 90-Day Shipping Sequence

### Days 0-30

1. finalize vector taxonomy and severity rubric
2. implement consensus aggregator + scoring
3. integrate bounded symbolic checks on highest-risk invariants
4. emit signed Hepar attestation JSON schema

### Days 31-60

1. run 5-agent stochastic campaigns in paper mode
2. measure precision/recall against historical exploit sets
3. calibrate thresholds for false-positive control
4. start Tier 1 pilot feed with explicit caveats

### Days 61-90

1. productionize evidence store + attestation pipeline
2. launch Tier 2 institutional feed
3. package Tier 3 forensic report template
4. begin Tier 4 underwriting pilot conversations using backtested reliability metrics

## 9) Metrics That Matter (for Tier Credibility)

1. critical vector detection recall on known incidents
2. false-positive rate by severity band
3. time-to-verdict (p50/p95)
4. coverage ratio and unknown ratio
5. cross-agent consensus distribution
6. downstream incident rate for protocols scored in low-risk bands

Without these metrics, underwriting claims are sales language, not actuarial-grade signal.

## 10) Current Repo Alignment

Current local implementation already supports:

1. deterministic five-layer Hepar forensics
2. hard-block vectors
3. confidence labeling
4. tiered commercialization framing

Missing pieces for this blueprint:

1. true multi-agent stochastic execution campaigns
2. bounded symbolic proving integration
3. consensus fusion math and reproducibility scoring
4. on-chain attestation contract + evidence-merkle workflow
