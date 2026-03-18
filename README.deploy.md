# Monad MEV Deployment Guide

## Recommended Deployment Mode

The recommended active mode is now:

- Monad mainnet
- Ethereum mainnet
- `DRY_RUN=true`
- controlled liquidity gates enabled

Use `docker-compose.mainnet.yml` as the primary deployment entrypoint.

## Mainnet DRY_RUN Deployment

```bash
# 1. Navigate to the repo
cd monad-mev

# 2. Copy the environment template
copy .env.example .env

# 3. Fill in .env with real RPC URLs, wallet key, and market addresses

# 4. Start the mainnet stack
docker compose -f docker-compose.mainnet.yml up -d --build

# 5. Open the dashboard
start http://localhost:8501
```

## Current Safe Operating Profile

```env
DRY_RUN=true
MIN_SPREAD_BPS=15
MIN_LIQUIDITY_10BPS_USD=5000
MIN_CAPACITY_USD=10000
MAX_SINGLE_TRADE_PERCENT=0.1
MAX_BRIDGE_EXPOSURE_PERCENT=25
```

This mode is intended to stay close to real tradability. If Monad ETH-side liquidity is too thin, the scanner and constructor will correctly suppress opportunities.

## Verify Operations

```bash
# Mainnet containers
docker ps --format "table {{.Names}}\t{{.Status}}" | Select-String 'monad-mev-mainnet'

# Kafka topics
docker exec monad-mev-mainnet-kafka kafka-topics --list --bootstrap-server localhost:29092

# Monad snapshots
docker exec monad-mev-mainnet-kafka sh -lc "kafka-console-consumer --bootstrap-server localhost:9092 --topic market.monad.price-snapshot --timeout-ms 8000 --max-messages 4"

# Spread topic
docker exec monad-mev-mainnet-kafka sh -lc "kafka-console-consumer --bootstrap-server localhost:9092 --topic market.spread.signal --timeout-ms 8000 --max-messages 5"
```

## Current Mainnet Endpoints

- Monad HTTP RPC: `https://rpc.monad.xyz`
- Monad WebSocket: `wss://wss.monad-rpc.huginn.tech`
- Ethereum HTTP/WS: mainnet Alchemy endpoints from `.env`

## Current Mainnet Markets

- Kuru router: `0xb3e6778480b2E488385E8205eA05E20060B813cb`
- Kuru `WETH/AUSD`: `0xcd8cc5f5b6f744403ad96a8802e050bba1aba37e`
- Kuru `MON/USDC`: `0x065C9d28E428A0db40191a54d33d5b7c71a9C394`
- Uniswap V3 ETH/USDC 0.05%: `0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640`

## Known Current Limitation

The system is healthy, but the current Monad ETH route is too thin for controlled executable opportunities. That means:

- spreads may still be observed at the raw market-data layer
- `market.spread.signal` may stay empty under controlled gates
- this is correct behavior, not a pipeline failure

## Dashboard

`http://localhost:8501`

The dashboard now uses live feedback logs and shows real summary cards instead of placeholders.

## Troubleshooting

### No spread signals under controlled mode

```bash
docker exec monad-mev-mainnet-kafka sh -lc "kafka-console-consumer --bootstrap-server localhost:9092 --topic market.monad.price-snapshot --timeout-ms 8000 --max-messages 4"
```

If Monad ETH `liquidity10bps` is near zero, no opportunities should flow downstream.

### Service-specific logs

```bash
docker logs monad-mev-mainnet-monad-agent --tail 30
docker logs monad-mev-mainnet-spread-scanner --tail 30
docker logs monad-mev-mainnet-opp-constructor --tail 30
docker logs monad-mev-mainnet-risk-engine --tail 30
docker logs monad-mev-mainnet-arb-bot --tail 30
```

## Legacy Modes

Testnet and production-staging compose files remain in the repo, but they are not the primary validated deployment path anymore.
