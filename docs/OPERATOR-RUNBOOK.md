# Operator Runbook

## Purpose

This runbook covers the Base/Arbitrum artifact path in this repo and the operator checks used to determine whether that path is healthy, degraded, or simply quiet because route quality is weak.

Use this together with:

1. `https://github.com/zarasus37/sovereign-monad`
2. `docs/MIGRATION-BASE-ARB.md`
3. `ARCHITECTURE.md`
4. `docs/GUARDED-LIVE-PROFILE.md`
5. `docs/GUARDED-LIVE-ACTIVATION.md`

## Repo Entry Point

The Base/Arbitrum deployment entrypoint in this repo is `docker-compose.mainnet.yml`.

The repo service set for that path is:

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

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\pipeline-health.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\check-balances.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\topic-flow-summary.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\webhook-smoke-test.ps1 -PreviewOnly
cmd /c npm --prefix .\risk-engine run stress:matrix:report
```

The stress-matrix artifact is written to:

- `risk-engine\artifacts\stress-matrix.json`

Review that file when validating whether the current risk model still matches the expected scenario gates in:

- `risk-engine\src\tools\stress-gates.json`

## What Healthy Looks Like

1. Base and Arbitrum market agents are running and logging fresh block activity.
2. `spread-scanner`, `opportunity-constructor`, and `risk-engine` are running without repeated error loops.
3. `model-feedback-logger` is writing JSONL output.
4. `arb-bot` receives execution plans only when upstream gates are cleared.
5. `alert-rules` starts with either webhook destinations or `console-only` mode.
6. The dashboard remains reachable at `http://localhost:8501`.

## What Quiet But Healthy Looks Like

1. market snapshots are still flowing
2. spread or opportunity topics are sparse
3. active thresholds are filtering out shallow or low-edge opportunities
4. the system is behaving as configured under `DRY_RUN`

## Notes On Legacy Paths

The old Monad/Ethereum service folders and legacy compose files remain in the repo as reference artifacts. Do not use them for Base/Arbitrum incident response unless you are intentionally working on future Monad reactivation.
