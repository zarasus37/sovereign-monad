# Sovereign MEV — One-Pager

## The Problem

Cross-chain arbitrage requires:
- Real-time market data from multiple venues
- Fast signal detection
- Risk-managed execution
- Operational tooling

Most teams build this from scratch. We're building it once.

---

## The Solution

**Sovereign MEV** — Production-ready arbitrage infrastructure

```
[Base + Arbitrum] → [Spread Scanner] → [Risk Engine] → [Execution]
```

### Features

- **Event-Driven** — Kafka-powered pipeline, not polling
- **Guarded-Live** — Dry-run by default, flip to live with one env var
- **Monitored** — Dashboard, alerts, health checks
- **Extensible** — Add venues, strategies, risk models

---

## Who It's For

| Profile | Use Case |
|---------|----------|
| Prop teams | Scale existing strategies |
| Solo traders | Automate monitoring + execution |
| Funds | Build infrastructure faster |

---

## Current Status

- ✅ Running on Base ↔ Arbitrum
- ✅ Real-time prices via Alchemy
- ✅ Guarded-live mode enabled
- ✅ Trade logging to database

---

## Pricing

| Tier | Price | What's Included |
|------|-------|------------------|
| Evaluation | $0 | 30-day eval |
| Pilot | $10k-$25k | 1 team, internal use |
| Production | $12k-$30k/yr | Annual license |
| Enterprise | $50k+/yr | Custom + support |

---

## Contact

[Your Contact Info Here]

---

*Not financial advice. Past performance ≠ future results.*
