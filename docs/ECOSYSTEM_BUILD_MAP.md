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

## 1. Major Areas

### A. Canonical Core

Status: `DONE`
Progress: `5/5 complete`

Complete:

- MOF is canonical and synchronized
- Gnosis Integrity Layer spec exists
- `DoveCore.sol` exists
- Revenue Router specification artifact exists
- canonical sync discipline exists for mirrors and subordinate docs

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
- deployment sequence implementation and rehearsal exist

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

### F. Later-Layer Sovereign System

Status: `PARTIAL`
Progress: `1/9 complete`

Complete:

- Intelligence Layer runtime scaffold now exists locally

Remaining:

- Treasury live maturity
- governance system
- Intelligence Layer runtime
- Oracle maturity beyond repo-local surfaces
- Signal Layer
- Platform
- Keys
- Data Rail
- Emergent Protocol System

## 2. Layer-By-Layer Breakdown

### Layer 1. The Funnel

Status: `PARTIAL`
Progress: `3/7 complete`

Complete:

- multi-rail funnel doctrine is now defined locally
- agent-native revenue rail doctrine is now defined locally
- first organ set specification is now defined locally

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

Status: `NOT STARTED`
Progress: `0/4 complete`

Complete:

- none

Remaining:

- governance constitution
- governance agent
- proposal system
- handoff controls

### Layer 5. Intelligence Layer

Status: `PARTIAL`
Progress: `9/16 complete`

Complete:

- agent-native revenue rail doctrine is now defined locally
- first organ set specification is now defined locally
- physiological design lessons are now captured locally
- organ runtime scaffold now exists locally
- zero-capital vs capital-gated build flow is now defined locally
- `Synapse` is now implemented in analysis mode
- `Hepar` is now implemented in analysis mode
- `Cortex` is now implemented in analysis mode
- `Vox` is now implemented in analysis mode

Remaining:

- `Pneuma` implementation
- `Cardia` simulation and band logic
- orchestration model hardening
- human-agent participation boundary system
- first bounded ecosystem-seeded agent revenue mandate
- inter-organ coordination rules
- homeostasis and mixed-speed signaling rules
- immune, barrier, and repair implementation logic

### Layer 6. Oracle

Status: `PARTIAL`
Progress: `3/6 complete`

Complete:

- repo-level risk engine implementation
- API wrapper
- stress tooling and regression coverage

Remaining:

- canonical Oracle maturity
- live calibration and buyer proof under production conditions
- Phase 3+ implementation path

### Layer 7. Signal Layer

Status: `NOT STARTED`
Progress: `0/3 complete`

Complete:

- none

Remaining:

- signal schema
- aggregation substrate
- behavioral/event interpretation layer

### Layer 8. Platform

Status: `NOT STARTED`
Progress: `0/3 complete`

Complete:

- none

Remaining:

- builder infrastructure
- ecosystem access surface
- controlled expansion framework

### Layer 9. Keys

Status: `NOT STARTED`
Progress: `0/3 complete`

Complete:

- none

Remaining:

- agent NFTs
- user-linked key logic
- delegation boundary system

### Layer 10. Narrative

Status: `PARTIAL`
Progress: `2/4 complete`

Complete:

- symbolic doctrine exists
- positioning documents exist

Remaining:

- production narrative infrastructure
- live public narrative surface tied to system state

### Layer 11. Dove Protocol

Status: `PARTIAL`
Progress: `2/4 complete`

Complete:

- `DoveCore.sol` exists
- `DoveRouterObserver.sol` exists in reconstructed Phase 1a suite

Remaining:

- deployed Dove path
- live drift-signaling integration

### Layer 12. Gnosis Integrity Layer

Status: `NOT STARTED`
Progress: `1/4 complete`

Complete:

- spec/doctrine exists

Remaining:

- evaluation mechanics
- runtime implementation
- integrity scoring tied to agent operation

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

Status: `NOT STARTED`
Progress: `0/4 complete`

Complete:

- none

Remaining:

- productization
- routing logic
- monetization implementation
- live revenue loop

### Layer 15. Emergent Protocol System

Status: `NOT STARTED`
Progress: `0/4 complete`

Complete:

- none

Remaining:

- pattern extraction system
- protocol discovery logic
- emergence validation rules
- formalized downstream protocol path

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

