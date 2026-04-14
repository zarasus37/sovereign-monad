# Ecosystem Build Map

This document is the canonical working build tracker for the Sovereign Monad ecosystem.

Use it for:

- tracking progress piece by piece
- seeing what is already built
- seeing what is still incomplete
- deciding what we should handle next

Status legend:

- `DONE`: implemented and locally verified at the current expected level
- `PARTIAL`: meaningful implementation exists, but the piece is not yet complete
- `BLOCKED`: the next step is known, but external inputs or upstream dependencies are blocking it
- `NOT STARTED`: doctrine/spec exists but build work has not materially begun

## 0. Completion View

This project needs two completion readings:

- local build-state completion
- live / production completion

They are not interchangeable.

Tracked local build-state rollups:

- major-area rollup: `59/71 complete` (`83.1%`)
- layer-by-layer rollup: `80/98 complete` (`81.6%`)

These percentages describe what has been built and verified locally. They do **not** mean the project is `74.6%` live or production-complete.

### 0.1 Major Area Completion Matrix

| Major Area | Local Build State | Live / Production State | Capital-Gated? | Current Read |
|---|---|---|---|---|
| Canonical Core | built | canonical and current | no | `5/5` |
| Phase 1a Routing Substrate | built except live deployment | not live | yes | `5/6` |
| Runtime Revenue Engine | mostly built locally | not yet live-proven | partly | `8/12` |
| Commercial Support Surface | scaffolded locally | not publicly deployed | partly | `5/8` |
| Production Operations | tooling exists locally | infra not live | yes | `6/10` |
| Later-Layer Sovereign System | locally complete at zero-capital expected level | not live / not externalized | mixed | `30/30` |

### 0.2 What Is Actually Complete

- locally complete at the current expected level: Canonical Core, Intelligence Layer, Signal Layer, Platform, DAO, Keys, Narrative, Dove, Gnosis, Data Rail, and Emergent Protocol local surfaces
- locally partial but meaningful: Oracle, Phase 1a substrate, runtime engine, commercial stack, production ops
- blocked or not started in live terms: Treasury, live Phase 1a deployment proof, runtime execution-truth closure, funded `Cardia`, live Keys activation, public Data Rail activation, and broader production/public rollout

## 1. Major Areas

### A. Canonical Core

Status: `DONE`
Progress: `5/5 complete`

Complete:

- MOF is canonical and synchronized
- Gnosis Integrity Layer spec exists
- `DoveCore.sol` exists
- Revenue Router specification artifact exists
- canonical sync discipline and constitutional engineering brief exist for mirrors, subordinate docs, and implementation discipline

Remaining:

- none

### B. Phase 1a Routing Substrate

Status: `PARTIAL`
Progress: `5/6 complete`

Complete:

- reconstructed Phase 1a contract suite exists
- Hardhat workspace exists
- baseline reconstruction test harness exists
- deeper Phase 1a invariant coverage exists
- deployment sequence implementation, rehearsal, and resumable checkpointed live path exist

Remaining:

- live onchain deployment

### C. Runtime Revenue Engine

Status: `PARTIAL`
Progress: `8/12 complete`

Complete:

- market-agent path exists
- spread scanner exists
- opportunity constructor exists
- risk engine exists
- portfolio planning exists
- execution adapter path exists
- settlement reconciliation exists
- feedback/logging surface exists

Remaining:

- stronger mainnet calibration
- full bridge truth under live conditions
- live bankroll routing loop
- sustained guarded-live operating record

Capital-gated local surface:

- `execution-truth-core` now exists locally in `monad-mev` and currently reports `blocked` until live Phase 1a proof and bootstrap source registration are recorded

### D. Commercial Support Surface

Status: `PARTIAL`
Progress: `5/8 complete`

Complete:

- buyer demo package exists
- evaluation API exists
- billing scaffold exists
- license service exists
- commercial stack packaging exists

Remaining:

- real production secrets and URLs
- public deployment
- real first-customer issuance flow

### E. Production Operations

Status: `PARTIAL`
Progress: `6/10 complete`

Complete:

- VPS bootstrap layer exists
- edge routing with Caddy exists
- env provisioning exists
- backup/restore tooling exists
- customer/license seed tooling exists
- operator runbooks exist

Remaining:

- live VPS
- live domain and DNS
- real Stripe config
- public verification against production endpoints

Capital-gated local surfaces:

- `cardia-activation-core` now exists locally in `monad-mev` and currently reports `blocked`
- `public-activation-core` now exists locally in `monad-mev` and currently reports `blocked`

### F. Later-Layer Sovereign System

Status: `DONE`
Progress: `30/30 complete`

Complete:

- Intelligence Layer analysis runtime now exists locally
- Signal Layer analysis substrate now exists locally
- Oracle analysis scaffold now exists locally
- Gnosis analysis scaffold now exists locally
- Boundary stress analysis scaffold now exists locally
- shared internal state/API surface now exists locally
- first internal dashboard/operator surface now exists locally
- builder infrastructure now exists locally
- controlled expansion framework now exists locally
- local key activation scaffold now exists
- local delegation boundary system now exists
- behavioral capture policy surface now exists locally
- reward/data schema scaffold now exists locally
- local internal Data Rail routing now exists
- local internal reward ledger now exists
- local Data Rail diversity thresholds, rights policy, and externalization gates now exist
- local emergence observation preparation now exists
- local threshold-closing population execution now exists
- local rights review queue resolution now exists
- local externalization activation gate now evaluates ready on the verified local sample
- local activation-decision discipline now exists and keeps externalization at `review`, not activated
- local next-wave population expansion target now exists beyond the threshold-clearing sample
- local emergence observation now reaches observable readiness with a forming evidence window
- local emergence baseline now extends beyond seed to five windows with improving trend
- local emergence accumulation now reaches `review_ready` at `5/8` windows
- local DAO constitution, proposal routing, and handoff scaffold now exist
- local Keys NFT metadata and collection policy scaffold now exist
- local narrative packaging and publication discipline now exist
- local Dove drift-signaling integration now exists
- local Gnosis evaluation and integrity scoring now exist
- local Data Rail bundle/product boundary preparation now exists
- local emergent protocol pattern extraction and downstream-path scaffold now exists

Remaining:

- none at the current zero-capital expected level

Live follow-ons:

- Treasury live maturity
- live governance activation
- Oracle maturity beyond repo-local surfaces
- live Keys activation
- live external Data Rail productization
- emergent protocol maturity beyond observation prep

## 2. Layer-By-Layer Breakdown

### Layer 1. The Funnel

Status: `PARTIAL`
Progress: `3/7 complete`

Complete:

- multi-rail funnel doctrine is now defined locally
- agent-native revenue rail doctrine is now defined locally
- first organ set specification is now defined locally
- the six-organ opening set is now explicitly canonized as part of Layer 1's funnel revenue rail

Remaining:

- MonadSpin product design
- API/licensing revenue rail activation
- agent-native revenue rail activation
- RTP logic
- inflow routing implementation
- live funding rail deployment

### Layer 2. The Engine

Status: `PARTIAL`
Progress: `10/16 complete`

Complete:

- `base-market-agent`
- `arbitrum-market-agent`
- `spread-scanner`
- `opportunity-constructor`
- `risk-engine`
- `portfolio-manager`
- `arb-bot`
- `model-feedback-logger`
- deterministic stress matrix
- receipt-based settlement reconciliation

Remaining:

- stable live feed path
- stronger threshold calibration
- full bridge execution truth
- live bankroll loop
- sustained mainnet record
- first fully validated guarded-live cycle

### Layer 3. The Treasury

Status: `BLOCKED`
Progress: `1/5 complete`

Complete:

- treasury role is defined in routing doctrine/spec

Remaining:

- treasury sink deployment
- treasury router wiring
- reserve controls
- live capital accumulation

### Layer 4. The DAO

Status: `DONE`
Progress: `4/4 complete`

Complete:

- governance constitution now exists locally
- governance agent scaffold now exists locally
- proposal system now exists locally
- handoff controls now exist locally

Remaining:

- none at the current zero-capital expected level

### Layer 5. Intelligence Layer

Status: `DONE`
Progress: `16/16 complete`

Complete:

- agent-native revenue rail doctrine is now defined locally
- first organ set specification is now defined locally
- physiological design lessons and cortical overlay discipline are now captured locally
- organ runtime scaffold now exists locally
- zero-capital vs capital-gated build flow is now defined locally
- `Synapse` is now implemented in analysis mode
- `Hepar` is now implemented in analysis mode
- `Cortex` is now implemented in analysis mode
- `Vox` is now implemented in analysis mode
- `Pneuma` is now implemented in analysis mode
- `Cardia` is now implemented in analysis mode
- orchestration model hardening now exists in analysis mode
- human-agent participation boundary system now exists in analysis mode
- first bounded ecosystem-seeded mandate now exists in analysis mode
- inter-organ coordination rules now exist in analysis mode
- homeostasis and mixed-speed signaling rules are now implemented in analysis mode
- immune, barrier, and repair logic is now implemented in analysis mode

Remaining:

- none

### Layer 6. Oracle

Status: `PARTIAL`
Progress: `4/6 complete`

Complete:

- repo-level risk engine implementation
- API wrapper
- stress tooling and regression coverage
- local Oracle regime/posture scaffold now exists

Remaining:

- canonical Oracle maturity
- live calibration and buyer proof under production conditions
- Phase 3+ implementation path

### Layer 7. Signal Layer

Status: `DONE`
Progress: `3/3 complete`

Complete:

- signal schema now exists locally
- aggregation substrate now exists locally
- behavioral and event interpretation layer now exists locally

Remaining:

- none

### Layer 8. Platform

Status: `DONE`
Progress: `3/3 complete`

Complete:

- shared internal state/API surface now exists locally
- first internal dashboard/operator surface now exists locally
- builder infrastructure and controlled expansion framework now exist locally

Remaining:

- none

### Layer 9. Keys

Status: `DONE`
Progress: `3/3 complete`

Complete:

- local user-linked key activation scaffold now exists
- local delegation boundary system now exists
- local agent NFT metadata and collection policy scaffold now exists

Remaining:

- none at the current zero-capital expected level

Live follow-ons:

- live minting and live Keys activation

### Layer 10. Narrative

Status: `DONE`
Progress: `4/4 complete`

Complete:

- symbolic doctrine exists
- positioning documents exist
- production narrative infrastructure now exists locally
- governed public narrative surface scaffold tied to system state now exists locally

Remaining:

- none at the current zero-capital expected level

Live follow-ons:

- live public narrative activation and distribution

### Layer 11. Dove Protocol

Status: `DONE`
Progress: `4/4 complete`

Complete:

- `DoveCore.sol` exists
- `DoveRouterObserver.sol` exists in reconstructed Phase 1a suite
- local `BoundaryStressMonitor v1` analysis scaffold now exists
- local live-drift-signaling integration scaffold now exists

Remaining:

- none at the current zero-capital expected level

Live follow-ons:

- deployed Dove path

### Layer 12. Gnosis Integrity Layer

Status: `DONE`
Progress: `4/4 complete`

Complete:

- spec/doctrine exists
- local retrospective-only Gnosis scaffold now exists
- evaluation mechanics integration now exists locally
- integrity scoring tied to agent operation now exists locally

Remaining:

- none at the current zero-capital expected level

### Layer 13. Unified Revenue Router

Status: `PARTIAL`
Progress: `4/6 complete`

Complete:

- reconstructed `RevenueRouter.sol`
- reconstructed sink contracts
- reconstructed `InboundReceiver.sol`
- deployment sequence runner and rehearsal exist

Remaining:

- deeper routing tests
- live deployment
- live routing proof

### Layer 14. Data Rail

Status: `DONE`
Progress: `10/10 complete`

Complete:

- behavioral capture policy surface now exists locally
- reward/data schema scaffold now exists locally
- internal routing logic now exists locally
- internal reward ledger now exists locally
- diversity thresholds, rights policy, and externalization gate surface now exist locally
- population thresholds are now met locally across a verified `9`-event / `9`-actor sample
- rights review queue is now resolved locally with `0` open cases
- activation readiness now evaluates `ready` on the verified local sample
- activation-decision discipline now exists locally and keeps the current posture at `review`, not activated
- next-wave population expansion targeting now exists locally (`16` events / `12` actors, plus missing `gnosis` and `rejected` windows)
- local bundle/product boundary preparation now exists

Remaining:

- none at the current zero-capital expected level

Live follow-ons:

- live revenue loop and external productization activation

### Layer 15. Emergent Protocol System

Status: `DONE`
Progress: `7/7 complete`

Complete:

- local emergence observation now reaches observable readiness with a forming evidence window
- local longitudinal baseline now spans `5` windows with an improving trend
- local longitudinal accumulation discipline now exists and is `review_ready` at `5/8` windows
- local pattern extraction system now exists
- local protocol discovery logic now exists
- local emergence validation rules now exist
- local formalized downstream protocol path now exists

Remaining:

- none at the current zero-capital expected level

Live follow-ons:

- longitudinal emergence evidence accumulation beyond the current local windows
- formal emergence claims only after durable live evidence

## 3. Repo Map

### Canonical Repo: `sovereign-monad`

Primary contents:

- canonical MOF
- canonical specs
- `DoveCore.sol`
- reconstructed Phase 1a contracts
- reconstruction tests

### Runtime Repo: `monad-mev`

Primary contents:

- runtime services
- demo package
- API/billing/license services
- deployment stack
- operator docs
- local MOF mirror

## 4. Current Build Frontier

The next build frontier remains:

1. complete live Phase 1a deployment proof
2. register the bootstrap approved source and verify the first live routing path
3. close remaining execution-truth gaps in the runtime
4. deploy the runtime/commercial stack with real infrastructure inputs

Everything else should be sequenced relative to those gates.

The structural zero-capital layer frontier is now complete locally.

Remaining zero-cost operations are longitudinal:

1. real population expansion beyond the current verified local sample
2. continued longitudinal emergence accumulation from `5/8` toward the target
3. explicit activation records only after the evidence target is met

Current capital/live frontier:

1. complete live Phase 1a deployment proof
2. register the bootstrap approved source and verify the first live routing path
3. close remaining execution-truth gaps in the runtime
4. activate funded `Cardia` and bankroll routing
5. deploy the runtime/commercial stack with real infrastructure inputs

Current capital/live snapshot:

- live Phase 1a deployment proof now has a resumable checkpoint path but remains blocked by deployer funding restore
- bootstrap approved-source registration remains blocked until live deployment proof yields canonical live addresses
- runtime execution-truth closure is now tracked locally by `execution-truth-core` and currently remains `blocked`
- funded `Cardia` activation is now tracked locally by `cardia-activation-core` and currently remains `blocked`
- production/public activation is now tracked locally by `public-activation-core` and currently remains `blocked`

