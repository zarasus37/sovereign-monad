# Sovereign Migration Runbook
## Base <-> Arbitrum

> Repo-accurate migration and validation guide for the current Base/Arbitrum stack.
> Last updated: 2026-03-18
> Status: Code migration largely complete; end-to-end DRY_RUN validation still pending.

---

## Purpose

This document is the single source of truth for the migration from the old Monad/Ethereum topology to the current Base/Arbitrum topology used in this repository.

It replaces the earlier mixed draft and is intentionally written against the code that exists now, not against a planned future layout.

---

## Current State

### Completed

- `.env` uses Base/Arbitrum endpoint names with the `*_URL` suffix.
- `docker-compose.mainnet.yml` is aligned around the Base/Arbitrum service topology.
- `monitoring/dashboard.py` already uses Base/Arbitrum labeling.
- `base-market-agent` exists and is wired to Aerodrome.
- `arbitrum-market-agent` exists and is wired to Camelot.
- `arb-bot` exists and matches the current execution contract.
- The updated services build successfully with TypeScript and Docker.

### Pending

- Re-run the DRY_RUN compose stack after the WebSocket endpoint fix.
- Confirm live topic flow from market snapshots through execution results.
- Clean up any residual legacy references only after the new path is stable.

### Important recent runtime finding

The last compose smoke test was blocked by dead public WebSocket endpoints, not by the market-agent or executor code. The configured WebSocket endpoints were replaced with working public endpoints and verified from this machine.

---

## Repo Map

Use these paths as the current source of truth.

| Area | Path | Notes |
|------|------|-------|
| Main orchestration | `docker-compose.mainnet.yml` | Current service topology |
| Base market feed | `base-market-agent` | Aerodrome-based feed publisher |
| Arbitrum market feed | `arbitrum-market-agent` | Camelot-based feed publisher |
| Execution service | `arb-bot` | Consumes execution plans and emits execution results |
| Bridge scaffold | `bridge-agent` | Across-oriented bridge package |
| Legacy bridge executor | `bridge-exec-bot` | Older bridge executor path |
| Legacy Base-side reference | `monad-market-agent` | Historical source used during migration |
| Legacy Arbitrum-side reference | `eth-market-agent` | Historical source used during migration |
| Spread pipeline | `spread-scanner` | Consumes both market feeds |
| Risk pipeline | `opportunity-constructor`, `risk-engine`, `portfolio-manager` | Downstream evaluation and sizing |
| Dashboard | `monitoring/dashboard.py` | Monitoring UI |

---

## Service Topology

The intended runtime path is:

1. `base-market-agent` publishes `market.base.price-snapshot`
2. `arbitrum-market-agent` publishes `market.arbitrum.price-snapshot`
3. `spread-scanner` publishes `market.spread.signal`
4. `opportunity-constructor` publishes `risk.opportunity-candidate`
5. `risk-engine` publishes `risk.opportunity-evaluation`
6. `portfolio-manager` publishes `execution.execution-plan`
7. `arb-bot` publishes `execution.execution-result`

This execution path is why `arb-bot` was built around the execution-plan contract rather than around the old bridge-request flow.

---

## Environment Contract

Use the current `.env` naming scheme. Do not reintroduce older short-form names unless you intentionally refactor the services and compose file together.

### Required chain endpoints

```env
BASE_WS_URL=
BASE_RPC_URL=
ARBITRUM_WS_URL=
ARBITRUM_RPC_URL=
```

### DEX configuration

```env
AERODROME_ROUTER_ADDR=
AERODROME_ETH_USDC_POOL=
CAMELOT_ROUTER_ADDR=
CAMELOT_ETH_USDC_POOL=
```

### Bridge configuration

```env
ACROSS_SPOKEPOOL_BASE=
ACROSS_SPOKEPOOL_ARBITRUM=
```

### Risk and execution controls

```env
MIN_SPREAD_BPS=
MIN_LIQUIDITY_10BPS_USD=
MIN_CAPACITY_USD=
DRY_RUN=
MAX_SINGLE_TRADE_PERCENT=
MAX_BRIDGE_EXPOSURE_PERCENT=
```

### Known-good endpoint note

At the time of this update, the dead placeholder WebSocket endpoints were replaced in `.env` with working public endpoints for Base and Arbitrum. If the stack fails again during startup, verify endpoint health before changing application code.

---

## Implementation Notes

### Base market agent

`base-market-agent` was created from the old Base-side reference flow and adapted for Aerodrome.

Current expectations:

- consumes `CHAIN_A_WS_URL` and `CHAIN_A_RPC_URL` from compose
- receives Base values via `BASE_WS_URL` and `BASE_RPC_URL`
- publishes `market.base.price-snapshot`
- preserves the downstream snapshot shape expected by `spread-scanner`

### Arbitrum market agent

`arbitrum-market-agent` now contains a working Camelot-oriented implementation rather than the earlier scaffold-only draft.

Current expectations:

- consumes `CHAIN_B_WS_URL` and `CHAIN_B_RPC_URL` from compose
- receives Arbitrum values via `ARBITRUM_WS_URL` and `ARBITRUM_RPC_URL`
- publishes `market.arbitrum.price-snapshot`
- preserves the downstream snapshot shape expected by `spread-scanner`

### Execution bot

`arb-bot` is the current executor target for the stack.

Current expectations:

- consumes `execution.execution-plan`
- emits `execution.execution-result`
- uses Base and Arbitrum RPC endpoints
- supports `DRY_RUN=true`

This is the correct contract for the present pipeline because `portfolio-manager` emits execution plans, not bridge requests.

---

## Compose Alignment Checklist

Before treating the migration as complete, verify all of the following:

1. Every `build.context` path in `docker-compose.mainnet.yml` exists on disk.
2. Every referenced environment variable exists in `.env` or has a safe default.
3. Topic names match across all producers and consumers.
4. Service names in logs and smoke tests match compose service names, not stale container names from older drafts.
5. Logger configuration does not depend on local-only transports that are missing in Docker.

---

## Validation Workflow

Use compose-driven validation rather than ad hoc container commands.

### Build all services

```powershell
docker compose -f docker-compose.mainnet.yml build
```

### Start the stack

```powershell
docker compose -f docker-compose.mainnet.yml up -d
```

### Inspect market agents first

```powershell
docker compose -f docker-compose.mainnet.yml logs base-market-agent
docker compose -f docker-compose.mainnet.yml logs arbitrum-market-agent
```

### Inspect downstream flow

```powershell
docker compose -f docker-compose.mainnet.yml logs spread-scanner
docker compose -f docker-compose.mainnet.yml logs opportunity-constructor
docker compose -f docker-compose.mainnet.yml logs risk-engine
docker compose -f docker-compose.mainnet.yml logs portfolio-manager
docker compose -f docker-compose.mainnet.yml logs arb-bot
```

### Filter for spreads on Windows PowerShell

```powershell
docker compose -f docker-compose.mainnet.yml logs spread-scanner | Select-String -Pattern 'spread'
```

### Tear down

```powershell
docker compose -f docker-compose.mainnet.yml down
```

---

## Acceptance Criteria

Do not treat the migration as complete until all of the following are true:

- `docker compose -f docker-compose.mainnet.yml build` succeeds cleanly.
- `base-market-agent` emits Base snapshots.
- `arbitrum-market-agent` emits Arbitrum snapshots.
- `spread-scanner` consumes both feeds and emits spread signals.
- The downstream risk services continue to process without schema breakage.
- `arb-bot` consumes execution plans and emits execution results.
- `monitoring/dashboard.py` shows useful live data.
- `DRY_RUN=true` works end to end before any live-capital test.

---

## Recommended Next Step

The next engineering step is to rerun the DRY_RUN stack with the corrected WebSocket endpoints and verify live topic flow. If that succeeds, only then move on to cleanup of legacy folders or further refactors.
