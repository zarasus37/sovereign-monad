# Risk Engine

Monte Carlo-based risk evaluation for Sovereign Monad cross-chain arbitrage opportunities.

## What It Does

- consumes `risk.opportunity-candidate`
- simulates inventory-based and bridge-based outcomes
- publishes approved or rejected results to `risk.opportunity-evaluation`

## Model Notes

- bridge latency is modeled probabilistically
- gas and bridge costs are deducted from expected value
- tail loss and Sharpe-like metrics are part of approval logic

Use the MOF for canonical phase and blocker status.
