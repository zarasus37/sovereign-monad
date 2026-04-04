# Build Execution Flow

This document separates the actual build order into two tracks:

- zero-capital build flow
- capital-gated build flow

The point is operational. Build momentum should not stop just because a later activation step needs money, liquidity, or recurring infrastructure spend.

## Project-wide rule

This split applies to the whole ecosystem, not just Layer 5.

Until one of these becomes true:

- external project funding is secured
- recurring infrastructure costs are covered
- the first organ set produces stable enough revenue to fund the gated work itself

the project should continue to follow the zero-capital build flow as the primary construction path.

Capital-gated work should remain sequenced and documented, but it should not be allowed to halt the broader build.

## Rule

If a task can be completed without:

- live treasury capital
- recurring paid infrastructure
- customer payment activation
- real bankroll deployment

then it belongs in the zero-capital build flow and should continue now.

If a task requires one of those inputs, it belongs in the capital-gated flow and should be tracked separately without freezing the rest of the build.

## Zero-capital build flow

These are the parts that should continue regardless of current funding:

1. canonical doctrine and synchronization
2. contract/test scaffolding and deployment tooling
3. runtime packages and simulation tooling
4. organ-runtime and coordination logic
5. first organ role implementation in analysis mode
6. barrier and permission model implementation
7. immune and alert logic implementation
8. mixed-speed signaling architecture
9. waste-clearance and repair workflows
10. slot/product/UI/build surfaces that do not require live spend
11. docs, runbooks, health models, and operator tooling

## Capital-gated build flow

These are the parts that should remain sequenced, but not block the zero-capital track:

1. live Phase 1a deploy retry
2. live approved-source registration
3. funded treasury routing
4. funded `Cardia` activation
5. live bankroll routing loop
6. live DeFi strategy execution
7. production VPS/domain/Stripe activation
8. public paid customer onboarding
9. sustained guarded-live operating record

## Immediate no-cost build frontier

The correct immediate build order is:

1. `organ-runtime` scaffold
2. `Synapse` implementation
3. `Hepar` implementation
4. `Cortex` implementation
5. `Vox` implementation
6. `Pneuma` implementation
7. barrier, immune, repair, and cadence logic
8. `Cardia` simulation and band logic in analysis mode
9. `signal-layer` schema and aggregation substrate
10. initial behavioral and event interpretation layer
11. Oracle scaffolding around verified signal surfaces
12. Gnosis scaffolding and integration surfaces around verified intelligence and signal posture
13. `BoundaryStressMonitor v1` analysis scaffold
14. platform integration surfaces around verified intelligence, signal, Oracle, Gnosis, and stress posture
15. first shared internal state/API surface joining the zero-capital stack
16. first internal dashboard and operator views consuming the shared state surface
17. builder infrastructure and controlled expansion framework on top of the local platform surface
18. initial Keys scaffolding and delegation boundary system
19. identity surface policies and local key activation logic
20. Data Rail preparation and behavioral capture policy surfaces
21. Data Rail routing logic and internal reward ledger surfaces
22. Data Rail externalization gates: diversity thresholds, rights policy, and product boundary conditions

Current zero-capital frontier:

- the first organ set is implemented locally in analysis mode, including `Cardia`
- orchestration, participation boundaries, and the first bounded mandate loop now exist locally
- `signal-layer` now provides schema, aggregation, and interpretation in analysis mode
- `oracle-core` now provides local regime and posture classification in analysis mode
- `gnosis-core` now provides retrospective-only decompression and hollow-convergence analysis in analysis mode
- `boundary-stress-monitor` now provides sheath pressure, turbulence, and escalation posture in analysis mode
- `ecosystem-state-api` now exposes a shared local state surface across the verified zero-capital stack
- `ecosystem-dashboard` now provides the first internal dashboard/operator view on top of that shared state surface
- `platform-builder` now provides local builder infrastructure on top of the shared platform surface
- `expansion-control` now provides a policy-driven controlled expansion framework
- `keys-core` now provides local key activation scaffolding and delegation boundary enforcement
- `data-rail-core` now provides a local behavioral capture policy surface and reward/data schema scaffold
- `data-rail-router` now provides local internal routing logic while external productization remains blocked
- `reward-ledger-core` now provides an internal non-monetary reward ledger surface
- the next no-cost priority is Data Rail externalization gates: diversity thresholds, rights policy, and product boundary conditions

Only after those exist does funded live activation become the limiting factor.

## Why this is the truthful build order

This preserves two truths at once:

- real live deployment and funded activation still require capital
- actual software construction should not stall on those inputs

It also preserves a third truth:

- if the first organ set later becomes productive enough to fund the project, then capital-gated work can migrate back into the active build path without changing the doctrine

The organism should keep developing every structure that can be built honestly before money enters the loop.
