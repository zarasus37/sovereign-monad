# Sovereign Repo Overview

Sovereign is a cross-chain arbitrage and market-monitoring repository. The repo currently contains:

- Base/Arbitrum dry-run deployment artifacts
- legacy Monad/Ethereum reference packages
- a standalone demo package
- API, billing, and license-service commercialization scaffolds

Canonical project status does not live in this repo. Use the separate `sovereign-monad` repo for current phase, blocker state, and what is or is not live: `https://github.com/zarasus37/sovereign-monad`.

## Source Of Truth

- Canonical status and active master phase: `https://github.com/zarasus37/sovereign-monad`
- Local mirrored MOF for workspace use: `docs/SOVEREIGN_MONAD_ECOSYSTEM_MASTER_OPERATING_FILE_v2.3.0.md`
- Local mirrored build map for workspace use: `docs/ECOSYSTEM_BUILD_MAP.md`
- Local mirrored sync discipline for workspace use: `docs/CANONICAL_SYNC_DISCIPLINE.md`
- Base/Arbitrum repo migration notes: `docs/MIGRATION-BASE-ARB.md`
- Service and topic flow artifacts: `ARCHITECTURE.md`
- Proposed funded operating envelope: `docs/GUARDED-LIVE-PROFILE.md`
- Base/Arbitrum deployment artifact entrypoint: `docker-compose.mainnet.yml`
- Commercialization guide: `risk-engine/MEV_LICENSING_BUILD_GUIDE.md`

Refresh all local canonical mirrors from the canonical repo with:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\sync-canonical-mirrors.ps1
```

Normal rule:

- refresh mirrors after completed phase/step truth changes
- batch routine mirror updates to once per day when practical

Verify the active runtime, slot, and speech packages with:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\verify-active-packages.ps1
```

Materialize the local slot bootstrap config after on-chain source registration with:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\init-slot-bootstrap-config.ps1
```

## Repo Runtime Artifacts

- Base side: `base-market-agent`
- Arbitrum side: `arbitrum-market-agent`
- Spread path: `spread-scanner -> opportunity-constructor -> risk-engine -> portfolio-manager`
- Execution artifact: `arb-bot` with `DRY_RUN=true`
- Observability: `model-feedback-logger`, `alert-rules`, `monitoring/dashboard.py`
- Risk-engine sanity tooling: deterministic stress matrix with report output at `risk-engine/artifacts/stress-matrix.json`

These are repo artifacts. They should not be read as proof that the broader program has advanced phases.

## Base/Arbitrum Pipeline Artifact

```text
Layer 1: Market Intelligence
base-market-agent        -> market.base.price-snapshot
arbitrum-market-agent    -> market.arbitrum.price-snapshot
spread-scanner           -> market.spread.signal
stress-monitor           -> market.stress-signal

Layer 2: Risk / Decision
opportunity-constructor  -> risk.opportunity-candidate
risk-engine              -> risk.opportunity-evaluation

Layer 3: Execution
portfolio-manager        -> execution.execution-plan
arb-bot                  -> execution.execution-result

Layer 4: Feedback / Observability
model-feedback-logger    -> JSONL event logs
monitoring/dashboard.py  -> Streamlit dashboard
```

## Quick Start

If you are exercising the Base/Arbitrum artifact path:

```bash
copy .env.example .env
docker compose -f docker-compose.mainnet.yml up -d --build
start http://localhost:8501
docker ps --format "table {{.Names}}\t{{.Status}}" | Select-String 'base-arb-mev-mainnet'
```

Typical repo-level validation thresholds:

- `DRY_RUN=true`
- `MIN_SPREAD_BPS=12`
- `MIN_LIQUIDITY_10BPS_USD=750`
- `MIN_CAPACITY_USD=3000`
- `MIN_SIZE_USD=250`
- `RISK_FIXED_COST_BPS=8`
- `RISK_MIN_EFFECTIVE_SPREAD_BPS=12`
- `MAX_SINGLE_TRADE_PERCENT=10`
- `MAX_SLIPPAGE_BPS=50`

Current repo-local package signal:

- `risk-engine`: `28` passing tests, including deterministic stress-matrix regression coverage

If this route is resumed toward funded use, the guarded-live profile should be activated only after wallet funding, preflight checks, and explicit operator review.

## Commercial Surfaces In Repo

- Buyer demo: `demo-package/`
- Starter/Pro API: `templates/api/`
- Billing scaffold: `templates/billing/`
- License-service scaffold: `templates/license-service/`
- Combined commercial stack: `templates/commercial-stack/`
- Slot lifecycle monitor: `slot-core/`
- Slot lifecycle API: `slot-api/`
- Slot operator UI: `slot-frontend/`
- Organ coordination runtime: `organ-runtime/`
- Shared ecosystem state API: `ecosystem-state-api/`
- Internal ecosystem dashboard: `ecosystem-dashboard/`
- Platform builder infrastructure: `platform-builder/`
- Controlled expansion framework: `expansion-control/`
- Keys scaffold and delegation policy: `keys-core/`
- Data Rail preparation scaffold: `data-rail-core/`
- Data Rail routing scaffold: `data-rail-router/`
- Data Rail internal reward ledger scaffold: `reward-ledger-core/`
- Data Rail governance scaffold: `data-rail-governance/`
- Emergence observation scaffold: `emergence-observer-core/`
- Internal reward ledger surface: `reward-ledger-core/`
- Speech I/O gateway: `speech-gateway/`

These auxiliary artifacts exist in the repo. Their presence does not override canonical status in the MOF.

## Funnel Direction

The beginning-of-project funnel should not depend on MonadSpin alone.

Current intended opening posture:

- bootstrap approved-source inflow
- API and licensing revenue
- agent-native revenue from ecosystem-native agents
- MonadSpin slot revenue later as an additional rail

The first ecosystem-native agent set is specified as a six-function organ cluster:

- `Cardia` for capital circulation
- `Pneuma` for external exchange
- `Hepar` for opportunity filtering
- `Cortex` for research synthesis
- `Synapse` for signal routing
- `Vox` for narrative expression

See:

- `docs/FUNNEL_DIVERSIFICATION_PLAN.md`
- `docs/AGENT_NATIVE_REVENUE_RAIL.md`
- `docs/FIRST_ORGAN_SET.md`
- `docs/BUILD_EXECUTION_FLOW.md`

## Immediate Post-Deploy Operator Path

Once the live Phase 1a deployment succeeds in `sovereign-monad`, use:

- `docs/POST_PHASE1A_NEXT_STEPS.md`

That document covers:

- post-deploy verification
- bootstrap source registration
- local slot config materialization
- slot stack bring-up
- active package verification

## Legacy Reference Material

- `docker-compose.yml`, `docker-compose.testnet.yml`, and `docker-compose.prod.yml`
- `monad-market-agent`, `eth-market-agent`
- `monad-arb-bot`, `eth-arb-bot`, `bridge-exec-bot`

Do not use those paths as the source of truth for canonical project status.
