# Funnel Diversification Plan

## Problem

The ecosystem should not begin with a single revenue dependency.

If MonadSpin is the only live funnel at the beginning, then:

- Layer 1 becomes a concentration-risk bottleneck
- the capital loop depends on one product launch path
- early treasury growth is exposed to a single operational failure mode
- live routing proof becomes financially tied to slot success

That is avoidable fragility.

## Decision

Do not treat the slot as the only opening funnel.

The correct opening posture is a multi-rail funnel:

1. bootstrap manual inflow rail
2. API and licensing rail
3. agent-native revenue rail
4. MonadSpin slot rail

The slot remains important, but it should be one revenue rail inside the funnel, not the sole dependency for the beginning of the project.

## Phase 1 opening funnel

### Rail 1. Bootstrap Manual Inflow

Purpose:

- controlled first approved inflows
- routing proof before external product dependencies
- emergency fallback if product rails are delayed

Implementation path:

- use the current bootstrap approved source wallet
- route intentional small test and controlled operational inflows through Phase 1a

### Rail 2. API and Licensing

Purpose:

- turn the already-built commercial stack into a real second funnel
- reduce dependence on gaming/product launch timing
- let service revenue begin before the slot is live

Existing repo surfaces:

- `templates/api`
- `templates/billing`
- `templates/license-service`
- `templates/commercial-stack`

Early revenue forms:

- API subscriptions
- evaluation access
- private onboarding or pilot licenses
- enterprise seats

### Rail 3. Agent-Native Revenue

Purpose:

- let unattached ecosystem agents generate early value directly
- create a revenue source that is faithful to the agent-native thesis
- reduce dependence on human-sold or consumer-product rails

Early forms:

- bounded DeFi strategies
- research and signal products
- content creation and distribution

Rule:

- start with constrained mandates, explicit risk envelopes, and observable outputs

See:

- `docs/AGENT_NATIVE_REVENUE_RAIL.md`

### Rail 4. MonadSpin Slot

Purpose:

- mass-market entertainment inflow
- culturally aligned flagship rail
- long-run volume path

Rule:

- keep MonadSpin as a major rail, not the only rail

## Immediate implementation rule

For the beginning of the project, Layer 1 should be described as:

- a multi-source funnel
- opening first through bootstrap plus API/licensing plus agent-native work
- then expanding into MonadSpin once the slot rail is real

## What changes operationally

1. Phase 1a deployment still proceeds
2. first approved source can still be the bootstrap wallet
3. next funnel milestone is not only "ship the slot"
4. next funnel milestone becomes "activate at least one additional non-slot revenue rail"

## Minimum acceptable launch posture

The funnel should not be considered healthy unless at least two of these are real:

- bootstrap manual inflow
- API or licensing revenue
- agent-native revenue
- MonadSpin slot revenue

Three is better. One is not acceptable as a target state.

## Recommended next order

1. finish live Phase 1a deployment proof
2. register bootstrap approved source
3. activate API and licensing as the first non-slot revenue rail
4. stand up the first bounded unattached-agent revenue mandate
5. continue MonadSpin slot development as the fourth rail

This removes the unnecessary single-source dependency without discarding the slot thesis.
