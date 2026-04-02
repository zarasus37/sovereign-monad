# Docker Entrypoints

This file replaces the older template matrix that referenced compose files that no longer exist in this repo.

## Base/Arbitrum Runtime Path

Use these compose files for the Base/Arbitrum artifact path:

- `docker-compose.mainnet.yml`
- `docker-compose.guarded-live.override.yml`
- `docker-compose.licensed.yml`

Supporting docs:

1. `README.deploy.md`
2. `docs/GUARDED-LIVE-ACTIVATION.md`
3. `docs/LICENSED-DEPLOYMENT.md`
4. `docs/OPERATOR-RUNBOOK.md`

## Commercial Service Path

Use `templates/commercial-stack/` for the public commercial services:

- `docker-compose.yml`: base services with no host port publishing
- `docker-compose.local.yml`: local validation on host ports `3000`, `3010`, `4010`
- `docker-compose.prod.yml`: localhost-only host binding
- `docker-compose.edge.yml`: internet-facing `80/443` edge with Caddy

Primary docs:

1. `templates/commercial-stack/README.md`
2. `templates/commercial-stack/DEPLOYMENT-RUNBOOK.md`
3. `docs/PAYMENTS.md`

## Verified Commands

Local commercial stack:

```powershell
cd templates/commercial-stack
.\up.ps1
.\verify.ps1
.\down.ps1
```

Localhost-only production bind:

```powershell
cd templates/commercial-stack
.\preflight.ps1 -AllowPlaceholders
.\up.ps1 -Prod
.\verify.ps1
.\down.ps1 -Prod
```

Public edge deployment shape:

```powershell
cd templates/commercial-stack
copy .env.edge.example .env.edge
.\preflight.ps1 -Edge -AllowPlaceholders
docker-compose -f docker-compose.yml -f docker-compose.edge.yml config
```

Full public verification still depends on:

- a real root domain
- DNS records for `api`, `billing`, and `licenses`
- a reachable host on ports `80/443`
- real Stripe live credentials

## Notes

- Do not rely on older references to `docker-compose.base.yml`, `docker-compose.full.yml`, or `docker-compose.monitored.yml`. Those files are not part of the current repo state.
- The commercial stack and the Base/Arbitrum runtime path are separate deployment concerns and should be operated that way.
