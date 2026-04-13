# Cortical Overlay Model

## Purpose

This document adds a cortical overlay to the existing organism model.

It is not a new layer.
It is not a replacement for the six-organ set.
It is not a new package mandate.

Its purpose is narrower:

- clarify how the ecosystem thinks
- separate perception from integration
- separate memory/meaning from executive control
- reduce ambiguity across the intelligence, signal, Oracle, Dove, Gnosis, and activation surfaces

Use it as a coordination map for existing components.

## Design Rule

The ecosystem already has:

- organs for functional survival
- layers for structural architecture

The cortical overlay adds:

- cognitive domains

So the model becomes:

- organs = what the body does
- layers = where the system is architecturally organized
- cortical overlay = how the organism perceives, integrates, decides, remembers, and expresses

## Why this is useful

Without a cortical overlay, systems often blur together:

- raw signal and interpretation
- memory and decision
- pattern recognition and policy
- narrative and executive control

That blur creates bad architecture.

The overlay is useful because it gives each existing surface a cleaner cognitive role without introducing another subsystem.

## The Four Lobe Mapping

### 1. Frontal Lobe

Core biological function:

- executive planning
- inhibition
- prioritization
- decision gating
- controlled action

Ecosystem role:

- executive control and activation gating

Primary ecosystem surfaces:

- `oracle-core`
- `dao-core`
- `execution-truth-core`
- `cardia-activation-core`
- `public-activation-core`
- `expansion-control`

Primary question:

- what should the organism do now, and what should it refuse to do yet?

### 2. Parietal Lobe

Core biological function:

- body-state integration
- multi-signal coordination
- spatial/topological awareness
- mapping where things are relative to each other

Ecosystem role:

- system-state integration and coordination

Primary ecosystem surfaces:

- `synapse` inside `organ-runtime`
- `ecosystem-state-api`
- `ecosystem-dashboard`
- `boundary-stress-monitor`
- routing/topology awareness across organs and layers

Primary question:

- what is happening across the organism as a whole right now?

### 3. Temporal Lobe

Core biological function:

- memory
- identity continuity
- language association
- meaning and recognition across time

Ecosystem role:

- memory, identity, continuity, and meaning

Primary ecosystem surfaces:

- `gnosis-core`
- `gnosis-evaluator-core`
- `data-rail-core`
- `reward-ledger-core`
- `keys-core`
- `keys-nft-core`
- `narrative-core`
- long-horizon behavioral history

Primary question:

- who is this organism, what has it learned, and what remains continuous over time?

### 4. Occipital Lobe

Core biological function:

- perceptual intake
- first-pass sensory processing
- conversion of raw input into structured percepts

Ecosystem role:

- perception and first-pass signal formation

Primary ecosystem surfaces:

- `signal-layer`
- runtime event capture
- observability and health surfaces
- market/feed intake
- slot/source-health intake

Primary question:

- what is being seen before higher-order interpretation changes it?

## Hemisphere Overlay

### Left Hemisphere

Primary mode:

- sequential
- explicit
- contract-bound
- metric and proof oriented

Primary ecosystem fit:

- deployment sequencing
- routing invariants
- ledgers
- activation gates
- runbooks
- verification steps
- hard policy thresholds

### Right Hemisphere

Primary mode:

- pattern-oriented
- integrative
- symbolic
- contextual
- emergence and coherence oriented

Primary ecosystem fit:

- Dove interpretation
- Gnosis interpretation
- narrative meaning
- emergent protocol discovery
- behavioral pattern recognition
- system gestalt across time

## Important Clarification About `Cortex`

The organ named `Cortex` is not the same thing as the full cortical overlay.

`Cortex` remains one organ in the six-organ set:

- research synthesis
- strategic understanding
- coherent internal modeling

Inside the cortical overlay, `Cortex` mainly participates across:

- frontal functions when strategy becomes decision support
- temporal functions when understanding becomes stored meaning

That distinction matters. The overlay should clarify the existing system, not create naming confusion.

## Minimal Mapping Table

| Cognitive Domain | Main Question | Primary Surfaces |
|---|---|---|
| Occipital / Perception | What is being seen? | `signal-layer`, health intake, market/runtime events |
| Parietal / Integration | What is happening across the whole body? | `Synapse`, `ecosystem-state-api`, `ecosystem-dashboard`, `boundary-stress-monitor` |
| Temporal / Memory-Identity | What remains continuous and meaningful across time? | `gnosis-core`, `data-rail-core`, `reward-ledger-core`, `keys-core`, `narrative-core` |
| Frontal / Executive Control | What should be done, delayed, or refused? | `oracle-core`, `dao-core`, `execution-truth-core`, `cardia-activation-core`, `public-activation-core`, `expansion-control` |

## Practical Application Rule

Apply the overlay only where it reduces ambiguity.

Good uses:

- deciding whether a component is perceptual, integrative, mnemonic, or executive
- separating policy surfaces from interpretation surfaces
- clarifying ownership during future buildouts
- preventing Dove/Gnosis/Narrative from leaking into hard execution control

Bad uses:

- creating new packages just to mirror lobe names
- renaming the existing six organs
- adding another formal layer to the 15-layer stack
- forcing every service into a fake neuroscience analogy

## What this changes immediately

This overlay changes interpretation and coordination discipline, not the package graph.

Immediate structural effects:

- `Signal Layer` should be treated as perceptual before it is treated as strategic
- `ecosystem-state-api` and `Synapse` should be treated as body-state integration, not executive policy
- `Gnosis`, `Keys`, `Narrative`, and `Data Rail` should be treated as continuity/meaning surfaces, not gatekeepers
- `Oracle`, activation gates, and `Cardia` controls should be treated as frontal executive surfaces

## Canonical Constraint

The cortical overlay is beneficial only if it simplifies control boundaries.

If applying it starts producing extra ceremony, extra packages, or category confusion, stop there.

The right result is:

- clearer thinking
- cleaner responsibility boundaries
- less cognitive sprawl

Not more architecture for its own sake.
