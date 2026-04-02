# Licensed Deployment

This document is the delivery path for Fund and Enterprise buyers running the full stack themselves.

## Files

- Base stack: `docker-compose.mainnet.yml`
- Licensed overlay: `docker-compose.licensed.yml`
- Activation script: `scripts/activate-license.sh`
- Validation script: `scripts/validate-license.sh`
- Deploy script: `scripts/deploy-licensed.sh`
- Health check: `scripts/health-check.sh`

## Activation Flow

1. Copy `.env.example` to `.env` and fill in the runtime secrets.
2. Set `LICENSE_SERVER_URL` to your activation service if you are not using the local template.
3. Run `./scripts/activate-license.sh YOUR_LICENSE_KEY`.
4. Confirm `.env.license` was written.
5. Run `./scripts/deploy-licensed.sh`.

## What Activation Does

`activate-license.sh` posts the provided key to the licensing server and writes the approved response into `.env.license`.

The licensed overlay requires:

- `LICENSE_KEY`
- `LICENSE_ACTIVATED`
- `LICENSE_ACTIVATED_AT`
- `LICENSE_ACTIVATION_ID`
- `LICENSE_TIER`
- `LICENSE_CUSTOMER`

If those values are missing, `docker compose -f docker-compose.mainnet.yml -f docker-compose.licensed.yml ...` fails fast.

## Validation and Revocation

`deploy-licensed.sh` calls `validate-license.sh` before every stack startup. That means a revoked key can no longer be used for a new deployment or restart sequence.

This is not in-process runtime revocation. It is startup-time enforcement, which is sufficient for an initial commercial delivery flow.

## Example

```bash
export LICENSE_SERVER_URL=http://localhost:4010
./scripts/activate-license.sh SMEV-FUND-ALPHA
./scripts/deploy-licensed.sh
./scripts/health-check.sh
```
