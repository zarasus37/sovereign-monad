# Docker Templates for Trading Bots

## Quick Start

```bash
# Base template
docker compose -f docker-compose.base.yml up -d

# With monitoring
docker compose -f docker-compose.monitored.yml up -d

# Production
docker compose -f docker-compose.prod.yml up -d
```

---

## Available Templates

### 1. Base Template (`docker-compose.base.yml`)
Minimal setup for testing.

**Services:**
- Kafka + Zookeeper
- 1 Market agent
- Basic monitoring

```bash
docker compose -f docker-compose.base.yml up -d
```

---

### 2. Full Template (`docker-compose.full.yml`)
Complete MEV infrastructure.

**Services:**
- Kafka + Zookeeper
- Base market agent
- Arbitrum market agent
- Spread scanner
- Risk engine
- Portfolio manager
- Execution bot
- Dashboard

```bash
docker compose -f docker-compose.full.yml up -d
```

---

### 3. Monitored Template (`docker-compose.monitored.yml`)
Full + Prometheus + Grafana.

**Services:**
- Everything in full
- Prometheus
- Grafana
- AlertManager

```bash
docker compose -f docker-compose.monitored.yml up -d
```

---

### 4. Production Template (`docker-compose.prod.yml`)
Production-ready with health checks.

**Services:**
- Everything in monitored
- Health check endpoints
- Log aggregation
- Backup scripts

```bash
docker compose -f docker-compose.prod.yml up -d
```

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `KAFKA_BROKERS` | Kafka servers | kafka:29092 |
| `RPC_BASE` | Base RPC URL | - |
| `RPC_ARB` | Arbitrum RPC URL | - |
| `DRY_RUN` | Dry run mode | true |
| `MIN_SPREAD_BPS` | Min spread | 5 |
| `LOG_LEVEL` | Log level | info |

---

## Deployment Commands

### Development
```bash
docker compose -f docker-compose.full.yml up -d
```

### Production
```bash
# Build first
docker compose -f docker-compose.prod.yml build

# Deploy
docker compose -f docker-compose.prod.yml up -d

# With custom name
docker compose -f docker-compose.prod.yml -p my-bot up -d
```

### Monitoring
```bash
# View logs
docker compose -f docker-compose.full.yml logs -f

# Check health
docker compose -f docker-compose.full.yml ps

# Stop
docker compose -f docker-compose.full.yml down
```

---

## Customization

### Add New Market
1. Create new adapter in `src/adapters/`
2. Add service to compose file
3. Configure environment variables

### Add New Strategy
1. Add strategy logic in `src/strategies/`
2. Update risk engine config
3. Restart services

---

## Volumes

| Volume | Purpose |
|--------|---------|
| `kafka-data` | Kafka messages |
| `postgres-data` | Trade database |
| `logs` | Application logs |

---

## Networking

All services communicate via internal Docker network. External access:

- Dashboard: `localhost:8501`
- Kafka: `localhost:9092`
- Prometheus: `localhost:9090`
- Grafana: `localhost:3000`

---

## Security

- No secrets in compose files
- Use `.env` for sensitive data
- Rotate API keys regularly
- Use read-only wallets for production
