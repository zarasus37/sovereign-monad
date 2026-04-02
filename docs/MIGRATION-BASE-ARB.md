# Sovereign Migration Runbook
## Base <-> Arbitrum

> Repo-accurate migration guide for the Base/Arbitrum artifacts present in this repository.
> Last updated: 2026-04-02
> Status: Base/Arbitrum migration artifacts exist in the repo. Their presence does not, by itself, advance the canonical master phase or prove live readiness.

## Purpose

This document tracks the Base/Arbitrum-oriented artifact path that exists in the repo. It is a repo-local reference, not the canonical statement of project phase.

Use the separate `sovereign-monad` repo for canonical status: `https://github.com/zarasus37/sovereign-monad`.

## Repo State

### Present In Repo

- `.env` and compose artifacts for Base/Arbitrum naming
- `docker-compose.mainnet.yml`
- `base-market-agent`
- `arbitrum-market-agent`
- `spread-scanner`
- `opportunity-constructor`
- `risk-engine`
- `portfolio-manager`
- `arb-bot`
- monitoring and alerting helpers

### Still Required Before Canonical Advancement

- funded-wallet validation under explicit operator control
- live-execution validation
- proof that route quality supports sustained deployment
- MOF-level phase advancement based on those results

## Legacy Reference Artifacts

The superseded Monad/Ethereum service folders are retained as reference artifacts rather than deleted. They are not part of the canonical current system.

Treat these folders as dormant reference implementations:

- `monad-market-agent`
- `eth-market-agent`
- `monad-arb-bot`
- `eth-arb-bot`
- `bridge-exec-bot`

## Repo Map

Use these paths as repo-local reference points for the Base/Arbitrum artifact set:

| Area | Path | Notes |
|------|------|-------|
| Main orchestration | `docker-compose.mainnet.yml` | Base/Arbitrum service topology artifact |
| Base market feed | `base-market-agent` | Feed publisher artifact |
| Arbitrum market feed | `arbitrum-market-agent` | Feed publisher artifact |
| Execution service | `arb-bot` | Consumes execution plans and emits execution results |
| Spread pipeline | `spread-scanner` | Consumes both market feeds |
| Risk pipeline | `opportunity-constructor`, `risk-engine`, `portfolio-manager` | Downstream evaluation and sizing |
| Dashboard | `monitoring/dashboard.py` | Monitoring UI |
| Commercial demo | `demo-package/` | Buyer-facing synthetic demo path |
| API product | `templates/api/` | HTTP wrapper and tier scaffolding |

Treat the compose file as the repo-local reference when a service folder or README disagrees. Do not use it to override the MOF.

## Intended Service Topology

1. `base-market-agent` publishes `market.base.price-snapshot`
2. `arbitrum-market-agent` publishes `market.arbitrum.price-snapshot`
3. `spread-scanner` publishes `market.spread.signal`
4. `opportunity-constructor` publishes `risk.opportunity-candidate`
5. `risk-engine` publishes `risk.opportunity-evaluation`
6. `portfolio-manager` publishes `execution.execution-plan`
7. `arb-bot` publishes `execution.execution-result`

## Environment Contract

Important: `.env.example` is a template, not proof that every non-empty address in it has been production-validated.

### Required chain endpoints

```env
BASE_WS_URL=
BASE_RPC_URL=
ARBITRUM_WS_URL=
ARBITRUM_RPC_URL=
```

### Typical validation controls

```env
MIN_SPREAD_BPS=12
MIN_LIQUIDITY_10BPS_USD=750
MIN_CAPACITY_USD=3000
MIN_SIZE_USD=250
RISK_FIXED_COST_BPS=8
RISK_MIN_EFFECTIVE_SPREAD_BPS=12
DRY_RUN=true
MAX_SINGLE_TRADE_PERCENT=10
MAX_SLIPPAGE_BPS=50
```

These are validation settings, not live-capital approvals.

## Validation Workflow

```powershell
docker compose -f docker-compose.mainnet.yml build
docker compose -f docker-compose.mainnet.yml up -d
docker compose -f docker-compose.mainnet.yml logs base-market-agent
docker compose -f docker-compose.mainnet.yml logs arbitrum-market-agent
docker compose -f docker-compose.mainnet.yml logs spread-scanner
docker compose -f docker-compose.mainnet.yml logs risk-engine
docker compose -f docker-compose.mainnet.yml down
```

## Conditional Next Step

If this route is resumed, the next repo-level step is guarded-live preparation under explicit operator control.
