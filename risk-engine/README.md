# Risk Engine

Monte Carlo-based risk evaluation for cross-chain arbitrage opportunities.

## Evaluation Criteria

- EV Mean > EV_MIN_THRESHOLD ($100)
- Sharpe-like ratio > 0.5
- Max tail loss < 20% of notional

## Topics

- Input: `risk.opportunity-candidate`
- Output: `risk.opportunity-evaluation`

## Monte Carlo Parameters

- 10,000 simulations per opportunity
- Correlated price paths between Monad/Ethereum
- Bridge latency modeled as log-normal
- Small probability of bridge failure (~0.1%)

## Run

```bash
npm install
cp .env.example .env
npm run dev
```
