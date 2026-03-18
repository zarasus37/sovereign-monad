# SMMEVAE Agent Worklist

This document is the agent-ready backlog for the Sovereign Monad MEV Arb Engine. It is intended to be fed directly into an implementation agent or used as the basis for iterative execution.

Use this together with:

1. `STATUS.md` for current live state.
2. `BUSINESS_BRIEF.md` for positioning.
3. `COMMERCIALIZATION_PLAN.md` for licensing and go-to-market direction.

---

## Operating Principle

The current system is architecturally strong but not yet fully live-trading ready. The highest-priority remaining work is to move from:

1. partially synthetic testnet validation,

to:

2. real venue data,
3. funded wallet,
4. controlled live execution,
5. validated realized performance,
6. productized infrastructure surfaces.

---

## Priority 0: Hard Blockers

### 0.1 Fund the Monad wallet

Goal:

1. Get usable balance into wallet `0x8C00B99801Be11fC29BdD12539C0Fc0e396E6F3a` on Monad testnet.

Current blocker:

1. Faucet eligibility requires at least `10 MON` or `0.001 ETH` on the checked wallet.

Tasks:

1. Determine whether the faucet supports a recipient address distinct from the connected wallet.
2. If yes, use an eligible wallet to request funds to the bot wallet.
3. If no, decide between:
   - funding the bot wallet with at least `0.001 ETH` on Ethereum mainnet, or
   - sourcing test MON from another eligible wallet or community source.
4. Verify Monad balance arrival using the DRPC endpoint.
5. Record funded balance in `STATUS.md`.

Done criteria:

1. Wallet has non-zero Monad balance.
2. Execution services can read the funded balance successfully.

### 0.2 Replace synthetic Monad market data with real venue data

Goal:

1. Stop depending on synthetic Kuru fallback for Monad-side price and liquidity.

Current blocker:

1. Kuru contract addresses appear stale and return `BAD_DATA` / `CALL_EXCEPTION`.

Tasks:

1. Verify current Kuru contract addresses from official docs, Discord, or chain explorers.
2. Test contract reads manually for bid/ask, reserves, and liquidity.
3. If Kuru is not viable, integrate an alternative Monad DEX venue.
4. Remove or heavily gate synthetic fallback in environments intended for live trading.
5. Re-run pipeline validation with real Monad venue outputs only.

Done criteria:

1. `monad-market-agent` emits real Monad prices and liquidity without synthetic fallback.
2. Spread and opportunity outputs are derived from real market data.

---

## Priority 1: Live Trading Readiness

### 1.1 Validate live execution prerequisites

Tasks:

1. Confirm all required env vars are correct for execution services.
2. Verify private key wiring across `monad-arb-bot`, `eth-arb-bot`, and `bridge-exec-bot`.
3. Confirm sufficient gas balance on each required chain.
4. Verify contract addresses for execution routes and bridges.
5. Re-check `USE_FLASHBOTS`, `DRY_RUN`, slippage, and exposure settings.

Done criteria:

1. All execution bots start cleanly with no missing config.
2. Wallet, RPC, and contract dependencies are validated.

### 1.2 Move from dry-run to guarded live mode

Tasks:

1. Keep `DRY_RUN=true` until wallet funding and real data are confirmed.
2. Introduce a first-live-trade profile with very conservative caps.
3. Set max single-trade exposure to a lower initial value than current defaults.
4. Raise EV thresholds for live money compared to synthetic test conditions.
5. Flip `DRY_RUN=false` only after all preflight checks pass.

Done criteria:

1. First live execution profile exists and is documented.
2. Live mode can be enabled with explicit minimal-risk settings.

### 1.3 Run first controlled live trades

Tasks:

1. Execute a very small number of low-notional trades.
2. Capture predicted EV, realized PnL, gas, and slippage for each.
3. Compare expected versus realized outcomes.
4. Review logs, alerts, and feedback capture after each trade.
5. Update `STATUS.md` with real execution observations.

Done criteria:

1. At least one real trade is executed and fully observed.
2. Forecast-versus-realized analysis is documented.

---

## Priority 2: Risk and Alpha Quality

### 2.1 Tighten risk thresholds for live use

Tasks:

1. Review `EV_MIN_THRESHOLD`, `SHARPE_LIKE_THRESHOLD`, `MAX_TAIL_LOSS_PERCENT`, and exposure caps.
2. Define separate profiles for testnet validation and live capital.
3. Add stronger rejection logic for stale or shallow liquidity.
4. Penalize opportunities under stress conditions.
5. Re-evaluate bridge-based opportunities with more conservative assumptions.

Done criteria:

1. Risk settings are explicitly separated into simulation-safe and live-safe modes.

### 2.2 Improve execution-quality attribution

Tasks:

1. Record forecast EV, realized PnL, gas used, slippage, and route metadata together.
2. Distinguish inventory-based, bridge-based, and ETH-route opportunities in logs.
3. Add post-trade attribution fields to feedback logs or reports.
4. Extend backtest and replay outputs to include route and quality breakdowns.

Done criteria:

1. Operators can explain why a trade succeeded or failed in quantitative terms.

### 2.3 Rework backtest realism

Tasks:

1. Reduce over-optimistic assumptions in the current replay model.
2. Replace synthetic fill-rate randomness with route-aware execution assumptions.
3. Correlate spread signals with actual evaluation and execution outcomes where possible.
4. Separate synthetic-data backtests from real-data backtests.

Done criteria:

1. Backtest results are labeled clearly by data quality and execution realism.

---

## Priority 3: Infrastructure Hardening

### 3.1 Secrets and configuration hygiene

Tasks:

1. Remove sensitive values from any shareable docs or examples.
2. Move private keys and webhooks toward a safer secrets-management approach.
3. Review `.env`, `.env.example`, and testnet/prod env templates for consistency.
4. Ensure no production-sensitive values are committed inadvertently.

Done criteria:

1. Secrets posture is safer and template files are clean.

### 3.2 Docker and deployment cleanup

Tasks:

1. Remove obsolete `version` field from `docker-compose.yml` and related compose files.
2. Standardize env names across compose variants.
3. Confirm production and testnet compose files still reflect the actual service architecture.
4. Validate rebuild and restart instructions in docs.

Done criteria:

1. Compose stack starts cleanly without obvious warnings or stale config drift.

### 3.3 Monitoring and incident readiness

Tasks:

1. Expand alert coverage for critical failures and RPC issues.
2. Add explicit alerts for synthetic fallback activation in non-test environments.
3. Create a short operator runbook for common failures.
4. Add periodic health-check validation for Kafka consumers and producers.

Done criteria:

1. Common failure modes have corresponding alert or runbook coverage.

---

## Priority 4: Product and Documentation

### 4.1 Align documentation with reality

Tasks:

1. Update `README.md` risk parameters if they differ from current live compose values.
2. Update deployment docs to reflect the current alert-rules container and webhook env names.
3. Ensure `STATUS.md` reflects that webhook configuration is complete and verified.
4. Add references to the business and commercialization docs from the main README if desired.

Done criteria:

1. Core docs match the live implementation and current config names.

### 4.2 Add technical architecture documentation

Tasks:

1. Create `ARCHITECTURE.md` describing layers, topics, services, and data flow.
2. Include mathematical overview of EV, gas, slippage, and risk controls.
3. Clarify what is real versus synthetic today.
4. Add diagrams or operator-facing flow summaries if helpful.

Done criteria:

1. Repo has a formal technical architecture document.

### 4.3 Add repeatable operator utilities

Tasks:

1. Add a one-command webhook smoke test.
2. Add a one-command balance check for Monad and Ethereum.
3. Add a one-command pipeline health summary.
4. Add a one-command backtest runner against current logs.

Done criteria:

1. Key ops tasks can be run without manually reconstructing commands.

---

## Priority 5: Commercialization and Packaging

### 5.1 Decide product boundary

Tasks:

1. Define what remains internal-only versus what is licensable.
2. Split infrastructure surfaces from alpha-sensitive strategy surfaces.
3. Identify which modules could be community-safe.

Done criteria:

1. Clear internal classification exists for open, commercial, and private components.

### 5.2 Choose licensing direction

Tasks:

1. Decide between permissive, dual-license, or source-available strategy.
2. Evaluate whether any part of the codebase should be public at all.
3. If external release is planned, draft license files and usage terms.

Done criteria:

1. Licensing stance is explicit and documented.

### 5.3 Prepare first commercial package

Tasks:

1. Build a customer-facing architecture/demo package.
2. Define service tiers: community, pro, enterprise, or private deployment only.
3. Draft pricing approach for consulting, private licensing, and hosted tooling.
4. Identify first design-partner profile.

Done criteria:

1. A first commercial offer can be described concretely.

---

## Priority 6: Strategic Enhancements

### 6.1 Add persistent performance analytics

Tasks:

1. Move beyond JSONL-only analytics into richer structured reporting or a metrics store.
2. Track route-level win rate, slippage, and execution failure reasons over time.
3. Build trend reporting around opportunity quality and realized execution quality.

Done criteria:

1. Longitudinal execution and quality metrics are available.

### 6.2 Expand venue and strategy coverage

Tasks:

1. Add additional Monad venues if available.
2. Add more Ethereum pools or alternate execution routes.
3. Explore inventory-aware or latency-aware strategies beyond simple spread capture.

Done criteria:

1. Strategy is not fully dependent on a single Monad venue.

### 6.3 Production security review

Tasks:

1. Review container privileges, secret handling, and network exposure.
2. Review webhook and private-key handling.
3. Confirm logs do not leak sensitive operational data.
4. Add a basic threat model for hosted or licensed deployments.

Done criteria:

1. Security review findings are documented and prioritized.

---

## Suggested Execution Order For An Agent

If assigning this to an autonomous implementation agent, use this order:

1. Fund wallet or resolve faucet path.
2. Restore real Monad venue data.
3. Validate live execution prerequisites.
4. Create a conservative live-trade profile.
5. Run first real trades and measure outcomes.
6. Tighten risk and attribution.
7. Clean compose/docs/config drift.
8. Add operator utilities and runbooks.
9. Create `ARCHITECTURE.md`.
10. Finalize commercialization boundary and licensing stance.

---

## Minimal Agent Prompt

Use this as a starting prompt for another agent:

"Read `STATUS.md`, `BUSINESS_BRIEF.md`, `COMMERCIALIZATION_PLAN.md`, and `AGENT_WORKLIST.md`. Prioritize unresolved technical blockers first: wallet funding path, real Monad venue restoration, live execution readiness, and risk tightening. Work sequentially, validate each change with logs or tests, update docs when state changes, and do not treat synthetic-data performance as real alpha."