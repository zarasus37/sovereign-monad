# Guarded-Live Activation

## Purpose

This document defines the explicit activation and rollback path for the first funded Base/Arbitrum session.

Use it together with:

1. `docs/GUARDED-LIVE-PROFILE.md`
2. `docs/OPERATOR-RUNBOOK.md`
3. `STATUS.md`

## Files Involved

1. Base runtime: `docker-compose.mainnet.yml`
2. Guarded-live override: `docker-compose.guarded-live.override.yml`

The override file is intentionally additive. It does not replace the mainnet compose file and should only be used for funded sessions.

## Preflight Checklist

Complete all items before disabling `DRY_RUN`:

1. Fund the configured wallet on Base and Arbitrum.
2. Confirm balances with `powershell -ExecutionPolicy Bypass -File .\scripts\check-balances.ps1`.
3. Confirm container health with `powershell -ExecutionPolicy Bypass -File .\scripts\pipeline-health.ps1`.
4. Confirm topic flow with `powershell -ExecutionPolicy Bypass -File .\scripts\topic-flow-summary.ps1`.
5. Confirm alert delivery with `powershell -ExecutionPolicy Bypass -File .\scripts\webhook-smoke-test.ps1`.
6. Confirm an operator is actively watching the first funded session.

## Review Effective Config Before Activation

Preview the merged compose config first:

```powershell
docker compose -f docker-compose.mainnet.yml -f docker-compose.guarded-live.override.yml config
```

Warning: this command expands values from `.env`, including secrets. Review it locally and do not paste the full output into chat, tickets, or shared notes.

Do not proceed if the merged config does not show:

1. `DRY_RUN=false` for `arb-bot`
2. `MAX_SINGLE_TRADE_PERCENT=10` for `portfolio-manager`
3. `MAX_BRIDGE_EXPOSURE_PERCENT=5` for `portfolio-manager`
4. `EV_MIN_THRESHOLD=25` and `RISK_MIN_EFFECTIVE_SPREAD_BPS=15` for `risk-engine`
5. `MAX_SLIPPAGE_BPS=20` for `arb-bot`

## Activation Command

Use the override only for the services whose runtime behavior changes:

```powershell
docker compose -f docker-compose.mainnet.yml -f docker-compose.guarded-live.override.yml up -d spread-scanner opportunity-constructor risk-engine portfolio-manager arb-bot alert-rules
```

## Immediate Post-Activation Checks

Run these checks immediately after activation:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\pipeline-health.ps1 -RecentLogLines 5
docker logs base-arb-mev-mainnet-risk-engine --tail 30
docker logs base-arb-mev-mainnet-portfolio --tail 30
docker logs base-arb-mev-mainnet-arb-bot --tail 30
```

Verify that:

1. `arb-bot` no longer logs `Running in DRY RUN mode`
2. `risk-engine` starts with the guarded-live thresholds
3. `portfolio-manager` restarts cleanly
4. alerts continue to deliver

## Rollback Command

If the funded session must stop, return to the mainnet DRY_RUN stack with:

```powershell
docker compose -f docker-compose.mainnet.yml up -d spread-scanner opportunity-constructor risk-engine portfolio-manager arb-bot alert-rules
```

Then confirm recovery with:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\pipeline-health.ps1
docker logs base-arb-mev-mainnet-arb-bot --tail 20
```

## Stop Conditions

Rollback immediately if any of the following happen:

1. two consecutive execution failures
2. unexpected slippage or execution path behavior
3. missing topic flow or stale snapshots
4. missing alert delivery during the funded session
5. any mismatch between expected and effective live config