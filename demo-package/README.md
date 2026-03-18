# Sovereign MEV Demo Package

> ⚠️ **DISCLAIMER:** This is a demonstration package for evaluation purposes only. It contains no live execution logic, no real trading strategies, and no proprietary algorithms.

This demo showcases the **event-driven service architecture** and **Kafka pipeline pattern** without exposing any alpha-generating logic.

---

## What This Demo Shows

✅ Event-driven microservices architecture  
✅ Kafka topic pipeline for market data → signals → execution  
✅ Docker Compose deployment pattern  
✅ Health monitoring and observability  
✅ Configuration management pattern  
✅ Alerting framework  

❌ No real trading strategies  
❌ No execution logic  
❌ No route optimization  
❌ No fill-quality heuristics  

---

## Quick Start

```bash
# 1. Copy environment template
cp .env.example .env

# 2. Start infrastructure and demo services
docker compose -f docker-compose.demo.yml up -d

# 3. View logs
docker compose -f docker-compose.demo.yml logs -f demo-scanner

# 4. Stop
docker compose -f docker-compose.demo.yml down
```

---

## Architecture (Demo)

```
┌─────────────────────┐     ┌─────────────────────┐
│  Demo Market A      │     │  Demo Market B      │
│  (Mock Prices)      │     │  (Mock Prices)      │
└──────────┬──────────┘     └──────────┬──────────┘
           │                           │
           └───────────┬───────────────┘
                       ▼
           ┌─────────────────────┐
           │  market.*.snapshot  │
           │  (Kafka Topics)     │
           └──────────┬──────────┘
                      ▼
           ┌─────────────────────┐
           │   Demo Scanner      │
           │  (Spread Calc)     │
           └──────────┬──────────┘
                      ▼
           ┌─────────────────────┐
           │  market.spread.*    │
           │  (Kafka Topic)     │
           └─────────────────────┘
```

---

## Demo Services

| Service | Purpose |
|---------|---------|
| `demo-market-agent-a` | Publishes mock price snapshots for Chain A |
| `demo-market-agent-b` | Publishes mock price snapshots for Chain B |
| `demo-scanner` | Consumes both feeds, calculates spread, emits signals |

---

## Configuration

Edit `.env`:

```env
# Kafka
KAFKA_BROKERS=localhost:29092

# Demo settings
DEMO_PRICE_A=2500.00
DEMO_PRICE_B=2500.50
DEMO_SPREAD_THRESHOLD_BPS=1

# Intervals (ms)
PUBLISH_INTERVAL=5000
```

---

## What's Different from Production

| Feature | Demo | Production |
|---------|------|------------|
| Data Source | Mock random prices | Real RPC queries |
| Execution | Log only | Real DEX calls |
| Risk Assessment | Simple threshold | Monte Carlo sims |
| Slippage Handling | None | Venue-specific |
| Route Logic | Hardcoded | Dynamic selection |

---

## Directory Structure

```
demo-package/
├── docker-compose.demo.yml
├── .env.example
├── README.md
├── demo-market-agent/
│   ├── src/
│   │   └── index.ts
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
└── demo-scanner/
    ├── src/
    │   └── index.ts
    ├── Dockerfile
    ├── package.json
    └── tsconfig.json
```

---

## License

This demo package is provided under the **Evaluation License** terms in `../LICENSE.commercial.md`. It is for demonstration and evaluation only — not for production use.

---

## Support

For questions about the demo:
- Review the architecture in the main `docs/` directory
- Check deployment patterns in main `docker-compose.*.yml` files
- Contact for licensing inquiries

---

*This demo contains no real trading logic. Past performance does not guarantee future results. Not financial advice.*
