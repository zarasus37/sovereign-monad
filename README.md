# Monad Cross-Chain MEV System

Sovereign cross-chain arbitrage and market-monitoring engine targeting Monad mainnet and Ethereum mainnet.

## Current State

The system is running on real Monad mainnet and Ethereum mainnet market data.

- Monad side: live Kuru orderbooks on Monad mainnet
- Ethereum side: live Uniswap V3 ETH/USDC pricing
- Execution: DRY_RUN only
- Dashboard: live at `http://localhost:8501`
- Current gating mode: realistic, liquidity-aware suppression

The stack is operational, but the current Monad ETH source is too thin for controlled tradable opportunities. That means the pipeline now correctly stays quiet unless meaningful executable liquidity appears.

## Architecture

```
Layer 1: Market Intelligence
├── monad-market-agent       → market.monad.price-snapshot
├── eth-market-agent         → market.eth.price-snapshot
├── spread-scanner           → market.spread.signal
└── stress-monitor           → market.stress-signal

Layer 2: Risk / Decision
├── opportunity-constructor  → risk.opportunity-candidate
└── risk-engine              → risk.opportunity-evaluation

Layer 3: Execution
├── portfolio-manager        → execution.execution-plan
├── monad-arb-bot            → execution.execution-result
├── eth-arb-bot              → execution.eth-result
└── bridge-exec-bot          → execution.bridge-result

Layer 4: Feedback / Observability
├── model-feedback-logger    → JSONL event logs
└── monitoring/dashboard.py  → Streamlit dashboard
```

## Mainnet Services

| Service | Purpose | Current Status |
|---|---|---|
| `monad-market-agent` | Monad mainnet Kuru pricing | Running |
| `eth-market-agent` | Ethereum mainnet Uniswap pricing | Running |
| `spread-scanner` | Cross-chain spread detection | Running, deduplicated |
| `opportunity-constructor` | Tradable opportunity construction | Running, rejects zero capacity |
| `risk-engine` | EV / risk evaluation | Running |
| `portfolio-manager` | Position sizing and exposure controls | Running |
| `monad-arb-bot` | Monad execution path | Running, DRY_RUN |
| `model-feedback-logger` | Event logging | Running |
| `stress-monitor` | Side-channel chain monitoring | Running |
| `dashboard` | Streamlit UI | Running |

## Mainnet Quick Start

```bash
# 1. Copy the environment template
copy .env.example .env

# 2. Fill in the required RPC URLs, wallet key, and market addresses

# 3. Launch the mainnet DRY_RUN stack
docker compose -f docker-compose.mainnet.yml up -d --build

# 4. Open the dashboard
start http://localhost:8501

# 5. Check service health
docker ps --format "table {{.Names}}\t{{.Status}}" | Select-String 'monad-mev-mainnet'
```

## Active Mainnet Configuration

These are the key current operating assumptions:

- `DRY_RUN=true`
- `MIN_SPREAD_BPS=15`
- `MIN_LIQUIDITY_10BPS_USD=5000`
- `MIN_CAPACITY_USD=10000`
- `MAX_SINGLE_TRADE_PERCENT=0.1`
- `MAX_BRIDGE_EXPOSURE_PERCENT=25`

## Mainnet Market Wiring

- Monad RPC: `https://rpc.monad.xyz`
- Monad WS: `wss://wss.monad-rpc.huginn.tech`
- Kuru router: `0xb3e6778480b2E488385E8205eA05E20060B813cb`
- Kuru `WETH/AUSD`: `0xcd8cc5f5b6f744403ad96a8802e050bba1aba37e`
- Kuru `MON/USDC`: `0x065C9d28E428A0db40191a54d33d5b7c71a9C394`
- Uniswap V3 ETH/USDC 0.05%: `0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640`

## Important Behavioral Notes

Recent hardening changes:

- The spread scanner suppresses duplicate identical ETH signals.
- Zero-capacity spreads no longer turn into trade candidates.
- Risk sizing is capped by the constructor’s suggested executable size.
- Portfolio expected EV is scaled to the approved execution size.
- DRY_RUN realized PnL uses the sized expected EV directly.

## Why Opportunities May Be Quiet

This is expected in the current realistic mode.

The normalized Monad ETH market currently has little or no executable `liquidity10bps`, so the scanner and constructor correctly suppress downstream opportunity flow. The stack is functioning as intended; the market is simply too thin right now for controlled DRY_RUN trading under nonzero thresholds.

## Validation Commands

```bash
# Monad snapshots
docker exec monad-mev-mainnet-kafka sh -lc "kafka-console-consumer --bootstrap-server localhost:9092 --topic market.monad.price-snapshot --timeout-ms 8000 --max-messages 4"

# Spread signals
docker exec monad-mev-mainnet-kafka sh -lc "kafka-console-consumer --bootstrap-server localhost:9092 --topic market.spread.signal --timeout-ms 8000 --max-messages 5"

# Dashboard data flow
docker logs monad-mev-mainnet-feedback --tail 20

# Refresh the live ops snapshot in STATUS.md
powershell -ExecutionPolicy Bypass -File .\scripts\refresh-status.ps1
```

## Maintenance Workflow

- VS Code task: `Terminal: Run Task` -> `Refresh STATUS.md`
- VS Code task: `Terminal: Run Task` -> `Refresh STATUS.md + Git Status`
- Git commits: `.githooks/pre-commit` refreshes and stages `STATUS.md` automatically before each commit

## Legacy Modes

Legacy compose files for testnet and production staging remain in the repo, but the current validated operating path is `docker-compose.mainnet.yml`.
