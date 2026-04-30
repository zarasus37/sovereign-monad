# Functional Budget and Revenue Metrics (2026-04-30)

This file defines both:

1. money required to become functional (by stage), and
2. current revenue potential metrics from the runtime model.

It is a planning artifact for `monad-mev` and does not override canonical MOF status.

## 1) Scope Definitions

### Functional Stage A - Technical Functional

System can run guarded-live proof loops with:

1. runtime execution-truth closure path active,
2. funded `Cardia` activation path active,
3. first guarded-live evidence path runnable.

### Functional Stage B - Commercial Functional

System can repeatedly sell and deliver Tier 1 and Tier 3 products with reliable operations.

### Functional Stage C - Institutional Functional

System can support Tier 2 and Tier 4 enterprise/insurance lanes with longitudinal evidence and partner-grade delivery.

## 2) Money Required to Become Fully Functional

## Stage A - Technical Functional (repo-grounded numbers)

From `docs/CAPITAL_GATED_FUNDING_PLAN.md` and `docs/OPERATIONAL_PASS_FAIL_FUNDING_MATRIX.md`:

1. minimum honest gate-clearing budget: `165 MON` (about `$5.41` at the reference MON price used in that doc),
2. recommended guarded-live budget: `410-660 MON` (about `$13.43-$21.63` at that same reference),
3. recurring infra runway:
   - lean: `$53-$58/mo`,
   - recommended: `$62-$276/mo`.

Practical Stage-A planning:

1. one-time chain-side gate budget: `410-660 MON`,
2. plus first 6 months infra:
   - lean runway total: about `$331-$370` range equivalent after adding chain-side budget,
   - recommended runway total: about `$385-$1,678` range equivalent after adding chain-side budget.

Note: USD equivalents above depend on MON/USD and can drift.

## Stage B - Commercial Functional (assumption-based operating budget)

To make Tier 1 + Tier 3 reliably sellable and deliverable:

1. one-time hardening (API reliability, evidence packaging automation, support workflows): `$15k-$80k`,
2. recurring monthly (infra, operations, buyer acquisition, customer handling): `$8k-$40k/mo`,
3. suggested 6-month runway: `$63k-$320k`.

## Stage C - Institutional Functional (assumption-based scale budget)

To move Tier 2 + Tier 4 into real institutional lanes:

1. one-time institutionalization (data engineering depth, legal/compliance, contracting): `$50k-$250k`,
2. recurring monthly (partner ops, research publication cadence, enterprise support): `$30k-$120k/mo`,
3. suggested 12-month runway: `$410k-$1.69M`.

## 3) Revenue Potential Metrics (Current Runtime Snapshot)

Source: `organ-runtime` revenue snapshot on 2026-04-30 local runtime config.

### Readiness

1. weighted readiness score: `68.8 / 100`,
2. offer states:
   - ready: `2`,
   - developing: `2`,
   - blocked: `1`.

### Annualized Revenue Bands

1. annualized ready band: `$1.32M-$15M`,
2. weighted pipeline band: `$1.551M-$17.31M`.

Band construction:

1. ready offers counted at `100%`,
2. developing offers counted at `35%` weighting,
3. blocked offers counted at `0%`.

### Current Launch Sequence

1. `tier1-hepar-risk-api`
2. `tier3-forensic-prelaunch-report`
3. `tier2-institutional-risk-feed`
4. `tier4-insurance-underwriting-dataset`
5. `organ-native-compound-revenue-loop`

## 4) Gap-to-Value Interpretation

What is missing to move readiness higher:

1. Hepar coverage depth (current blockers call for scaling toward `20+`, then `50+`/`100+` for insurance-grade confidence),
2. monetizable Cortex brief cadence (`2+` for Tier 2 reliability, `4+` for Tier 4 credibility),
3. evidence-linked Vox publication cadence (`4+` for institutional auditability),
4. qualified institutional counterparty depth (`5+` for underwriting lane readiness).

## 5) Operator Decision Rule

Use this sequence for disciplined scaling:

1. clear Stage A gates first (cheap, high leverage, truth-closing),
2. run Stage B revenue loops until retention and delivery reliability are proven,
3. only then fund Stage C institutional lane expansion.

This preserves capital efficiency while maximizing probability of converting modeled revenue into realized revenue.
