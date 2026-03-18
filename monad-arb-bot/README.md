# Monad Arb Bot

Execution bot for Monad-based arbitrage trades.

## Modes

- **Dry Run**: Set `DRY_RUN=true` to simulate execution without sending transactions
- **Live**: Provide `PRIVATE_KEY` and set `DRY_RUN=false`

## Topics

- Input: `execution.execution-plan`
- Output: `execution.execution-result`

## Execution Flow

1. Receives approved ExecutionPlan from portfolio manager
2. Builds swap transaction (Kuru/Uniswap)
3. Applies slippage protection
4. Executes via Flashbots or public mempool
5. Emits ExecutionResult with realized PnL
