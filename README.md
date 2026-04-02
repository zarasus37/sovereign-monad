# Sovereign Monad

This repository contains the canonical Sovereign Monad materials plus the runtime and system modules that plausibly belong to the final project build path described in the MOF.

## Canonical Documents

- `docs/sovereign_monad_MOF_v2.3.0.md`
- `docs/Gnosis_Integrity_Layer_Spec_v1.2.md`
- `docs/data_buyer_thesis.md`
- `DoveCore.sol`
- `Revenue_Router_Specification_—_Phase_1a.pdf`
- `Revenue_Router_Specification_—_Phase_1a.zip`

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

- Base/Arbitrum migration branch artifacts
- demo/commercial packaging templates
- generated build outputs, dependency trees, logs, and local env files

## Canonical Status Rule

The MOF remains the authority for phase, blocker state, and what is or is not live. Runtime code in this repo should not be read as automatic proof of canonical advancement.

