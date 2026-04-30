# Operational Pass/Fail + Funding Matrix

Date context: 2026-04-29 local snapshot.

This document gives hard pass/fail definitions for the current activation lane and ties each gate to capital requirements.

## 1) Two Critical Clarifications

### A. Agent 0 shadow-paper markout must receive `execution.execution-plan`

`monitoring/agent0_paper_trade.py` builds paper-trade markouts from logged `execution.execution-plan` events plus market snapshots.

If no plan events exist in logs, the script cannot produce markout statistics. It will output:

- `plans_seen: 0`
- `plans_with_samples: 0`
- `total_samples: 0`

That is a hard data failure for performance validation, not a strategy failure.

Current local result:

- `monitoring/logs/agent0-paper-summary.json` currently shows zero plans.

### B. Parameter parity across runtime layers

The same risk/threshold variables are currently defined in multiple places with different defaults/overrides. Without parity, backtest/stress/guarded-live behavior is not apples-to-apples.

Example drift currently present:

1. `EV_MIN_THRESHOLD`
   - `risk-engine/src/config.ts` default: `100`
   - `docker-compose.mainnet.yml` default: `10`
   - `docker-compose.guarded-live.override.yml`: `25`
2. `SHARPE_LIKE_THRESHOLD`
   - code default: `0.5`
   - mainnet compose: `0.3`
   - guarded-live override: `0.75`
3. `MAX_TAIL_LOSS_PERCENT`
   - code default: `20`
   - mainnet compose: `30`
   - guarded-live override: `10`
4. `MIN_SPREAD_BPS`
   - scanner code default: `12`
   - mainnet compose default: `3`
   - guarded-live override: `15`
5. `MAX_BRIDGE_EXPOSURE_PERCENT`
   - portfolio code default: `30`
   - mainnet compose default: `25`
   - guarded-live override: `5`

## 2) Pass/Fail Matrix

| Gate | PASS definition | FAIL definition | Required capital |
|---|---|---|---|
| G1: Plan telemetry for Agent 0 markout | `execution.execution-plan` events appear in feedback logs and markout script reports `plans_seen > 0` with nonzero samples | `plans_seen = 0` or no `execution.execution-plan` events | `0 MON` (telemetry/data gate) |
| G2: Parameter parity | Single canonical live profile file is the source-of-truth and active runtime resolves to the same values in all services | Any threshold differs between code defaults, compose defaults, and active override | `0 MON` (config discipline gate) |
| G3: Execution truth closure | `execution-truth-core` reports `status = closed` | `status = staged` or `blocked` | Typically within minimum restart budget |
| G4: Cardia funded readiness | `cardia-activation-core` advances from `ready_for_funding` to `ready_for_guarded_live` with funding + controls recorded | Wallet not funded, multisig/cap approval missing, no first disbursement/routing | At least `10 MON` first policy funding, practical budget higher |
| G5: First guarded-live runtime evidence | Observed bounded live session + receipt truth validation + incident queue clear | Any of those three remains false | Capital needed for funded live session tx activity |
| G6: Public activation path | `public-activation-core` can advance after execution truth closure + Cardia readiness | Stays blocked by staged execution truth and/or unfunded Cardia lane | Depends on production infra runway |

## 3) Funding Requirements (Current Planning Surface)

From `docs/CAPITAL_GATED_FUNDING_PLAN.md`:

1. Absolute minimum honest restart budget: `165 MON`
2. Recommended guarded-live budget: `410-660 MON`
3. Cardia first-funding policy floor: `10 MON`
4. Recurring private-production runway:
   - lean: `$53-$58/mo`
   - recommended: `$62-$276/mo`

Use this practical mapping:

1. If budget < `165 MON`: expect high stall risk in live-gate closure.
2. `165 MON`: enough for minimum honest gate progression.
3. `410-660 MON`: preferred range for less-fragile guarded-live evidence generation.
4. Recurring infra budget is separate from first gate-clearing capital.

## 4) Operational Commands for Gate Checks

1. Execution truth status:
   - `npm --prefix execution-truth-core start`
2. Cardia activation status:
   - `npm --prefix cardia-activation-core start`
3. Public activation status:
   - `npm --prefix public-activation-core start`
4. Risk sanity regression:
   - `npm --prefix risk-engine test`
   - `npm --prefix risk-engine run stress:matrix:report`
5. Agent 0 paper markout:
   - `python .\monitoring\agent0_paper_trade.py --logs-dir .\monitoring\logs --horizons-sec 60,300,900,3600`

## 5) Current Snapshot (as of 2026-04-29 after sync patch)

1. G1 telemetry markout input: **FAIL** (`plans_seen = 0`)
2. G2 parameter parity: **PASS** (scanner/risk/portfolio defaults now match guarded-live profile and compose defaults)
3. G3 execution truth: **STAGED** (not closed)
4. G4 Cardia activation: **READY_FOR_FUNDING** (not yet funded/advanced)
5. G5 guarded-live evidence: **PENDING**
6. G6 public activation: **BLOCKED**

Primary bottlenecks now:

1. producing real `execution.execution-plan` telemetry for Agent 0 paper markout,
2. first funded observed guarded-live evidence,
3. recorded Cardia activation steps.

## 6) Agent 0 Milestone Notifications

Milestone alerting is now wired in `alert-rules` for successful execution-result counts.

Default milestones:

- `50`
- `100`
- recurring every `5000` trades starting at `5000` (e.g. `5000`, `10000`, `15000`, ...)

Environment variable:

- `AGENT0_TRADE_MILESTONES=50,100`
- `AGENT0_RECURRING_TRADE_MILESTONE_START=5000`
- `AGENT0_RECURRING_TRADE_MILESTONE_STEP=5000`

Important scope:

- this counter is stream-observed while `alert-rules` is running
- if you want lifetime accounting across service restarts, pair this with persisted log reconciliation
