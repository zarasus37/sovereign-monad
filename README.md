# Sovereign Monad

This repository contains the canonical Sovereign Monad materials plus the runtime and system modules that belong to the Sovereign Monad build path described in the MOF.

## Canonical Documents

- `docs/sovereign_monad_MOF_v2.3.0.md`
- `docs/ECOSYSTEM_BUILD_MAP.md`
- `docs/BUILD_EXECUTION_FLOW.md`
- `docs/CANONICAL_SYNC_DISCIPLINE.md`
- `docs/FIRST_ORGAN_SET.md`
- `docs/CORTICAL_OVERLAY_MODEL.md`
- `docs/Gnosis_Integrity_Layer_Spec_v1.2.md`
- `docs/data_buyer_thesis.md`
- `DoveCore.sol`
- `Revenue_Router_Specification_—_Phase_1a.pdf`
- `Revenue_Router_Specification_—_Phase_1a.zip`

## Current Standardization Artifact

- `docs/CANDIDATE_STANDARD_KERNEL_V0.md`
  - subordinate to the MOF
  - freezes the current internal standard-kernel candidate and its first conformance matrix

## Phase 1a Contract Workspace

- `contracts/`
- `scripts/`
- `test/`
- `hardhat.config.js`
- `package.json`
- `docs/PHASE1A_DEPLOYMENT_SEQUENCE.md`
- `docs/SLOT_SOURCE_HANDOFF.md`

Current status:

- the original Phase 1a Solidity source set was not recovered
- Phase 1a contracts were reconstructed from the canonical MOF, the surviving `DoveCore.sol`, and the surviving Revenue Router specification
- the reconstructed contract workspace compiles, has `14` passing Hardhat tests, and includes a locked deployment-sequence runner plus local rehearsal flow
- live preflight uses a native-token gas floor on Monad mainnet, not Ethereum-mainnet USD assumptions
- live deploy guidance now distinguishes the hard fail floor from the recommended deploy budget (`1 MON` minimum, `10 MON` recommended)
- live deploy now supports resumable checkpoint/retry via `deployments/phase1a-progress-<network>.json`

Canonical rule:

- this reconstruction is repo truth
- deployment truth remains governed by the MOF
- reconstructed code is not treated as equivalent to recovered original source history

## Intelligence Organ Model

The opening ecosystem-native agent set is specified as the first organ cluster of the organism:

- `Cardia` for capital circulation
- `Pneuma` for external exchange
- `Hepar` for opportunity filtering
- `Cortex` for research synthesis
- `Synapse` for signal routing
- `Vox` for narrative expression

See:

- `docs/FIRST_ORGAN_SET.md`
- `docs/AGENT_NATIVE_REVENUE_RAIL.md`

## Current Local Data Rail State

- thresholds are met on the current verified local sample (`9` events, `9` actors, `4` actor classes, `5` surfaces, `5` outcomes)
- the rights review queue is resolved with `0` open cases
- externalization readiness is structurally `ready` in local analysis mode
- activation-decision discipline is now implemented, and the current local posture is `review`, not activated
- the next local expansion target is `16` events across `12` actors, including a `gnosis` surface event and a clean `rejected` outcome
- emergence observation is `observable`, and longitudinal accumulation is `review_ready` at `5/8` windows
- bounded local emergence claim and history artifacts now exist, but they remain evidence scaffolding only and do not create a live recognition layer or operating-surface authority

## Phase 1a Commands

```bash
npm run build:contracts
npm run test:contracts
npm run preflight:phase1a
npm run deploy:phase1a
npm run rehearse:phase1a
npm run verify:phase1a
npx hardhat run scripts/slot-source-handoff.js --network phase1a
```

Resumable live deployment notes:

- `npm run deploy:phase1a` now writes `deployments/phase1a-progress-<network>.json`
- rerunning the deploy command resumes from the saved checkpoint when possible
- `PHASE1A_RESUME_REPORT` can be set explicitly to point at a specific progress report

Current live blocker:

- live Phase 1a deployment proof is complete; the next blocker is runtime execution-truth closure in `monad-mev`

For the initial approved source:

- use the real Stake-linked MonadSpin source if it is deployed
- otherwise use a temporary bootstrap source address you control and document it as temporary

For a later source cutover:

- keep the bootstrap source approved until the real Stake-linked source is verified
- use the slot handoff script to add the real source and optionally revoke the bootstrap source

## Core Runtime Included

- `monad-market-agent/`
- `eth-market-agent/`
- `spread-scanner/`
- `opportunity-constructor/`
- `risk-engine/`
- `portfolio-manager/`
- `monad-arb-bot/`
- `eth-arb-bot/`
- `bridge-exec-bot/`
- `model-feedback-logger/`
- `stress-monitor/`
- `alert-rules/`
- `monitoring/`
- `docker-compose.yml`
- `docker-compose.testnet.yml`
- `docker-compose.prod.yml`
- `.env.testnet.example`

## Excluded On Purpose

- migration-branch artifacts from the older mixed workspace
- demo/commercial packaging templates
- generated build outputs, dependency trees, logs, and local env files

## Canonical Status Rule

The MOF remains the authority for phase, blocker state, and what is or is not live. Runtime code in this repo should not be read as automatic proof of canonical advancement.


