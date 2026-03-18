# monad-market-agent

Monad price feed agent for the cross-chain MEV arbitrage system.

Subscribes to Monad blocks via WebSocket, polls KuruExchange contracts for price/liquidity data, computes realized volatility, and publishes `MonadPriceSnapshot` events to Kafka.

## Prerequisites

- Node.js 22+
- Kafka broker (local or remote)
- Monad mainnet RPC WebSocket URL
- KuruExchange contract addresses on Monad

## Setup

1. **Install dependencies**

```bash
cd monad-market-agent
npm install
```

2. **Configure environment**

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

| Variable | Description |
|----------|-------------|
| `MONAD_WS_URL` | WebSocket URL for Monad RPC (e.g., `wss://monad-mainnet.quiknode.pro/<key>/`) |
| `KURU_ETH_USDC_ADDR` | Kuru ETH/USDC contract address on Monad |
| `KURU_MON_USDC_ADDR` | Kuru MON/USDC contract address on Monad |
| `KAFKA_BROKERS` | Kafka broker addresses (comma-separated) |

Optional variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `KAFKA_TOPIC` | `market.monad.price-snapshot` | Kafka topic for price snapshots |
| `KAFKA_CLIENT_ID` | `monad-market-agent` | Kafka client ID |
| `LOG_LEVEL` | `info` | Log level (debug, info, warn, error) |

## Running

### Development (ts-node)

```bash
npm run dev
```

### Production

```bash
npm run build
npm start
```

## Output

The agent publishes `MonadPriceSnapshot` events to the configured Kafka topic with this structure:

```json
{
  "meta": {
    "eventId": "uuid-v4",
    "eventType": "MonadPriceSnapshot",
    "version": 1,
    "timestampMs": 1234567890,
    "source": "monad-market-agent"
  },
  "chainId": "MONAD",
  "marketId": "kuru:ETH/USDC:spot",
  "baseAsset": "ETH",
  "quoteAsset": "USDC",
  "priceMid": 2500.50,
  "bestBid": 2500.25,
  "bestAsk": 2500.75,
  "baseReserve": "1000000000000000000",
  "quoteReserve": "2500500000000",
  "liquidity10bps": "500000.00",
  "liquidity50bps": "2000000.00",
  "realizedVol1m": 0.45,
  "realizedVol5m": 0.38,
  "realizedVol1h": 0.32,
  "blockNumber": 12345
}
```

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  Monad RPC      │────▶│ monad-market │────▶│   Kafka     │
│  (WebSocket)    │     │   -agent     │     │  Producer   │
└─────────────────┘     └──────────────┘     └─────────────┘
        │                      │
        │                      ▼
        │              ┌──────────────┐
        │              │   Kuru       │
        └─────────────▶│  Contracts  │
                       └──────────────┘
```

## Graceful Shutdown

The agent handles `SIGINT` and `SIGTERM` signals gracefully:
- Removes block listener
- Disconnects Kafka producer
- Disconnects RPC WebSocket

## Troubleshooting

### Kafka connection errors

- Ensure Kafka broker is running
- Check `KAFKA_BROKERS` format (comma-separated, no spaces)
- Verify network connectivity

### RPC connection errors

- Verify `MONAD_WS_URL` is correct and includes trailing slash
- Check that your RPC provider key is valid
- Ensure WebSocket connectivity

### Missing price data

- Verify Kuru contract addresses are correct
- Check that contracts are deployed on the target network
- Review logs for specific contract call errors
