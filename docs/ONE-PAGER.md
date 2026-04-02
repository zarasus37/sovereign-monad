# Sovereign MEV Engine

## Risk Infrastructure for Cross-Chain Arbitrage

Sovereign MEV Engine is the decision layer between spread detection and capital deployment.

It is built for funds, prop desks, and treasury operators who want cross-chain arbitrage evaluated with explicit risk math before anything reaches execution.

## What Problem It Solves

Most cross-chain bots are weak in the same three places:

1. They treat bridge delay as a fee problem instead of a price-risk problem.
2. They size trades with fixed percentages instead of edge-adjusted sizing.
3. They approve opportunities on raw spread thresholds without modeling tail risk.

## What The Engine Does

### 1. Converts raw spread into effective spread

The core `RiskGnosisEngine` discounts raw spread by:

- volatility decay over the bridge window
- a compounding penalty on that volatility
- fixed execution cost in basis points

### 2. Sizes with fractional Kelly

Position sizing is based on edge relative to variance, then clipped with a 10 percent portfolio cap.

### 3. Runs Monte Carlo on the opportunity

The engine models:

- correlated geometric Brownian motion across the two chains
- bridge latency as a log-normal distribution
- gas and bridge fees as explicit costs
- bridge-failure probability in bridge-based paths
- EV, variance, Sharpe-like score, and tail-loss estimates

## Repo Status, Stated Carefully

The repo currently contains:

- the core risk engine
- a synthetic buyer demo package
- a Starter/Pro API wrapper
- billing and license-service scaffolds
- Base/Arbitrum deployment artifacts

The `risk-engine` package currently has 28 local tests passing across sizing, Monte Carlo evaluation, approval logic, deterministic stress-matrix regression, and bridge-failure/liquidity stress coverage. Canonical project phase and live-status claims remain governed by the separate `sovereign-monad` repo.

## Why It Is Credible

- The risk engine code is separated cleanly enough to ship as both a Docker product and an API product.
- The Monte Carlo implementation models correlated paths, bridge latency, and bridge-failure scenarios.
- A buyer-safe demo package exists so prospects can watch synthetic opportunities flow into real approve/reject decisions.

This is not just a landing-page concept. The repo contains a licensable decision engine plus demo, API, and commercialization scaffolds.

## Who Buys This First

| Buyer | Why it fits |
|-------|-------------|
| Crypto prop desks | They get a risk layer without building one from scratch |
| Small funds ($1M-$25M AUM) | They can evaluate opportunities via API before committing engineering time |
| DeFi treasury operators | They can assess idle-capital yield routes against explicit risk controls |

## Commercial Packaging

| Tier | Price | AUM Cap | Delivery |
|------|-------|---------|----------|
| Starter | $1,000/mo | <= $5M | REST API, 1,000 calls/day |
| Pro | $2,500/mo | <= $25M | REST API, 10,000 calls/day, parameter tuning |
| Fund | $5,000/mo | <= $100M | Full Docker stack, self-hosted |
| Enterprise | $10,000+/mo | Unlimited | White-label deployment, custom support, custom models |

## What Buyers Receive

Starter and Pro buyers receive:

- `POST /evaluate`
- `GET /health`
- `GET /config`

Fund and Enterprise buyers receive the self-hosted Docker delivery path with license activation and startup validation.

## Positioning

This is not a promise of alpha.

It is a way to stop deploying capital on weak cross-chain spreads by forcing every opportunity through explicit edge decay, sizing, and tail-risk logic first.

*Infrastructure only. Not financial advice. Live execution outcomes depend on market conditions, liquidity, operator controls, and canonical program readiness.*
