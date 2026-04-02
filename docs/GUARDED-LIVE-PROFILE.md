# Guarded-Live Profile

## Purpose

This document defines a recommended first funded operating profile for the Base/Arbitrum artifact path in this repo.

It is intentionally separate from the current `DRY_RUN` validation profile. It does not, by itself, advance canonical project status.

For canonical status, use the separate `sovereign-monad` repo: `https://github.com/zarasus37/sovereign-monad`.
For activation and rollback commands, use `docs/GUARDED-LIVE-ACTIVATION.md`.

## Recommended First Funded Profile

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
SUPPORTED_EXECUTION_MODES=inventory_based
ENABLE_LIVE_EXECUTION=true
ENABLE_SWAP_SUBMISSION=false
ENABLE_AUTO_APPROVE=false
MAX_PLAN_AGE_MS=15000
EXPECTED_CHAIN_A_ID=8453
EXPECTED_CHAIN_B_ID=42161
MIN_GAS_BALANCE_ETH=0.01
AERODROME_FACTORY_ADDR=0x420DD381b31aEf6683db6B902084cB0FFECe40Da
CAMELOT_REFERRER_ADDR=0x0000000000000000000000000000000000000000

MIN_ALERT_SPREAD_BPS=50
ALERT_COOLDOWN_MS=30000
```

## Notes

1. This profile may produce very few or zero trades under thin route quality.
2. That is acceptable for a first funded session.
3. Do not loosen liquidity or capacity gates merely to force fills.
4. `bridge_based` execution remains intentionally disabled in the active runtime until the dedicated bridge path is fully integrated.
5. For Aerodrome/Camelot execution, venue `ETH` inventory is held and checked as onchain `WETH`. Native ETH is only used for gas balance.
6. Leave `ENABLE_SWAP_SUBMISSION=false` until router addresses, allowances, and funded inventory are verified on the target wallets.
7. The runtime now reconciles receipt logs into realized USDC PnL, but it still does not auto-hedge one-leg failure. Treat partial execution as an operator incident.
