# HEPAR — FORENSIC PROTOCOL RISK ENGINE
## Full Operability & Functionality Specification

**Version:** 2.0 (corrected & integrated)
**Original prompt date:** 2026-04-30
**Integration date:** 2026-04-30
**Status:** INSTITUTIONAL DEPTH STANDARD — full operability spec; current implementation reality tracked in §13
**Companion documents:** `HEPAR_MONTE_CARLO_CONSENSUS_BLUEPRINT.md`, `HEPAR_FORENSIC_STACK_AND_REVENUE_MODEL.md`, `SIX_ORGAN_INSTITUTIONAL_DEPTH_BLUEPRINT.md`

---

## 0. OPERATING PRINCIPLE — BIOLOGICAL FIDELITY = OPERATIONAL STANDARD

The organ names in this ecosystem are commitments, not labels.

If a system is named `Hepar` (liver), it must operate at the standard of what a liver actually does. A liver does not block toxins by keyword match. It detoxifies, transforms, synthesizes intelligence, stores historical risk memory, regulates exposure homeostasis, and metabolizes inputs into usable decision substrate. Anything less is hollow convergence at the architecture layer — naming without the corresponding operational depth.

This principle is the ecosystem-internal counterpart to the Gnosis Integrity Layer's anti-hollow-convergence rule for agents. At the agent layer, an agent that imitates depth without authentic decompression is flagged. At the architecture layer, an organ that imitates its biological namesake without producing the functional equivalent violates the same principle.

**The Hepar standard is therefore not "better than what currently exists" but "what forensic protocol intelligence at liver-class fidelity actually means."** The market gap is real and structural — no current system performs continuous wallet-graph-aware multi-agent forensic consensus on live protocols, because the audit industry sells project-based engagements and the on-chain analytics industry doesn't do bytecode forensics. Hepar at standard fills that empty space.

This spec describes the full operability target. §13 separates that target from current implementation reality.

---

## 1. WHAT HEPAR ACTUALLY IS

Hepar is not a filter. It is not a screener. It is not a flag system.

Hepar is a **forensic protocol risk engine** — a continuously operating, multi-agent, Monte Carlo-driven intelligence system that produces institutional-grade risk assessment on any DeFi protocol, in real-time, with on-chain verifiable output.

The biological namesake is operational, not decorative. A liver does not simply block toxins. It:

- Detoxifies and transforms harmful inputs
- Synthesizes actionable intelligence from raw data
- Stores historical risk memory
- Regulates the ecosystem's exposure homeostasis
- Metabolizes protocol data into usable decision inputs

Hepar performs at exactly that depth. Anything less violates the organ standard.

---

## 2. THE PROBLEM HEPAR SOLVES

### The Gap That Still Exists (2026)

```
Existing tools:
├─ One-time audits (OpenZeppelin, Trail of Bits)
│  └─ Snapshot of code on day one
│  └─ Does not track post-audit changes
│  └─ Does not assess creator wallet history
│  └─ Does not model economic exploits
│  └─ $50k–$500k per engagement, 4–12 weeks
│
├─ Contract verification (Etherscan)
│  └─ Confirms code matches deployed bytecode
│  └─ No vulnerability analysis
│
├─ TVL trackers (DeFiLlama)
│  └─ Measures capital inflow
│  └─ High TVL ≠ safe protocol
│
└─ Community reputation (Discord, Twitter)
   └─ Manipulated by paid shills
   └─ No forensic basis

What does NOT exist:
✗ Real-time continuous forensic monitoring
✗ Wallet graph taint analysis
✗ LP unlock concentration timelines
✗ Adversarial execution simulation
✗ Multi-agent consensus risk scoring
✗ Investor-facing risk intelligence
✗ Permanent on-chain audit history
```

Hepar fills every gap simultaneously.

---

## 3. THE TWO CUSTOMER DIMENSIONS

Hepar serves two distinct customers with two distinct value propositions.

### Dimension A: Investor Protection

```
Customer: Hedge funds, DAO treasuries, retail aggregators,
          Sovereign Monad's own Cardia agent
Question: "Is this protocol safe for MY capital RIGHT NOW?"
Value:    Forensic assessment before every allocation decision
Outcome:  Capital protected from exploits, rugs, and honeypots
```

### Dimension B: Protocol Assurance

```
Customer: DeFi protocols who want continuous post-audit coverage
Question: "What did our audit miss? What are we exposed to today?"
Value:    Continuous monitoring that starts where audits end
Outcome:  Protocol credibility, investor confidence, "Hepar badge"
```

These are not competing customers — they reinforce each other:

- Investor pays for Hepar report on Protocol X
- Hepar finds vulnerability in Protocol X
- Hepar discloses responsibly to Protocol X
- Protocol X subscribes to continuous monitoring
- Better monitoring data improves investor reports
- More investors subscribe

---

## 4. FULL ARCHITECTURE

### 4.1 The Hybrid Analysis Stack (Static → Symbolic → Stochastic → Consensus)

The full operability stack uses four layers in sequence — not Monte Carlo alone. This is the corrected architecture; v2.0 of the original spec dropped the symbolic-proving stage and is restored here per the Monte Carlo Consensus Blueprint §3.

**Stage A — Static Forensics (deterministic prefilter)**

- Bytecode privilege checks
- Proxy-admin and upgrade authority graph
- LP unlock and concentration timeline
- Wallet taint and address-cluster linkage

Output: deterministic hard-block candidates + weighted deterministic findings.

**Stage B — Bounded Symbolic Proving (targeted)**

Symbolic/concolic checks on critical surfaces only — not full symbolic execution of arbitrary code, which is intractable:

- Authorization invariants (`onlyOwner`, role transfer, pause/unpause rights)
- Upgrade invariants (implementation/auth/timelock constraints)
- Accounting invariants (reserve conservation, debt bounds, mint/burn bounds)
- Reentrancy and state-transition invariants

Output per invariant: `proved-safe`, `counterexample-found`, or `unknown/timeout`.

This stage is what allows Hepar to make claims at *forensic* fidelity rather than only stochastic confidence. Without it, every Hepar finding is probabilistic and the BLACK registry tier loses its evidentiary backbone.

**Stage C — Multi-Agent Monte Carlo Adversarial Execution**

Five parallel specialized Hepar agents running independent stochastic campaigns with disjoint RNG seeds and disjoint focus:

```
Hepar-Privilege   — permission-based attack vectors
Hepar-Arithmetic  — mathematical boundary violations
Hepar-Reentrancy  — call graph + state mutation analysis
Hepar-Economic    — token economics + market attack vectors
Hepar-State       — state machine violations
```

Each agent produces:

- Findings list (`vector_id`, severity, exploit preconditions, est_loss)
- Path sample count
- Coverage metrics
- Reproducibility seed and trace IDs

**Why Monte Carlo and not full symbolic execution of everything**

Full symbolic execution of arbitrary DeFi systems is unbounded:

- Path/state space is combinatorial and often unbounded with external calls
- Liveness and economic safety depend on off-chain and cross-protocol behavior
- Solver timeouts produce "unknown" outcomes at scale

Hepar therefore uses hard proofs for bounded invariants (Stage B) plus probabilistic exploit discovery for broad surfaces (Stage C). This produces a defensible **assurance envelope** rather than false absolute safety claims.

**Why 5 agents instead of 1**

A single agent's finding could be a false positive. Five independent agents finding the same exploit path through different random simulation sequences is corroborating evidence — proof-grade when reproducibility checks confirm it.

**Stage D — Consensus + Confidence Fusion**

Aggregate deterministic + symbolic + Monte Carlo findings into one verdict using the scoring model in §4.3.

**Execution timeline (corrected)**

Honest budget targets, not single-millisecond aspirational claims:

```
Stage A (static forensics):       seconds — bytecode parse, registry lookup
Stage B (symbolic proving):       seconds-to-minutes per invariant
                                  (timeout-bounded, returns `unknown` if exceeded)
Stage C (Monte Carlo, 5 agents):  minutes for 50k paths/agent
                                  (off-chain compute, parallel workers)
Stage D (consensus aggregation):  sub-second
On-chain attestation posting:     one Monad block (sub-second commit,
                                  finality per Monad consensus)
```

**Important boundary on Monad's role:** Monad accelerates the *coordination and attestation* path — fast posting, retrieval, and on-chain anchoring of Hepar outputs and frequent batched consensus commits. Monad does **not** automatically speed local CPU-bound symbolic or stochastic analysis. Off-chain throughput comes from your own parallel worker fleet and scheduler. Earlier "350ms total" framing conflated EVM transaction parallelism with off-chain compute parallelism; that claim is retired.

### 4.2 The 7-Dimensional Risk Framework

Every protocol assessment produces scores across 7 dimensions.

**Dimension 1 — Bytecode Privilege Score (0–100)**

```
Analyzes:
├─ All privileged functions (onlyOwner, onlyAdmin, etc.)
├─ Who holds those privileges (address analysis)
├─ What those privileges can do (drain? pause? upgrade?)
├─ Are there timelocks on privileged actions?
└─ Can privileges be transferred without governance?

Red flags:
├─ Single address can drain entire protocol
├─ No timelock on critical admin functions
├─ Privilege transfer requires no governance vote
└─ Hidden privileged functions in inherited contracts
```

**Dimension 2 — Proxy-Admin Control Score (0–100)**

```
Analyzes:
├─ Is this a proxy contract? (Transparent, UUPS, Beacon)
├─ Who controls the ProxyAdmin?
├─ How many signers required to upgrade?
├─ What is the upgrade delay (if any)?
└─ Has the implementation been changed post-audit?

Red flags:
├─ ProxyAdmin controlled by single EOA
├─ No upgrade timelock
├─ Implementation changed since last audit
└─ Beacon proxy with unverified beacon controller
```

**Dimension 3 — LP Unlock Concentration Score (0–100)**

```
Analyzes:
├─ Who holds LP tokens and what percentage?
├─ When do those tokens unlock?
├─ What's the concentration (Gini coefficient)?
├─ Historical unlock behavior from same deployer
└─ LP lock mechanism quality (audited? time-based? governance?)

Red flags:
├─ >70% LP held by single wallet
├─ Unlock within 90 days
├─ No lock mechanism or self-custodied lock
└─ Same deployer wallet unlocked early in previous deployment
```

**Dimension 4 — Wallet Graph Taint Score (0–100)**

```
Analyzes:
├─ Deployer wallet full transaction history
├─ Connections to known exploit participants
├─ Previous protocol deployments (how did they end?)
├─ Funding source (did they receive from tornado cash, hackers?)
└─ Behavioral patterns (withdraw → abandon → new protocol)

Red flags:
├─ Direct connection to known rug pull wallets
├─ Previous deployments abandoned post-liquidity
├─ Funding from flagged sources
└─ Pattern of coordinated wallet clusters across deployments

Data sourcing note: This dimension requires either a partner relationship
with an existing chain analytics provider (Chainalysis, TRM, Arkham) or
an independent ingestion pipeline. Building the wallet-graph substrate
from scratch is a dedicated subprogram, not a side capability.
```

**Dimension 5 — Adversarial Execution Score (0–100)**

```
Analyzes (Monte Carlo guided fuzzing):
├─ What happens with maximum integer inputs?
├─ What if we flashloan the entire reserves?
├─ What if we call functions in adversarial order?
├─ What if we become sole LP then withdraw?
└─ Are economic invariants maintained under stress?

Red flags:
├─ Arithmetic overflow on boundary inputs
├─ Flashloan attack with positive expected value
├─ State inconsistency under adversarial sequences
└─ Economic invariant violation under edge conditions
```

**Dimension 6 — Economic Viability Score (0–100)**

```
Analyzes:
├─ Does the token economic model sustain itself?
├─ Is yield sourced from real activity or inflation?
├─ Protocol revenue vs. token emission ratio
├─ Governance participation and health
└─ Competitive positioning and differentiation

Red flags:
├─ Yield entirely from token emissions (no real revenue)
├─ Emission schedule front-loaded (dump incentive)
├─ No governance participation (centralized in practice)
└─ Protocol indistinguishable from dozens of forks
```

**Dimension 7 — Composite Risk Score (0–100)**

```
Weighted aggregate:
├─ Privilege Score:           20%
├─ Proxy-Admin Score:         18%
├─ LP Unlock Score:           17%
├─ Wallet Taint Score:        20%
├─ Adversarial Execution:     15%
└─ Economic Viability:        10%

Decision bands (PRELIMINARY — single score is necessary but not sufficient):
├─  0–19:  ALLOW
├─ 20–39:  GUARDED ALLOW (monitor + reduced cap)
├─ 40–59:  RESTRICTED (reduced sizing, requires Cortex review)
├─ 60–79:  DENY pending remediation
└─ 80–100: HARD_BLOCK
```

**Critical rule (per Monte Carlo Consensus Blueprint §5):**
A single composite score is not sufficient for go/no-go. Final action band requires **both** a score-band match **and** a positive top-vector check covering:

- Top critical vectors and their severity
- Consensus rates per vector
- Symbolic status (`proved / counterexample / unknown`)
- Estimated loss bands
- Coverage and unknown ratios

If the score band suggests ALLOW but a single CERTAIN-confidence CRITICAL vector exists, action band escalates. If the score band suggests RESTRICTED but all top vectors are `proved-safe` on bounded invariants and consensus is low, action band may relax with operator confirmation. Score → action is never a pure lookup.

### 4.3 Consensus Scoring Model (Vector-Level)

For each vulnerability vector `v`:

- `severity_v` ∈ [0, 10]
- `consensus_v` = agents_found_v / total_agents ∈ [0, 1]
- `repro_v` ∈ [0, 1] (do independent reruns reproduce the finding?)
- `proof_v` ∈ {+1 if counterexample, 0 if unknown, −1 if bounded invariant proved-safe for that vector}

Per-vector risk contribution:

```
risk_v = severity_v × (0.55 × consensus_v + 0.25 × repro_v + 0.20 × proof_term_v)

where proof_term_v =
   1 if counterexample-found
   0.5 if unknown
   0 if bounded invariant proved-safe for that vector
```

Global risk score:

```
base                = Σ risk_v
critical_bonus      = Σ (severity_v × 0.5) for vectors with consensus_v = 1.0
uncertainty_penalty = f(low_coverage, high_unknown_ratio)
score               = clamp(0, 100, base + critical_bonus + uncertainty_penalty)
```

**Vector-level consensus thresholds:**

- `≥ 0.8` consensus: high-confidence vulnerability
- `0.4 – 0.79`: probable vulnerability, conditional exploitability
- `< 0.4`: low-confidence signal unless severity is critical *and* reproducible

**Convergence labels:**

- 5/5 agents → CERTAIN (100%)
- 4/5 → HIGH (80%)
- 3/5 → PROBABLE (60%)
- 2/5 → POSSIBLE (40%)
- 1/5 → EDGE CASE (20%)

**Escalation rules:**

- Any CERTAIN finding at CRITICAL severity → automatic HARD_BLOCK
- Any HIGH-confidence finding at HIGH severity → automatic RESTRICT
- Multiple PROBABLE findings → escalate to Cortex for review
- All EDGE CASE findings → logged, not action-blocking

### 4.4 Path Explosion Safeguards

Monte Carlo confidence is only defensible if these safeguards are applied:

- Disjoint RNG seeds and disjoint campaign policies per agent
- Coverage guidance (bias toward uncovered branches/states)
- Periodic corpus exchange between agents (without collapsing independence)
- Reproducibility reruns for high-severity vectors
- Capped budget per protocol with priority escalation when critical vectors emerge

Without these, Monte Carlo claims degrade into random sampling theater.

---

## 5. INTELLIGENCE PHASES (Full Operational Depth)

**Phase 1 — Reconnaissance**

```
Input: Contract address or bytecode
Actions:
├─ Full bytecode decompilation and control flow graph generation
├─ Identify all external calls and their target types
├─ Map complete state machine and transition conditions
├─ Extract all permission boundaries and role definitions
├─ Identify token/vault/oracle interfaces
└─ Cross-reference deployment address against registry history
```

**Phase 2 — Threat Modeling**

```
Actions:
├─ Classify attack surface by category
├─ Generate hypothesis list for Monte Carlo targeting
├─ Prioritize high-impact paths for deeper simulation
├─ Identify economic attack viability (flashloan cost vs. gain)
└─ Map cross-function interaction risks
```

**Phase 3 — Bounded Symbolic Proving**

```
Actions:
├─ Run authorization invariant proofs
├─ Run upgrade invariant proofs
├─ Run accounting invariant proofs
├─ Run reentrancy and state-transition invariant proofs
└─ Output proved/counterexample/unknown per invariant
```

**Phase 4 — Monte Carlo Stress Testing**

```
Actions (5 agents in parallel):
├─ 50,000 random path executions per agent (target — 250,000 total)
├─ Guided fuzzing on identified high-risk paths
├─ Boundary value analysis on all arithmetic operations
├─ Cross-function adversarial sequences
└─ Economic regime simulation (bull/bear/crash conditions)
```

**Phase 5 — Forensic Analysis**

```
Actions:
├─ Wallet graph construction for deployer + all admin addresses
├─ LP token concentration and unlock timeline analysis
├─ ProxyAdmin chain resolution and controller identification
├─ Historical protocol behavior from same deployer cluster
└─ Fund flow pattern analysis (where does money actually go?)
```

**Phase 6 — Synthesis and Intelligence**

```
Actions:
├─ Compute all 7 dimensional scores
├─ Apply convergence weighting across 5 agents
├─ Apply symbolic-proof terms per vector
├─ Generate confidence-weighted finding list
├─ Produce remediation recommendations (specific, actionable)
├─ Generate comparative positioning vs. similar protocols
├─ Compute composite risk score and run top-vector check
└─ Package institutional report + raw data + evidence merkle root
```

**Phase 7 — Output and Routing**

```
Internal outputs:
├─ Risk score + top vectors → Synapse (routing decision)
├─ Decision band → Cardia (allocation cap)
├─ Full forensic data → Data Rail (permanent record)
├─ Narrative package → Vox (verified communication)
└─ Strategic context → Cortex (broader analysis)

External outputs:
├─ API response (risk score + decision band + top vectors)
├─ Full forensic report (institutional PDF/JSON)
├─ Registry update (public status change if warranted, per §15 review)
├─ Responsible disclosure (per §10)
└─ Insurance data feed (if licensed)
```

---

## 6. THE HEPAR PROTOCOL INTELLIGENCE REGISTRY

The Registry is the byproduct that becomes the moat.

Every assessment Hepar runs builds a living, continuously updated, on-chain verified public record of every protocol assessed.

### Four Status Tiers

**GREEN — Continuously Monitored & Cleared**

```
Meaning: Daily forensic checks running, nothing critical detected
NOT:     "This protocol is safe forever"
BUT:     "As of today, Hepar has found nothing dangerous"
Requires: Active monitoring subscription
Updates:  Daily re-assessment
Public badge: "Hepar Monitored — [last checked timestamp]"
```

**YELLOW — Under Active Watch**

```
Meaning: Something changed recently that warrants heightened monitoring
Triggers:
├─ Admin key transferred to new wallet
├─ LP unlock within 60 days
├─ Code change post last clearance
├─ Governance proposal that could alter risk profile
└─ Wallet graph event (tainted wallet becomes connected)
Action: Increased monitoring frequency, investor alert
```

**RED — High Risk / Do Not Allocate**

```
Meaning: Critical forensic findings present
Triggers:
├─ CERTAIN or HIGH confidence critical vulnerability
├─ Creator wallet directly linked to previous exploit
├─ LP concentration + imminent unlock combination
└─ Adversarial simulation finds profitable attack vector
Action: Hepar blocks Cardia allocation (per tier discipline §16),
        Synapse routes to avoid
Public display: Specific findings, on-chain evidence links
Publication review: Required per §15 before public RED status
```

**BLACK — Confirmed Scam / Exploit Record**

```
Meaning: Protocol has rugged, been exploited, or forensic evidence
         conclusively proves malicious intent
Triggers:
├─ Confirmed rug pull (liquidity drained, team vanished)
├─ Live exploit executed against the protocol
├─ Intentional drain mechanism discovered in bytecode
├─ Creator wallet cluster matches known criminal pattern
└─ Governance attack confirmed
Action: Permanent record, creator wallets flagged ecosystem-wide
Public display: Full forensic evidence, exact transactions,
                wallet graph, methodology — everything provable
Permanence: Cannot be removed without §15 correction protocol
            On-chain. Anchored. Immutable in the absence of a
            governed correction event.
Publication review: Mandatory per §15 — BLACK status carries
                    defamation/tort exposure and requires
                    independent reviewer sign-off before
                    publication.
```

### 6.1 The Wallet Graph Persistence System

This is the most powerful long-term asset the Registry builds:

```
Bad actor deploys Protocol A
    ↓
Protocol A rugs
    ↓
Hepar flags deployer wallet + all connected wallets
    ↓
Bad actor deploys Protocol B (new name, same wallet cluster)
    ↓
Registry immediately flags Protocol B:
"Deployer wallet connected to Protocol A rug — BLACK"
    ↓
Bad actor deploys Protocol C with new wallet
    ↓
Hepar traces funding source:
"New wallet funded by flagged cluster — RED pending review"
```

What accumulates over time:

- Known bad actor wallet database
- Rug pattern recognition (30/60/90-day pre-rug behavioral signatures)
- Creator risk scoring independent of current protocol quality

This database compounds in value every day it operates. Estimated standalone value after 3 years: institutional-grade. After 5 years: definitive on-chain forensic record for DeFi.

### 6.2 Registry Public Interface

```
URL:    hepar.sovereignmonad.xyz
Search: Protocol name, contract address, deployer wallet

Result page shows:
├─ Current status badge (Green/Yellow/Red/Black)
├─ Last assessment timestamp
├─ Risk score history (chart — trending safer or riskier?)
├─ Key findings (non-technical summary)
│  └─ "Creator wallet connected to 2 previous rugs"
│  └─ "LP unlock in 34 days, 87% held by single wallet"
│  └─ "Reentrancy vulnerability found by 4/5 agents"
├─ On-chain proof links (MonadScan for every finding)
├─ Historical status changes with timestamps
│  └─ "Moved Green → Yellow on April 15 (LP unlock detected)"
│  └─ "Returned Yellow → Green on April 28 (LP re-locked)"
├─ Subscribe to alerts for this protocol (paid feature)
└─ Full forensic report (paid feature)

For investors:    "Before you allocate — check the registry"
For protocols:    "Get continuously monitored — subscribe to Hepar"
For institutions: "License the full registry API — institutional feed"
```

---

## 7. REVENUE ARCHITECTURE

> **Important framing:** All revenue numbers in this section are planning bands for sequencing and capacity work. They are not forecasts and are not committed externally. Per §9 of the Monte Carlo Consensus Blueprint and §16 tier discipline below, revenue tiers above Tier 1 require evidence-quality metrics (precision, recall, false-positive rate, time-to-verdict, downstream incident rate) to be measured before pricing is asserted to customers.

### Stream 1: Investor Protection

```
Free Tier (Registry Access)
├─ Current status visible for all assessed protocols
├─ Basic risk score visible
├─ Drives traffic, builds trust
└─ Converts to paid naturally

Retail Paid (planning band: $99–$999/month)
├─ Real-time alerts when protocol status changes
├─ Portfolio monitoring (10–50 protocols)
├─ Full forensic report access
└─ API access for wallet/protocol lookup

Institutional Feed (planning band: $50k–$500k/month)
├─ Full registry API — all protocols, all data
├─ Real-time status change feed
├─ Custom alert thresholds
├─ Portfolio-level aggregate risk scoring
├─ Historical regime correlation data
└─ Raw forensic data for proprietary analysis
```

### Stream 2: Protocol Assurance

```
Responsible Disclosure (Free → Paid conversion)
├─ Hepar finds critical vulnerability in live protocol
├─ Private notification (per §10 timeline)
├─ Protocol either:
│  A) Fixes it → becomes warm customer
│  B) Disputes → §15 dispute protocol
│  C) Ignores past disclosure window → publication
└─ In all cases: Hepar credibility grows when conduct is documented

Hepar Continuous Monitoring (planning band: $2k–$10k/month)
├─ Daily forensic assessment
├─ Private early warning before status changes publicly
├─ Monthly clearance report for investors
├─ "Hepar Monitored" badge on registry
└─ Quarterly forensic deep-dive report

Hepar Pre-Launch Assessment (planning band: $5k–$25k one-time)
├─ Full forensic workup before mainnet deployment
├─ Remediation guidance (specific, actionable)
├─ Re-assessment after fixes applied
└─ "Pre-Launch Cleared" certificate for investors
```

### Stream 3: Insurance Underwriting

```
Insurance Data License (planning band: $10M–$50M+/year)
├─ Full forensic dataset licensed to insurance protocols
├─ Continuous risk score feed for underwriting pricing
├─ Historical rug/exploit prediction accuracy data
├─ Wallet graph taint database
└─ Actuary-grade methodology documentation

Revenue model: 2–5% of insurance premiums written using Hepar data
               OR fixed annual license

Activation gate: This stream cannot be sold or priced externally
                 until §16 `authoritative` tier is reached, which
                 requires the §9 Blueprint metrics (recall on known
                 incidents, false-positive rate by severity, p50/p95
                 time-to-verdict, coverage/unknown ratios, downstream
                 incident rate) to be measured on real protocols and
                 within institutional bounds.
```

### Revenue Summary (Planning Bands)

| Stream                | Model         | Conservative | Optimistic |
|-----------------------|---------------|-------------:|-----------:|
| Retail Registry       | Subscription  |     $50k/mo  |   $200k/mo |
| Institutional Feed    | Subscription  |    $200k/mo  |     $1M/mo |
| Protocol Monitoring   | Subscription  |    $200k/mo  |     $2M/mo |
| Pre-Launch Reports    | Per-engagement|    $100k/mo  |   $500k/mo |
| Insurance License     | Revenue share |    $500k/mo  |    $5M+/mo |
| **TOTAL (planning)**  | Mixed         |  **$1.05M/mo** | **$8.7M/mo** |

These figures are not forecasts. They are the band the architecture is designed to be capable of supporting once §16 tier discipline reaches `authoritative`, and they are the basis for capacity planning, not customer-facing pricing pages.

---

## 8. INTERNAL ECOSYSTEM FUNCTION

Hepar's primary function is protecting the Sovereign Monad ecosystem itself. Everything external is built on top of that.

### Internal Workflow

```
New protocol detected (Pneuma identifies opportunity)
    ↓
Hepar receives contract address
    ↓
Phases 1–7 execute (per §5)
    ↓
Composite score + top-vector check applied (per §4.2)

IF action band = ALLOW:
    └─ Synapse routes: "Cleared for allocation"
    └─ Cardia receives: Allocation permitted up to defined cap
    └─ Data Rail records: Assessment + decision

IF action band = GUARDED ALLOW:
    └─ Synapse routes: "Cleared with reduced cap"
    └─ Cardia receives: Allocation cap reduced per band
    └─ Monitoring frequency increased
    └─ Data Rail records: Assessment + reduced-cap decision

IF action band = RESTRICTED:
    └─ Synapse routes: "Escalate to Cortex"
    └─ Cortex receives: Full forensic data for strategic review
    └─ Cortex decides: Allocate with reduced cap? Avoid entirely?
    └─ Data Rail records: Full decision chain

IF action band = DENY:
    └─ Synapse routes: "Block standard allocation"
    └─ Cardia receives: Hard cap at minimal exploratory size only
    └─ Vox receives: "Prepare internal risk note"
    └─ Data Rail records: Restriction + rationale

IF action band = HARD_BLOCK:
    └─ Synapse routes: "Zero allocation, do not engage"
    └─ Cardia receives: Protocol blacklisted from all capital
    └─ Vox receives: "Prepare responsible disclosure package"
    └─ Registry status updated (per §15 review)
    └─ Data Rail records: Full forensic evidence permanently
```

---

## 9. INTEGRATION WITH OTHER ORGANS

### Hepar → Synapse

```
Output: Risk score + decision band + confidence levels + top vectors
Synapse uses: Routes capital decisions without conflict
Key rule: HARD_BLOCK is enforced regardless of other signals
```

### Hepar → Cardia

```
Output: Approved protocol list + risk-adjusted allocation caps
Cardia uses: Sets maximum capital exposure per protocol
Key rule: No capital deployed to any protocol without Hepar clearance
         at `authoritative` tier (§16). At `advisory` or
         `decision-support` tier, operator confirmation is required.
```

### Hepar → Cortex

```
Output: Full forensic data for RESTRICTED-band protocols
Cortex uses: Strategic analysis of why risk exists and whether it
             changes the opportunity thesis
Key relationship: Cortex can override RESTRICTED to either
                  GUARDED ALLOW or DENY — never HARD_BLOCK
                  (only Hepar can set HARD_BLOCK)
```

### Hepar → Vox

```
Output: Findings + confidence levels + decision rationale
Vox uses: Produces verified narrative for each audience
          Internal: "We blocked Protocol X because of Y"
          External: "Hepar found Z, here's the proof"
Key rule: Vox only publishes Hepar findings that are
          evidence-linked, confidence-rated, and §15-cleared.
          No speculation. No embellishment.
```

### Hepar → Data Rail

```
Output: Every assessment, every finding, every decision
Data Rail stores: Permanent timestamped forensic record
                  with merkle-root anchored on-chain (per §6
                  attestation pattern)
Key value: This accumulated record is the most valuable
           long-term asset in the ecosystem.
```

---

## 10. RESPONSIBLE DISCLOSURE PROTOCOL

When Hepar finds a critical vulnerability in a live protocol:

```
Severity tiers determine disclosure window:

CRITICAL (loss-of-funds, exploitable today):
├─ Default disclosure window: 90 days
├─ Aligned with industry standard (Project Zero, CVD)
├─ Extension granted on good-faith remediation evidence

HIGH (exploitable under specific conditions):
├─ Default disclosure window: 60 days

MEDIUM (theoretical or low-probability):
├─ Default disclosure window: 30 days
```

**Step 1 — Private notification (Day 0)**

```
├─ Contact protocol team through verifiable channel
├─ Provide: Vulnerability type, severity, confidence level
├─ Provide: Evidence (specific function, attack vector)
├─ Do NOT: Provide full exploit code publicly
└─ Do NOT: Set unrealistic fix timelines
```

**Step 2 — Disclosure window**

```
Day 0–14:           Initial acknowledgment expected
Day 15 to T−30:     Fix in progress or dispute filed
Day T−30 to T:      Fix deployed, extension granted, or escalation
Day T (window end): Public disclosure regardless of status,
                    subject to §15 review for BLACK-tier publication
```

**Step 3 — Outcome paths**

```
Protocol fixes it:
├─ Publish finding with "Fixed" status
├─ Protocol gets credit for responsible response
├─ Offer continuous monitoring subscription
└─ Hepar credibility: demonstrated accuracy

Protocol disputes it:
├─ §15 dispute protocol activates
├─ Independent reviewer evaluates the dispute
├─ If finding holds: published with protocol's counter-argument
└─ If finding is overturned: §15 correction protocol applied

Protocol ignores window:
├─ Publish full forensic finding with all evidence
├─ Registry moves to RED (or BLACK if §15 review supports)
├─ Community informed, investors protected
└─ Hepar credibility: demonstrated honesty
```

**Key principle**

Hepar is not extracting from protocols financially. Hepar is demonstrating what the audit industry was never designed to catch. The responsible disclosure is not a threat — it is proof of concept.

---

## 11. STANDALONE VIABILITY

Per the ecosystem architecture principle — every organ must be viable both internally and externally.

```
Legal structure option:
├─ Hepar Intelligence Inc. (Delaware C-Corp)
├─ Sovereign Monad retains majority stake
├─ Series A raised independently if market demands it
└─ Hepar revenue returns % to ecosystem (MOF doctrine)

What makes it independently fundable:
├─ Clear TAM ($500M+/year addressable)
├─ No direct competitor at this depth
├─ Measurable performance (7-dimensional scoring + symbolic stage)
├─ Institutional demand pattern (insurance, hedge funds)
└─ Technical moat (hybrid stack on Monad — not replicable quickly)

Series A pitch (standalone):
"We built the missing trust layer for DeFi.
No audit firm does what we do.
No existing tool monitors continuously.
Insurance companies will pay institutional-grade fees
for our data once §9 metrics are published.
We are raising $X to capture that market."
```

---

## 12. QUALITY STANDARD

The quality bar for Hepar is not "better than what exists." The quality bar is: **Hepar becomes what forensic protocol trust means.**

Every feature, every assessment, every public finding must ask:

- Is this finding provable? (on-chain evidence required)
- Is this finding confidence-rated? (not speculation)
- Is this finding actionable? (specific, not vague)
- Is this finding permanent? (Data Rail, anchored)
- Does this build the standard or just fill a gap?

If the answer to any of those is no — it doesn't ship.

---

## 13. CURRENT STATUS vs. TARGET

Honest tier labels per §16 tier discipline.

| Capability                    | Current State              | Target State                    |
|-------------------------------|---------------------------|---------------------------------|
| 7-dimensional scoring         | Fixture-verified          | Live-telemetry-verified         |
| Multi-agent consensus         | Architecture implemented  | 5-agent parallel live           |
| Bounded symbolic proving      | Spec defined              | Integrated on critical surfaces |
| Monte Carlo simulation        | Architecture ready        | Full 50k path execution         |
| Wallet graph taint            | Spec defined              | Live chain analysis (data partner or independent pipeline) |
| LP unlock analysis            | Spec defined              | Real-time tracking              |
| Proxy-admin analysis          | Partial                   | Full chain resolution           |
| Adversarial simulation        | Phase 2 fixture           | Guided fuzzing live             |
| Public registry               | Not built                 | Live with 4 tiers + §15 review  |
| Responsible disclosure        | Process defined (90-day)  | First disclosure executed       |
| §15 legal posture             | Spec defined (this doc)   | Counsel-reviewed, ToS published |
| Protocol monitoring product   | Not live                  | Subscription product            |
| Insurance data feed           | Not live                  | Licensed to 1+ insurer          |

**Reading rule:** "Fixture-verified" means the capability passes deterministic benchmark fixtures in `organ-runtime`. It does not mean the capability has been validated against live protocols or live telemetry. Per the Calibration Report's own boundary, fixture passes are valid for architecture and policy direction but are not a substitute for live-outcome calibration. Customer-facing claims must be backed by `live-telemetry-verified` evidence.

---

## 14. NEXT REQUIRED ACTIONS (Priority Order)

```
1. Run live Hepar assessments on 20 major protocols
   └─ Cost: $0 (engine exists)
   └─ Output: Real data, real findings, real credibility
   └─ Timeline: Week 1–2

2. Stand up bounded symbolic proving on 3 critical-invariant classes
   └─ Authorization, upgrade, accounting invariants
   └─ Even partial coverage strengthens evidentiary backbone
   └─ Timeline: Week 2–4

3. Begin §9 metrics measurement
   └─ Critical-vector recall on known incidents
   └─ False-positive rate by severity band
   └─ Time-to-verdict p50/p95
   └─ This is the gate to `decision-support` tier
   └─ Timeline: Month 1–2

4. Publish first public forensic finding
   └─ One real vulnerability, fully evidenced
   └─ Responsibly disclosed first (90-day window for critical)
   └─ §15 reviewer sign-off before publication
   └─ Timeline: Month 2–3

5. Launch public registry (v1)
   └─ 20 assessed protocols with live status
   └─ Green/Yellow/Red tiers visible (BLACK reserved until §15
      counsel-review and ToS publication)
   └─ On-chain proof links for every finding
   └─ Timeline: Month 2–3

6. First protocol monitoring subscription
   └─ One protocol pays for continuous Hepar coverage
   └─ Validates Stream 2 revenue
   └─ Timeline: Month 3–4

7. First institutional customer
   └─ One hedge fund or DAO treasury subscribes to feed
   └─ Validates Stream 1 revenue
   └─ Timeline: Month 4–5

8. Insurance partnership conversation opened
   └─ Initial meeting with Nexus Mutual or equivalent
   └─ Present forensic methodology + measured §9 metrics
   └─ Gate: cannot present pricing until `authoritative` tier
   └─ Timeline: Month 5–7
```

---

## 15. LEGAL POSTURE & CORRECTION PROTOCOL

A public registry that names protocols and wallet clusters carries real legal exposure. This section is not optional — no public RED or BLACK status ships before this section is operational.

### 15.1 Liability Surface

Publishing a wrongful or disputed RED/BLACK rating against a live protocol creates exposure under:

- **US:** Trade libel, tortious interference with business relations, Lanham Act false advertising
- **UK/EU:** Defamation, malicious falsehood, GDPR data-accuracy rights for natural persons in wallet-cluster findings
- **Wallet subjects who are natural persons:** GDPR Article 16 (right to rectification), Article 17 (right to erasure), CCPA equivalents

Publishing a finding that is technically correct but *not* §15-cleared still carries exposure if it is published outside the disclosure window or without dispute review.

### 15.2 Independent Reviewer Sign-Off

Before any RED publication or any BLACK status is published:

- An independent technical reviewer (rotating; not the analyst who produced the finding) must sign off on the evidence package
- The reviewer confirms: evidence is reproducible, confidence labels are accurate, the finding is not better explained by a benign cause, and no §15.4 correction conditions are present
- The reviewer's sign-off is recorded in Data Rail with the assessment

For BLACK status specifically, an additional governance review is required — BLACK is the most damaging tier and the bar is highest.

### 15.3 Dispute Protocol

When a protocol disputes a finding:

- Dispute is filed within the disclosure window through a verifiable channel
- An independent reviewer evaluates the dispute (different reviewer than the original sign-off)
- During review, public status is held at YELLOW with a "Disputed — Under Review" flag
- Outcomes:
  - **Finding upheld:** Publication proceeds, protocol's counter-argument is published alongside the finding
  - **Finding overturned:** §15.4 correction protocol applies
  - **Inconclusive:** Finding is published as "Disputed — Hepar maintains methodology, protocol disputes interpretation"

### 15.4 Correction Protocol

If a published finding is later determined to be incorrect:

- Registry status is corrected within 24 hours of determination
- Original incorrect finding is preserved on-chain (history is not rewritten) but flagged with a "Corrected" status pointing to the correction record
- A correction notice is published with the same prominence as the original finding
- Affected protocol receives a written correction record suitable for use in their own communications
- Wallet-cluster flags derived from the incorrect finding are unwound

### 15.5 Jurisdiction & Terms of Service

- Hepar publishes a public Terms of Service before opening the registry
- ToS specifies governing law, dispute forum, methodology disclaimer, and limitation of liability
- ToS specifies how natural persons can request rectification of wallet-cluster findings under GDPR/CCPA, and how those requests are evaluated against on-chain immutability

### 15.6 Insurance & Counsel

Before BLACK tier goes public:

- Errors-and-omissions insurance is in force
- Outside counsel has reviewed the registry mechanism, ToS, disclosure protocol, and wallet-graph publication policy
- A media/comms playbook is in place for handling first BLACK-tier publication

---

## 16. TIER DISCIPLINE — ADVISORY → DECISION-SUPPORT → AUTHORITATIVE

Hepar's outputs are not equally weighty at all stages of maturity. Three tiers govern how downstream organs and external customers may use them.

### 16.1 Advisory Tier (current state)

- Outputs are visible to Cardia, Synapse, Cortex, Vox, and operators
- No automated capital decision is made on Hepar output alone — operator confirmation is required
- No external customer pricing is asserted — Tier 1 API may run as paper/free with explicit "advisory" labeling
- BLACK status is not published externally

### 16.2 Decision-Support Tier

Reached when:

- §9 Blueprint metrics are measured on at least 30 live protocols
- Critical-vector recall ≥ defined bound on known-incident corpus
- False-positive rate by severity is within defined bound
- Reproducibility holds across rerun campaigns
- Independent reviewer sign-off is operational per §15

At this tier:

- Cardia may use Hepar outputs as primary input to allocation caps, with operator override available
- RED status may be published to external customers under §15 review
- Tier 1 and Tier 3 commercial products may be priced and sold
- BLACK status remains gated until §16.3

### 16.3 Authoritative Tier

Reached when:

- Decision-support metrics have held for at least 6 months
- BLACK-tier §15.6 (insurance + counsel + comms) is in place
- At least one public BLACK finding has been published, disputed (or not), and the correction protocol has been exercised at least once in either direction
- Governance has approved authoritative-tier authority

At this tier:

- Cardia HARD_BLOCK enforcement requires no operator confirmation
- BLACK status is publishable
- Tier 2 institutional feed is fully priced and sold
- Tier 4 insurance underwriting conversations may proceed with metric-backed pricing

### 16.4 Demotion

Tier can be demoted at any time by:

- Dove signal of Tier 2 drift on Hepar output quality
- Significant correction event
- Loss of independent reviewer capacity
- Governance vote

Demotion is not punitive. It is the system protecting itself when conditions for higher-tier authority are no longer met.

---

## APPENDIX A — INTEGRATION WITH MOF v2.3.0

This specification is consistent with and depends on:

- MOF §3.6 (Implementation Honesty) — §13 separates target from current state
- MOF §3.5 (Layer Integrity) — Hepar produces forensic outputs; Vox packages; neither absorbs the other
- MOF §3.7 (Environment-First Domain Admission) — Hepar provides bounded environment for forensic-class agents
- MOF §17.2 (Implementation Drift) — §16 tier discipline closes the advisory-to-authoritative drift gap
- MOF §17.5 (False Validation) — §13 honest tier labels prevent fixture-pass-as-live overclaim
- MOF §17.8 (Hollow Convergence) — §0 biological-fidelity-as-standard is the architecture-layer counterpart to the agent-layer Gnosis Integrity rule

Recommended MOF changelog entry (proposed v2.3.30):

> Patch — Hepar v2.0 specification integration with biological-fidelity-as-standard principle, hybrid stack restoration (static + symbolic + Monte Carlo + consensus), tier discipline (advisory → decision-support → authoritative), and §15 legal posture. Remaining six organs receive parallel biological-fidelity standard per `SIX_ORGAN_INSTITUTIONAL_DEPTH_BLUEPRINT.md` v1.1.

---

## APPENDIX B — CHANGE NOTES vs. ORIGINAL v2.0 PROMPT

The original v2.0 prompt is preserved in structure and intent. The following changes were folded in for consistency with the Monte Carlo Consensus Blueprint and MOF §3.6:

1. Added §0 (Biological Fidelity = Operational Standard) as the doctrinal anchor for the whole organ set.
2. Restored bounded symbolic proving as Stage B of §4.1 (was missing in original v2.0; present in Blueprint §3 Stage B).
3. Replaced single-millisecond timing claim with honest sub-budgets and the Monad-role boundary (Monad accelerates coordination/attestation, not local CPU-bound analysis).
4. Replaced score-band-only decision logic with score-band + top-vector check per Blueprint §5.
5. Added reproducibility (`repro_v`) and proof-term (`proof_v`) to per-vector scoring per Blueprint §4.
6. Added §4.4 path explosion safeguards.
7. Lengthened critical disclosure window from 30 to 90 days in §10 (industry-standard CVD).
8. Added §15 Legal Posture & Correction Protocol covering liability, independent reviewer sign-off, dispute protocol, correction protocol, jurisdiction/ToS, and insurance/counsel.
9. Added §16 Tier Discipline ladder.
10. Reframed §7 revenue numbers as planning bands, not forecasts; added §16 activation gates.
11. Replaced §13 status table "✅ Live (measured)" framing with `fixture-verified` / `live-telemetry-verified` honest tier labels.
12. Added Appendix A MOF integration anchors and recommended changelog entry.

Wallet-graph data sourcing is now explicitly flagged as a dedicated subprogram in §4.2 Dimension 4 (it is not a side capability of organ-runtime).

This is Hepar operating at organ standard.

Not a filter. Not a screener. Not a badge factory.

A forensic intelligence system worthy of its biological namesake.