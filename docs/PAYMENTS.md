# Payments and Subscription Handling

Step 6 is split into two tracks:

## Stripe first

Stripe is the fastest path for recurring fiat billing.

Use [templates/billing](C:/Users/crisc/Dev/agents/monad-mev/templates/billing) for:

- hosted Stripe Checkout subscription flows
- Customer Portal sessions
- webhook-driven API key issuance and deactivation
- mapping paid subscriptions into the shared API key store used by [templates/api](C:/Users/crisc/Dev/agents/monad-mev/templates/api)

### Stripe products to create

Create one recurring monthly Price for each tier:

- Starter: $1,000/mo
- Pro: $2,500/mo
- Fund: $5,000/mo
- Enterprise: custom / manual quoting or high-price placeholder

### Minimal go-live flow

1. create the four Stripe Prices
2. copy [templates/billing/.env.example](C:/Users/crisc/Dev/agents/monad-mev/templates/billing/.env.example) to `.env`
3. fill in `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and the four Price IDs
4. deploy the billing service
5. point your Stripe webhook endpoint at `https://billing.<root-domain>/webhooks/stripe`

### What the webhook does

- on active subscription creation/update: create or reactivate an API key
- on deletion or failed payment: deactivate that key

This is enough for the first revenue stage without adding a database yet.

### Public billing endpoint

When you deploy the commercial edge stack with Caddy, the billing service should sit behind:

- `https://billing.<root-domain>`

That keeps the Stripe webhook URL stable and separate from the API and license surfaces.

## USDC second

USDC stays manual for the first few customers.

Recommended first-pass workflow:

1. give the buyer your settlement wallet
2. confirm the transfer on-chain
3. issue a key with the billing CLI
4. send the key manually over your chosen channel

Example:

```bash
cd templates/billing
npm run issue-manual-key -- "Fund Name" fund ops@fund.com "USDC tx 0xabc..."
```

## Operational note

The shared JSON key store is acceptable for the first customers.

Once you have several paying accounts or want usage/audit history, move billing and API access state into PostgreSQL and persist Stripe customer and subscription IDs there.
