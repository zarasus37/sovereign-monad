# SMMEVAE - Sovereign Monad MEV Arb Engine
## System Status & Operations Reference

> Last Updated: Managed by `scripts/refresh-status.ps1`
> Source of Truth: This file
> Environment: Monad Mainnet (Chain ID 143) + Ethereum Mainnet
> Operating Mode: DRY_RUN, liquidity-gated

---

## Current State

The system is running on real Monad mainnet and real Ethereum mainnet market data.

- Monad side: live Kuru orderbooks on Monad mainnet
- Ethereum side: live Uniswap V3 ETH/USDC pricing
- Dashboard: live at `http://localhost:8501`
- Execution: DRY_RUN only
- Current gating mode: realistic, liquidity-aware suppression

The key current limitation is executable depth on the active Monad ETH route. The stack is healthy, but controlled signals are intentionally suppressed unless live liquidity is sufficient.

---

## Auto-Refreshed Ops Snapshot

<!-- AUTO-STATUS:START -->
Generated: 2026-03-18 02:23:02 UTC

### Live Containers

| Container | Status |
|---|---|
| `monad-mev-mainnet-arb-bot` | Up 9 hours |
| `monad-mev-mainnet-dashboard` | Up 9 hours |
| `monad-mev-mainnet-feedback` | Up 9 hours |
| `monad-mev-mainnet-kafka` | Up 10 hours |
| `monad-mev-mainnet-kafka-ui` | Up 10 hours |
| `monad-mev-mainnet-opp-constructor` | Up 9 hours |
| `monad-mev-mainnet-portfolio` | Up 9 hours |
| `monad-mev-mainnet-risk-engine` | Up 9 hours |
| `monad-mev-mainnet-spread-scanner` | Up 3 hours |
| `monad-mev-mainnet-stress` | Up 10 hours |
| `monad-mev-mainnet-zookeeper` | Up 10 hours (healthy) |

### Active Runtime Gates

```env
MIN_SPREAD_BPS=15
MIN_LIQUIDITY_10BPS_USD=5000
MIN_CAPACITY_USD=10000
DRY_RUN=true
MAX_SINGLE_TRADE_PERCENT=0.1
MAX_BRIDGE_EXPOSURE_PERCENT=25
```
<!-- AUTO-STATUS:END -->

---

## Real Market Wiring

### Monad mainnet endpoints

- HTTP RPC: `https://rpc.monad.xyz`
- WebSocket: `wss://wss.monad-rpc.huginn.tech`

### Live Kuru market addresses in use

- Router: `0xb3e6778480b2E488385E8205eA05E20060B813cb`
- `WETH/AUSD`: `0xcd8cc5f5b6f744403ad96a8802e050bba1aba37e`
- `MON/USDC`: `0x065C9d28E428A0db40191a54d33d5b7c71a9C394`

### Routing model

- Direct `WETH/MON` was not reliable enough for current mainnet use.
- Monad ETH is currently normalized from live `WETH/AUSD` into `kuru:ETH/USDC:spot` for downstream compatibility.
- Downstream components key on the base asset, so this keeps the architecture intact while the quote venue differs.

---

## Current Risk / Scanner Gates

```env
MIN_SPREAD_BPS=15
MIN_LIQUIDITY_10BPS_USD=5000
MIN_CAPACITY_USD=10000
DRY_RUN=true
MAX_SINGLE_TRADE_PERCENT=0.1
MAX_BRIDGE_EXPOSURE_PERCENT=25
```

Effect:

- Thin-book raw spread noise is suppressed.
- Zero-capacity spreads no longer become opportunities.
- The pipeline only advances when live executable liquidity is present.

---

## Recent Fixes Applied

### Mainnet Kuru integration

- Replaced the obsolete Kuru ABI with the live orderbook interface.
- Added `getL2Book()` decoding and market-param validation.
- Added deployed-bytecode checks.
- Corrected `bestBidAsk()` price normalization for current mainnet behavior.

### Mainnet deployment wiring

- Switched the stack from Monad testnet to Monad mainnet.
- Replaced exhausted QuickNode usage with stable public Monad mainnet endpoints.
- Updated `docker-compose.mainnet.yml` to pass the actual live market env vars.

### Safer DRY_RUN routing

- Added the `WETH/AUSD` fallback path for Monad ETH snapshots.
- Normalized one-sided books so the market agent can still publish a stable DRY_RUN ETH price.

### Duplicate signal suppression

- `spread-scanner` fingerprints emitted signals and suppresses repeats when the economic signal has not changed.

### Realism pass

- Opportunity constructor rejects zero-capacity spreads.
- Risk engine size is capped by the constructor's actual `sizeSuggestion`.
- Portfolio manager scales expected EV to the approved trade size.
- DRY_RUN execution uses sized expected EV directly instead of the old inflated formula.

### Dashboard patch

- Streamlit dashboard now loads flattened live feedback JSON instead of showing placeholder summary cards.
- Top-line metrics and charts are driven by actual logged events.

---

## What Is Finished

- Mainnet containers build and run cleanly.
- Real Monad and Ethereum price feeds are flowing.
- Dashboard is usable at `http://localhost:8501`.
- The DRY_RUN pipeline has been proven end to end.
- The pipeline has been re-tightened so current output is closer to real tradability.

---

## What Still Prevents Real Trading Ready

### ISSUE-001: Current Monad ETH venue is too thin

- Severity: HIGH
- Current symptom: Monad ETH snapshots show near-zero or zero `liquidity10bps`.
- Current impact: Controlled scanner gates suppress spreads, and downstream opportunity flow stays quiet.
- Current behavior: This is intentional and correct.
- Real fix needed: A deeper live Monad ETH venue or a better direct ETH market on Kuru mainnet.

### ISSUE-002: Execution remains DRY_RUN only

- Severity: MEDIUM
- Current symptom: `monad-arb-bot` still simulates execution results.
- Current impact: No real swaps or bridge operations are sent.
- Real fix needed: Real venue-specific execution logic with slippage protection, confirmations, and failure handling.

### ISSUE-003: Dashboard metrics are operational, not investor-grade analytics

- Severity: LOW
- Current symptom: The dashboard shows live counts and PnL, but it does not compute advanced analytics like precision, Kelly calibration, or realized fill quality.
- Real fix needed: Add trading-quality performance metrics once real executions and fills exist.

---

## Update Workflow

When system behavior changes:

1. Update code or configuration.
2. Rebuild or restart the affected services.
3. Run `powershell -ExecutionPolicy Bypass -File .\scripts\refresh-status.ps1`.
4. Update the manual sections above only if the architecture, market wiring, or open issues changed.

This keeps the live operational snapshot fresh while minimizing documentation drift.


