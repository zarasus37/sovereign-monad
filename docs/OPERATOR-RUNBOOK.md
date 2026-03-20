# Operator Runbook

## Purpose

This runbook covers the current Base/Arbitrum runtime and the basic operator checks needed to determine whether the stack is healthy, degraded, or simply quiet because route quality is weak.

Use this together with:

1. `STATUS.md`
2. `docs/MIGRATION-BASE-ARB.md`
3. `ARCHITECTURE.md`
4. `docs/GUARDED-LIVE-PROFILE.md`
5. `docs/GUARDED-LIVE-ACTIVATION.md`

## Current Entry Point

The active deployment entrypoint is `docker-compose.mainnet.yml`.

The current validated service set is:

1. `base-market-agent`
2. `arbitrum-market-agent`
3. `spread-scanner`
4. `opportunity-constructor`
5. `risk-engine`
6. `portfolio-manager`
7. `arb-bot`
8. `model-feedback-logger`
9. `alert-rules`
10. `stress-monitor`
11. `dashboard`

## Quick Health Commands

### Pipeline health summary

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\pipeline-health.ps1
```

### Wallet balance check

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\check-balances.ps1
```

### Topic flow summary

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\topic-flow-summary.ps1
```

### Webhook smoke test

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\webhook-smoke-test.ps1 -PreviewOnly
powershell -ExecutionPolicy Bypass -File .\scripts\webhook-smoke-test.ps1
```

### Refresh operating snapshot

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\refresh-status.ps1
```

### Guarded-live review

Review `docs/GUARDED-LIVE-PROFILE.md` before funding the wallet or disabling `DRY_RUN`.

Use `docs/GUARDED-LIVE-ACTIVATION.md` for the exact activation and rollback commands.

## What Healthy Looks Like

1. Base and Arbitrum market agents are running and logging fresh block activity.
2. `spread-scanner`, `opportunity-constructor`, and `risk-engine` are running without repeated error loops.
3. `model-feedback-logger` is writing JSONL output.
4. `arb-bot` is receiving execution plans only when upstream gates are cleared.
5. `alert-rules` starts with either webhook destinations or `console-only` mode.
6. The dashboard remains reachable at `http://localhost:8501`.

## What Quiet But Healthy Looks Like

The current route can be healthy while producing very little downstream flow.

This usually means:

1. market snapshots are still flowing,
2. spread or opportunity topics are sparse,
3. the active thresholds are filtering out shallow or low-edge opportunities,
4. the system is behaving correctly under the current DRY_RUN profile.

## Common Failure Checks

### 1. Market agents are down

Check:

```powershell
docker logs base-arb-mev-mainnet-base-agent --tail 30
docker logs base-arb-mev-mainnet-arbitrum-agent --tail 30
```

Likely causes:

1. RPC connectivity failure
2. bad pool address or contract read failure
3. container restart loop after image or env drift

### 2. No spread signals

Check:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\topic-flow-summary.ps1
```

Interpretation:

1. If market topics are populated but spread signals are sparse, thresholds or route quality are likely the reason.
2. If market topics are empty, the problem starts upstream with market ingestion.

### 3. No opportunity evaluations or execution plans

Check:

```powershell
docker logs base-arb-mev-mainnet-opp-constructor --tail 30
docker logs base-arb-mev-mainnet-risk-engine --tail 30
docker logs base-arb-mev-mainnet-portfolio --tail 30
```

Interpretation:

1. Constructor may be suppressing small opportunities.
2. Risk engine may be rejecting low-EV or high-tail-loss candidates.
3. Portfolio constraints may be suppressing plans.

### 4. Webhook alerts are not arriving

Check:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\webhook-smoke-test.ps1 -PreviewOnly
powershell -ExecutionPolicy Bypass -File .\scripts\webhook-smoke-test.ps1
```

Interpretation:

1. Missing `DISCORD_WEBHOOK_URL` or `SLACK_WEBHOOK_URL` in `.env`
2. remote webhook rejection or timeout
3. alert service not subscribed or not running

### 5. Alert service is not starting or not delivering

Check:

```powershell
docker logs base-arb-mev-mainnet-alert-rules --tail 30
powershell -ExecutionPolicy Bypass -File .\scripts\webhook-smoke-test.ps1 -PreviewOnly
```

Interpretation:

1. `console-only` startup means the service is healthy but webhook secrets are still unset.
2. repeated webhook errors mean remote rejection, timeout, or an invalid webhook URL.

## Recommended Recovery Order

1. Confirm containers are up.
2. Check market-agent logs.
3. Check Kafka topic flow.
4. Check downstream service logs.
5. Confirm alert-rules startup and webhook configuration.
6. Confirm wallet balances and RPC reachability.
7. Refresh `STATUS.md` after the system is stable again.

## Alert Configuration Notes

Set one or both of the following in `.env` to enable delivery beyond console logs:

1. `DISCORD_WEBHOOK_URL`
2. `SLACK_WEBHOOK_URL`

Optional alert tuning keys:

1. `MIN_ALERT_SPREAD_BPS`
2. `MAX_POSITION_ALERT_USD`
3. `ALERT_COOLDOWN_MS`

## Notes On Legacy Paths

The old Monad/Ethereum service folders and legacy compose files remain in the repo as reference artifacts. Do not use them for current incident response unless you are intentionally working on future Monad reactivation.