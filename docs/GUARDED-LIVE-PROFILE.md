# Guarded-Live Profile

## Purpose

This document defines the recommended first funded operating profile for the active Base/Arbitrum stack.

It is intentionally separate from the current DRY_RUN validation profile. The goal is controlled live activation, not early PnL maximization.

For the exact activation and rollback commands, use `docs/GUARDED-LIVE-ACTIVATION.md`.

## Current Constraint

Observed route quality is still thin on the active Arbitrum side. That means the first funded profile should tighten execution and portfolio risk materially, while avoiding any temptation to loosen upstream market-quality gates just to force trades.

## Recommended First Funded Profile

Use these values as the first live envelope once wallet funding and operator readiness are in place:

```env
DRY_RUN=false

MIN_SPREAD_BPS=15
MIN_LIQUIDITY_10BPS_USD=750
MIN_CAPACITY_USD=3000
MIN_SIZE_USD=250

EV_MIN_THRESHOLD=25
SHARPE_LIKE_THRESHOLD=0.75
MAX_TAIL_LOSS_PERCENT=10
RISK_FIXED_COST_BPS=10
RISK_MIN_EFFECTIVE_SPREAD_BPS=15

MAX_SINGLE_TRADE_PERCENT=10
MAX_BRIDGE_EXPOSURE_PERCENT=5
MAX_SLIPPAGE_BPS=20

MIN_ALERT_SPREAD_BPS=50
ALERT_COOLDOWN_MS=30000
```

## Why These Values

### Upstream market gates

1. `MIN_SPREAD_BPS=15` raises the edge requirement above the current DRY_RUN profile without pretending the route supports aggressive volume.
2. `MIN_LIQUIDITY_10BPS_USD=750` and `MIN_CAPACITY_USD=3000` stay unchanged because lowering them would accept visibly fragile depth, while raising them further would likely suppress the route entirely under current conditions.
3. `MIN_SIZE_USD=250` stays unchanged so very small synthetic opportunities still do not enter the approval path.

### Risk-engine gates

1. `EV_MIN_THRESHOLD=25` requires meaningfully positive EV before any plan reaches execution.
2. `SHARPE_LIKE_THRESHOLD=0.75` is materially stricter than the current DRY_RUN threshold of `0.3`.
3. `MAX_TAIL_LOSS_PERCENT=10` cuts allowed downside sharply from the current validation setting.
4. `RISK_FIXED_COST_BPS=10` and `RISK_MIN_EFFECTIVE_SPREAD_BPS=15` assume live friction will be worse than the DRY_RUN approximation.

### Portfolio and execution gates

1. `MAX_SINGLE_TRADE_PERCENT=10` caps first-live sizing at 10 percent of configured portfolio value, which is still conservative enough for a first funded session while remaining economically useful.
2. `MAX_BRIDGE_EXPOSURE_PERCENT=5` keeps bridge-based exposure tightly capped.
3. `MAX_SLIPPAGE_BPS=20` is a live-execution ceiling, not a comfort target.

## Expected Operational Outcome

Under the current observed market regime, this profile may produce very few or zero real trades.

That is acceptable. A first funded profile should prefer no trade over marginal trade quality.

## Activation Rules

Do not activate this profile unless all of the following are true:

1. Base and Arbitrum wallet balances are funded and verified.
2. `scripts/pipeline-health.ps1` is clean.
3. `scripts/topic-flow-summary.ps1` shows healthy upstream topic flow.
4. `scripts/webhook-smoke-test.ps1` succeeds for configured alert destinations.
5. An operator is watching the first funded session.

Use `docker-compose.guarded-live.override.yml` together with `docker-compose.mainnet.yml` rather than editing the base compose file directly.

## First Session Stop Conditions

Immediately revert to `DRY_RUN=true` if any of the following occur:

1. two consecutive execution failures,
2. stale market snapshots or broken topic flow,
3. alert delivery failure during the funded session,
4. realized slippage above the configured ceiling,
5. any sign that live execution behavior differs materially from simulated approval behavior.

## Notes

1. This profile is a starting envelope, not empirical proof of profitability.
2. Do not loosen liquidity or capacity gates merely to force early fills.
3. Review the actual effective runtime config after activation rather than assuming the template alone is authoritative.