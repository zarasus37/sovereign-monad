# SMMEVAE - Sovereign Base-Arbitrum MEV Arb Engine
## System Status & Operations Reference

> Last Updated: Managed by `scripts/refresh-status.ps1`
> Source of Truth: [docs/MIGRATION-BASE-ARB.md](c:/Users/crisc/Dev/agents/monad-mev/docs/MIGRATION-BASE-ARB.md) for migration status, this file for operating notes
> Environment: Base Mainnet + Arbitrum Mainnet
> Operating Mode: DRY_RUN, liquidity-gated

---

## Current State

The active migration target is the Base/Arbitrum topology reflected in `docker-compose.mainnet.yml`.

- Base side: `base-market-agent` using Aerodrome-oriented pricing
- Arbitrum side: `arbitrum-market-agent` using Camelot-oriented pricing
- Dashboard: `http://localhost:8501`
- Execution: `arb-bot` in `DRY_RUN=true`
- Alerts: `alert-rules` active with webhook delivery validated
- Current gating mode: spread, liquidity, and capacity thresholds enforced in the downstream pipeline

The Base/Arbitrum DRY_RUN path has now been revalidated end to end. The active profile uses production-like validation thresholds while the stack remains safely in `DRY_RUN=true`. The remaining project work is live-capital readiness, not migration plumbing.

---

## Auto-Refreshed Ops Snapshot

<!-- AUTO-STATUS:START -->
Generated: 2026-03-20 15:56:57 UTC

### Live Containers

| Container | Status |
|---|---|
| `base-arb-mev-mainnet-alert-rules` | Up 4 hours |
| `base-arb-mev-mainnet-arb-bot` | Up 2 hours |
| `base-arb-mev-mainnet-arbitrum-agent` | Up 2 hours |
| `base-arb-mev-mainnet-base-agent` | Up 2 hours |
| `base-arb-mev-mainnet-dashboard` | Up 4 hours |
| `base-arb-mev-mainnet-feedback` | Up 4 hours |
| `base-arb-mev-mainnet-kafka` | Up 4 hours |
| `base-arb-mev-mainnet-opp-constructor` | Up 4 hours |
| `base-arb-mev-mainnet-portfolio` | Up 2 hours |
| `base-arb-mev-mainnet-risk-engine` | Up 4 hours |
| `base-arb-mev-mainnet-spread-scanner` | Up 2 hours |
| `base-arb-mev-mainnet-stress` | Up 4 hours |
| `base-arb-mev-mainnet-zookeeper` | Up 4 hours (healthy) |

### Active Runtime Gates

```env
MIN_SPREAD_BPS=3
MIN_LIQUIDITY_10BPS_USD=750
MIN_CAPACITY_USD=3000
MIN_SIZE_USD=250
RISK_FIXED_COST_BPS=8
RISK_MIN_EFFECTIVE_SPREAD_BPS=12
DRY_RUN=false
MAX_SINGLE_TRADE_PERCENT=10
MAX_BRIDGE_EXPOSURE_PERCENT=25
MAX_SLIPPAGE_BPS=50
```
<!-- AUTO-STATUS:END -->

---

## Real Market Wiring

### Base mainnet endpoints

- HTTP RPC: `https://mainnet.base.org`
- WebSocket: `wss://base-rpc.publicnode.com`

### Arbitrum mainnet endpoints

- HTTP RPC: `https://arb1.arbitrum.io/rpc`
- WebSocket: `wss://arbitrum-one-rpc.publicnode.com`

### Active market venues

- Base: Aerodrome ETH/USDC flow via `base-market-agent`
- Arbitrum: Camelot ETH/USDC flow via `arbitrum-market-agent`

### Runtime topic model

- `market.base.price-snapshot`
- `market.arbitrum.price-snapshot`
- `market.spread.signal`
- `risk.opportunity-candidate`
- `risk.opportunity-evaluation`
- `execution.execution-plan`
- `execution.execution-result`

---

## Current Risk / Scanner Gates

```env
MIN_SPREAD_BPS=12
MIN_LIQUIDITY_10BPS_USD=750
MIN_CAPACITY_USD=3000
MIN_SIZE_USD=250
RISK_FIXED_COST_BPS=8
RISK_MIN_EFFECTIVE_SPREAD_BPS=12
DRY_RUN=true
MAX_SINGLE_TRADE_PERCENT=10
MAX_BRIDGE_EXPOSURE_PERCENT=25
MAX_SLIPPAGE_BPS=50
```

Effect:

- Thin-book noise is filtered much more aggressively than in the migration-proofing pass.
- Small or fragile opportunities are suppressed before they reach downstream sizing and approval.
- The stack remains DRY_RUN-safe while producing a more realistic validation signal for production readiness.

---

## Recent Fixes Applied

### Base/Arbitrum wiring

- Reworked `docker-compose.mainnet.yml` around `base-market-agent`, `arbitrum-market-agent`, and `arb-bot`.
- Updated topic wiring so the spread scanner consumes `INPUT_TOPIC_CHAIN_A` and `INPUT_TOPIC_CHAIN_B`.
- Replaced dead placeholder WebSocket endpoints with working Base and Arbitrum public endpoints.

### Safer Docker/runtime behavior

- Removed local-only pretty logging dependencies from runtime paths that broke in containers.
- Aligned container names under the `base-arb-mev-mainnet-*` pattern.

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

- Base/Arbitrum service scaffolds are present and wired into compose.
- The dashboard naming and monitoring path reflect the Base/Arbitrum stack.
- The DRY_RUN pipeline contract is defined end to end through `execution.execution-result`.
- The migration guide now matches the active repo topology.
- Live rerun proof now exists for market snapshots, spread signals, opportunity candidates, evaluations, execution plans, and execution results.

---

## What Still Prevents Real Trading Ready

### ISSUE-001: Thresholds are validation-grade, not live-capital approved

- Severity: HIGH
- Current symptom: the stack now runs with a production-like DRY_RUN profile, but these values are still operator-selected validation thresholds rather than empirically calibrated live limits.
- Current impact: the stack is suitable for stricter DRY_RUN observation, but not yet cleared for real-capital deployment.
- Real fix needed: calibrate the profile against observed opportunity flow, fill assumptions, and venue-specific execution costs before enabling live trading. A concrete starting envelope now exists in `docs/GUARDED-LIVE-PROFILE.md`, but it has not been activated.

### ISSUE-002: Execution remains DRY_RUN only

- Severity: MEDIUM
- Current symptom: `arb-bot` still simulates execution results.
- Current impact: No real swaps or bridge operations are sent.
- Real fix needed: Real venue-specific execution logic with slippage protection, confirmations, and failure handling.

### ISSUE-003: Documentation drift still exists outside the runbook

- Severity: LOW
- Current symptom: remaining stale documentation is concentrated in retained legacy service folders and historical build artifacts rather than in the active top-level docs.
- Current impact: the active project state is clear from current-facing docs, but legacy reference paths may still contain outdated narrative text.
- Real fix needed: continue limiting stale narrative to explicitly historical folders only.

### ISSUE-004: Dashboard metrics are operational, not investor-grade analytics

- Severity: LOW
- Current symptom: The dashboard shows live counts and PnL, but it does not compute advanced analytics like precision, Kelly calibration, or realized fill quality.
- Real fix needed: Add trading-quality performance metrics once real executions and fills exist.

---

## Update Workflow

When system behavior changes:

1. Update code or configuration.
2. Rebuild or restart the affected services.
3. Run `powershell -ExecutionPolicy Bypass -File .\scripts\refresh-status.ps1`.
4. Update the manual sections above only if the architecture, market wiring, runtime gates, or open issues changed.

This keeps the live operational snapshot fresh while minimizing documentation drift.



















