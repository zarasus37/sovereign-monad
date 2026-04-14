# Constitutional Engineering Brief

> This document is subordinate to `docs/sovereign_monad_MOF_v2.3.0.md`.
> The MOF remains the single canonical source of truth.
> If this brief and the MOF ever diverge, the MOF wins.

## 1. Purpose

This brief translates the MOF into implementation discipline for coding agents and technical collaborators.

It exists to improve:

- build discipline
- gate closure behavior
- layer-boundary preservation
- implementation honesty
- auditability

It does **not** redefine doctrine.
It does **not** add a sixteenth layer.
It does **not** authorize implementation that the MOF does not authorize.

The role of this brief is narrower:

- convert canonical doctrine into engineering constraints
- reduce ambiguity during implementation
- keep collaborators synchronized to the current gate
- prevent the project from drifting into feature accumulation, hidden enforcement, or phase confusion

## 2. Governing Posture

Any coding agent operating inside Sovereign Monad should adopt the posture of a **constitutional engineer**.

That means:

- treat the MOF as constitutional authority, not as optional background reading
- treat the current gate as the main organizing force of work
- preserve layer boundaries before optimizing elegance
- prefer explicit, auditable implementation over clever compression
- resist expanding the system unless that expansion closes the current gate or reduces its risk

This posture is not anti-creative.
It is anti-drift.

The system already contains a worldview.
The engineering task is to instantiate that worldview without violating its own laws.

## 3. Three-Speed Classification

Before modifying any subsystem, classify it by **speed**.

This classification is orthogonal to build status.

Status answers:

- `DONE`
- `PARTIAL`
- `BLOCKED`
- `NOT STARTED`

Speed answers a different question:

- what kind of authority the component has

### Speed 1 — Live-Enforceable

Meaning:

- the component can directly affect deployment, routing, balances, pause paths, approvals, canonical live state, or real economic flow

Build rule:

- minimal
- deterministic
- test-first
- auditable
- resistant to conceptual leakage from other layers

Examples:

- Phase 1a contracts
- `RevenueRouter`
- `InboundReceiver`
- approved-source registration path
- explicit governance execution paths
- explicit pause/containment logic where already canonized

Engineering implication:

- treat these surfaces as sacred narrow-waist infrastructure
- prefer explicit invariants over clever abstraction
- no silent side effects
- no policy hidden inside unrelated logic

### Speed 2 — Local Analytical Surface

Meaning:

- the component can observe, score, simulate, interpret, summarize, recommend, or classify
- but it does not directly enforce live state

Build rule:

- must remain honest about being local/analytical
- must not silently mutate live behavior
- must not masquerade as canonical live truth

Examples:

- local Oracle posture
- local Gnosis
- local Dove interpretation
- dashboards
- shared state aggregation
- local Data Rail readiness
- local activation gating surfaces that track blockers without enforcing onchain state themselves

Engineering implication:

- analytical surfaces may inform decisions
- they may not quietly become policy engines or hidden enforcers

### Speed 3 — Future Doctrine-Bound

Meaning:

- the component is canonically specified, but not yet live-implemented or phase-authorized

Build rule:

- may be scaffolded
- must be labeled as non-active
- must not leak into live execution or current gate logic

Examples:

- later mature Data Rail monetization enforcement
- future emergence claims
- future live Keys activation beyond current local scaffolds
- future mature Oracle externalization states

Engineering implication:

- scaffolding is acceptable
- pretending activation is not

## 4. Mapping Speed To Existing Status

To avoid creating a second status universe, apply speed and status together.

Examples:

- `RevenueRouter`
  - speed: `Live-Enforceable`
  - status: `PARTIAL` until live proof is complete

- `gnosis-core`
  - speed: `Local Analytical Surface`
  - status: `DONE` at the current local expected level

- future Behavioral Data Revenue Router enforcement
  - speed: `Future Doctrine-Bound`
  - status: `NOT STARTED` or `BLOCKED`, depending on phase and prerequisites

Rule:

- speed defines authority
- status defines progress

Never use one to substitute for the other.

## 5. Gate-First Priority Model

The project must be built around **gate closure**, not around feature completion.

Before any nontrivial change, answer:

1. Does this close the current canonical gate?
2. Does this reduce risk on the current canonical gate?
3. Does this produce evidence required by the current canonical gate?
4. If the answer to all three is no, why is this being done now?

If the work does not advance one of those three outcomes, it is secondary by default.

### Current Canonical Gate Sequence

As of the current MOF state:

1. live Phase 1a deployment proof
2. bootstrap approved-source registration
3. runtime execution-truth closure
4. funded `Cardia` activation
5. production/public activation

This is the truth path.

No downstream sophistication should be allowed to outrun it.

## 6. Canonical Translator Mindset

Collaborating models should reason in the project’s own language, not generic startup language.

Before substantial work, the collaborator should resolve these internal objects conceptually:

- `CurrentPhase`
- `CurrentBuildGate`
- `CurrentBlockers`
- `SpeedClassification`
- `LayerStatus`
- `DependencyGate`
- `DoctrineVsDeploymentFlag`
- `CurrentNextAction`

This does not require a runtime service first.
It requires disciplined reasoning first.

If later implemented as an internal parser/service, it should remain subordinate to the MOF and should never become an alternate authority.

## 7. Router Narrow-Waist Rule

The Phase 1a routing substrate is the first heartbeat of the organism.

Therefore:

- routing must remain simple
- routing must remain deterministic
- routing correctness must outrank conceptual richness
- observability belongs around routing, not hidden inside routing

Do not let:

- Dove logic
- Gnosis logic
- Narrative logic
- Data Rail logic
- future monetization logic

bleed into routing execution.

The bloodstream should become real before the mind becomes more beautiful.

## 8. Dove Non-Weaponization Rule

Dove is a witness/escalation system before it is anything else.

Dove may:

- observe
- classify drift
- attach evidence
- escalate by tier
- route governance questions
- participate in explicit, legible pause eligibility where canonized

Dove must not:

- silently mutate unrelated execution paths
- act as hidden policy enforcement
- become founder preference disguised as conscience
- quietly suppress flow without visible auditability

Emergency pause, where present, must remain:

- explicit
- legible
- attributable
- auditable

### Recommended Dove Observation Shape

This is a recommended engineering shape, not a new canonical contract schema:

```json
{
  "sourceLayer": "string",
  "driftType": "string",
  "axiomRef": "string",
  "severityTier": 1,
  "evidenceRefs": ["string"],
  "recommendedPath": "string",
  "governanceProposalRequired": false,
  "pauseEligible": false,
  "timestamp": "ISO8601"
}
```

The main point is not the exact field set.
The main point is that Dove output should be:

- explicit
- inspectable
- evidence-bearing

If a Dove-related change quietly changes execution behavior without a visible artifact, that change is suspect.

## 9. Gnosis Retrospective-Only Rule

Gnosis exists to interpret authenticity after action windows close.

It does not exist to pre-narrow the action space.

It does not exist to predictively police agents.

It does not exist to become a behavioral coprocessor.

Gnosis may:

- construct windows
- aggregate events
- compute retrospective scores
- produce explanation artifacts
- produce downstream soft recommendations

Gnosis must not:

- pre-suppress actions
- veto trades in advance
- shrink available action space upstream
- become predictive personality enforcement

### Why this matters

The decompression thesis requires that authentic action remain possible.

If Gnosis predicts and constrains in advance, then it stops measuring decompression and starts manufacturing compliance.

That would collapse the architecture into the very failure mode it was designed to prevent.

### Recommended Minimum Gnosis Event Tuple

This is a recommended engineering tuple for evaluation windows, not a frozen universal schema:

```json
{
  "agentId": "string",
  "delegateId": "string|null",
  "personalityVectorHash": "string",
  "role": "string",
  "marketRegime": "string",
  "stressState": "string",
  "action": "string",
  "outcome": {},
  "counterfactualBand": null,
  "gnosisWindowId": "string",
  "timestamp": "ISO8601"
}
```

The reason to preserve this shape directionally is not metaphysical elegance.
It is lineage clarity across:

- action
- stress
- role
- outcome
- evaluation window

## 10. Behavioral Data Discipline Rule

The behavioral moat depends more on lineage purity than on early conceptual richness.

So the engineering priority is:

- overfit provenance
- not theory

Trait theory may evolve.
Clean provenance remains valuable even when models change.

Therefore:

- raw events must remain attributable
- raw events must not be replaced with inferred history
- derived ontologies may evolve only if raw provenance remains recoverable

Rule:

- never destroy raw lineage in the name of schema cleanup
- never pretend retroactively inferred structure is the same as originally captured structure

## 11. Layer Boundary Rules

Never collapse:

- doctrine into deployment truth
- narrative into execution
- interpretation into enforcement
- local analysis into live canonical state
- integrity scoring into predictive control
- external frameworks into core ontology

Specific implications:

- `Signal Layer` is perceptual and substrate-oriented before it is strategic
- shared state and `Synapse` are integration surfaces before they are policy surfaces
- `Gnosis`, `Data Rail`, `Keys`, and `Narrative` are continuity/meaning surfaces, not hidden gatekeepers
- `Oracle`, activation gates, DAO routing, and `Cardia` controls are executive-control surfaces

## 12. External Integration Rule

External interoperability is acceptable at the edge.

It is not acceptable at the soul.

Good seam types:

- compute/exposure endpoints
- human verification at entry points
- translation layers for enterprise vocabulary

Bad seam types:

- replacing the ecosystem’s ontology with third-party taxonomy
- subordinating Dove to outside governance standards
- exporting Gnosis as a buzzword before it becomes a stable metric

Rule:

- integrate at the edge
- never let outside systems redefine the core ontology

## 13. Decision Order For Collaborating Models

When deciding what to do next, optimize in this order:

1. protect canonical truth
2. close the current gate
3. preserve layer boundaries
4. produce auditable artifacts
5. avoid hidden enforcement
6. keep local analytical surfaces honest
7. delay sophistication unless it improves truth closure

That order should override the ordinary bias toward feature breadth.

## 14. What Must Never Happen

- never activate `Cardia` before the funded path is actually ready
- never let Dove silently change execution outcomes
- never let Gnosis become predictive control
- never let local analytical surfaces masquerade as live truth
- never treat test/simulation/analysis output as live proof
- never prioritize elegance over the current gate
- never let a subordinate brief become a competing authority to the MOF

## 15. Immediate Operating Rule

If a proposed change does not:

- close the gate
- reduce gate risk
- or produce gate evidence

then it should be treated as secondary unless there is a documented reason to do it now.

That is the simplest reliable behavior correction for complex agentic work in this project.
