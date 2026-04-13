# Capital-Gated Funding Plan

This document translates the current capital-gated frontier into concrete funding requirements.

It is an operator planning artifact for `monad-mev`. It does not override canonical status in the MOF.

## 1. Current Reality

The project is not blocked by missing architecture. It is blocked by the first live proof gates:

1. live Phase 1a deployment proof
2. bootstrap approved-source registration
3. runtime execution-truth closure
4. funded `Cardia` activation
5. production/public activation

Current local shared-state posture:

- `phase1aLiveProofRecorded: false`
- `bootstrapSourceRegistered: false`
- `executionTruthStatus: blocked`
- `cardiaActivationStatus: blocked`
- `publicActivationStatus: blocked`

## 2. Assumptions

These figures use the current working assumptions:

- MON spot reference: about `$0.03275` per MON
- `1 USD` therefore buys about `30.5 MON`
- Phase 1a deploy guidance:
  - hard floor: `1 MON`
  - recommended deploy budget: `10 MON`
- `Cardia` first-funding policy:
  - `recommendedFirstFundingMon: 10`

These numbers can drift with market price. Recalculate before spending.

## 3. Table One: Absolute Minimum To Proceed

This is the cheapest honest path to resume the live lane.

| Item | MON | Approx USD | Why it exists |
|---|---:|---:|---|
| Deployer refill for live Phase 1a retry | 10 | $0.33 | Repo deploy recommendation |
| Bootstrap source tx headroom | 5 | $0.16 | Register source and handle follow-up txs |
| First live routing test inflow | 100 | $3.28 | Small but meaningful real inflow |
| Safety reserve | 50 | $1.64 | Prevent another mid-flow stop |
| **Total** | **165** | **$5.41** | Minimum honest restart budget |

Read:

- below this, the project is likely to stall on retries or lack of test room
- this budget is enough to prove the next gate, not enough to operate comfortably

## 4. Table Two: Recommended Guarded-Live Budget

This is the range that makes the next lane practical instead of fragile.

| Item | MON | Approx USD | Why it exists |
|---|---:|---:|---|
| Deployer wallet | 25 | $0.82 | Safer than the minimum deploy recommendation |
| Bootstrap source wallet | 25 | $0.82 | Leaves room for source registration and test operations |
| First guarded-live routing/inflow pool | 250-500 | $8.19-$16.38 | Real proof rather than a trivial symbolic transfer |
| `Cardia` first policy funding | 10 | $0.33 | Current policy floor |
| Contingency reserve | 100 | $3.28 | Repeat test, retry, or correction buffer |
| **Total** | **410-660** | **$13.43-$21.63** | Recommended near-term operating range |

Read:

- this is the budget range that fits your stated `$20` target
- the lower end is enough to move with discipline
- the upper end is where the process stops feeling cramped

## 5. Table Three: Private-Production Monthly Runway

This is not chain-side proof money. This is recurring production money.

| Item | Lean | Recommended | Why it exists |
|---|---:|---:|---|
| QuickNode | $49/mo | $49-$249/mo | RPC continuity |
| VPS | $4-$6/mo | $12-$24/mo | Private services and operator stack |
| Domain | $1-$3/mo equivalent | $1-$3/mo equivalent | DNS / public routing |
| Stripe fixed monthly | $0 | $0 | Standard Stripe has no monthly base |
| **Total recurring** | **$53-$58/mo** | **$62-$276/mo** | Private production runway |

Read:

- `$20-$40` is enough for chain-side proof and first guarded-live progress
- `$20-$40` is not enough for a fresh recurring private-production stack if QuickNode must also be paid now

## 6. What Your Current Budget Means

### If you spend `$20`

At the current MON reference, `$20` buys about `610 MON`.

That is enough for:

- a disciplined Phase 1a retry
- bootstrap source registration
- a real first routing test
- execution-truth follow-through
- `Cardia` first policy funding
- contingency room

It is enough to move the project from `blocked` into real proof work.

### If you spend `$40`

At the current MON reference, `$40` buys about `1,221 MON`.

That is enough for:

- the full recommended guarded-live budget
- larger first routing/inflow proof
- more retry room
- less pressure on every single tx decision

It does not by itself create a sustainable monthly infra runway, but it gives you operational breathing room.

## 7. Capital Leverage Model

This is the correct mental model:

The first dollars are not buying profit directly.
They are buying **removal of the main uncertainty barrier**.

At the current stage, each dollar is doing three things:

1. moving the project from theory to live proof
2. turning blocked statuses into measurable outcomes
3. preserving the chance to convert the commercial tiers into real revenue

### Every-Dollar Ladder

| Spend | What it buys now | What it unlocks next |
|---|---|---|
| `$1` | about `30.5 MON` | real tx headroom, retry capacity, nontrivial progress |
| `$5` | about `152 MON` | enough room for deployer refill, bootstrap ops, and a small live test |
| `$10` | about `305 MON` | enough room for a disciplined live-proof attempt with reserve |
| `$20` | about `610 MON` | enough to move through live proof, bootstrap registration, execution-truth staging, and first `Cardia` policy funding |
| `$40` | about `1,221 MON` | enough to run the lane with less fragility and more meaningful guarded-live proof size |

### Immediate Leverage

At this stage, the economic leverage is nonlinear:

- before live Phase 1a proof, the system is architecturally advanced but commercially unproven
- after live Phase 1a proof, the system can begin producing evidence
- evidence is what makes the runtime, `Cardia`, and private deployment lane credible

So the first capital is not “small money into small return.”
It is **small money into gate removal**.

### Commercial Leverage Against Current Tier Pricing

Current repo pricing surfaces:

- Starter: `$1,000/mo`
- Pro: `$2,500/mo`
- Fund: `$5,000/mo`
- Enterprise: `$10,000+/mo`

Those are revenue tiers, not guaranteed profit. But they are the right scale reference.

#### If the outlay is `$20`

| Tier | Monthly revenue multiple vs `$20` outlay |
|---|---:|
| Starter | `50x` |
| Pro | `125x` |
| Fund | `250x` |
| Enterprise | `500x+` |

#### If the outlay is `$40`

| Tier | Monthly revenue multiple vs `$40` outlay |
|---|---:|
| Starter | `25x` |
| Pro | `62.5x` |
| Fund | `125x` |
| Enterprise | `250x+` |

That does not mean those customers appear automatically.
It means the capital required to reach the next proof gates is tiny relative to the first real commercial upside already defined in the repo.

## 8. Operator Recommendation

With your current stated budget, the pragmatic path is:

### Preferred path with `$20`

1. allocate enough MON to clear the Phase 1a retry and bootstrap source steps cleanly
2. keep the rest reserved for execution-truth follow-through
3. do not commit to recurring production spend yet unless QuickNode is already covered

### Better path with `$40`

1. run the full recommended guarded-live budget
2. keep a larger contingency buffer
3. avoid turning every retry into a capital problem

## 9. Bottom Line

The project does not currently need large money to move.

It needs enough money to cross from:

- local completion

to:

- live proof

That is why the first `$20-$40` matters so much.

It is not fueling a mature machine yet.
It is removing the last small barrier between a fully built local organism and the first real evidence that it can function live.
