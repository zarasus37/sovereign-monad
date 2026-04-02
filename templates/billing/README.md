# Billing Service Template

This package handles Step 6 of the commercialization path:

- Stripe Checkout for recurring subscriptions
- Stripe Customer Portal for self-service billing changes
- Stripe webhooks that issue or deactivate API keys in the shared key store
- Manual CLI issuance for USDC-paid customers

## Endpoints

- `POST /checkout/session`
- `POST /portal/session`
- `POST /webhooks/stripe`
- `GET /health`

For public deployment behind the commercial edge stack, this service should sit behind:

- `https://billing.<root-domain>`

## Why this shape

Stripe Checkout plus Billing is the fastest correct path for recurring SaaS-style licensing.
It avoids building renewal, retry, and dunning logic manually.

## Shared state

By default this service writes to:

`../api/config/api-keys.json`

That keeps payment events aligned with the Starter/Pro/Fund API access layer.

## Manual USDC path

For crypto-native buyers, the first version stays operationally simple:

1. buyer sends USDC to your wallet
2. you verify settlement
3. you issue a key with:

```bash
npm run issue-manual-key -- "Client Name" fund client@example.com "USDC tx 0xabc..."
```

## Required Stripe setup

- create four recurring Stripe Prices
- place the Price IDs in `.env`
- configure the webhook endpoint to point at `/webhooks/stripe`
- subscribe to:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_failed`

## Local health check

```bash
curl http://127.0.0.1:3010/health
```

For the cleanest local path, prefer the combined stack in `templates/commercial-stack/`.
Use `docker-compose.yml` plus `docker-compose.local.yml` for local checks, or `docker-compose.prod.yml` for localhost-only production binding.
