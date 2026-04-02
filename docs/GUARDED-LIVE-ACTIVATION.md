# Guarded-Live Activation

## Purpose

This document defines an activation and rollback path for a first funded Base/Arbitrum session, if that artifact path is intentionally exercised.

Use it together with:

1. `docs/GUARDED-LIVE-PROFILE.md`
2. `docs/OPERATOR-RUNBOOK.md`
3. `https://github.com/zarasus37/sovereign-monad`

## Files Involved

1. Base runtime artifact: `docker-compose.mainnet.yml`
2. Guarded-live override: `docker-compose.guarded-live.override.yml`

## Preflight Checklist

1. Fund the configured wallet on Base and Arbitrum.
2. Confirm balances with `powershell -ExecutionPolicy Bypass -File .\scripts\check-balances.ps1`.
3. Confirm container health with `powershell -ExecutionPolicy Bypass -File .\scripts\pipeline-health.ps1`.
4. Confirm topic flow with `powershell -ExecutionPolicy Bypass -File .\scripts\topic-flow-summary.ps1`.
5. Confirm alert delivery with `powershell -ExecutionPolicy Bypass -File .\scripts\webhook-smoke-test.ps1`.
6. Confirm an operator is actively watching the first funded session.

## Activation Command

```powershell
docker compose -f docker-compose.mainnet.yml -f docker-compose.guarded-live.override.yml config
docker compose -f docker-compose.mainnet.yml -f docker-compose.guarded-live.override.yml up -d spread-scanner opportunity-constructor risk-engine portfolio-manager arb-bot alert-rules
```

## Rollback Command

```powershell
docker compose -f docker-compose.mainnet.yml up -d spread-scanner opportunity-constructor risk-engine portfolio-manager arb-bot alert-rules
```

Rollback immediately on repeated execution failures, stale topic flow, missing alerts, or any mismatch between expected and effective live config.
