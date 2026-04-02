# Gnosis Integrity Layer Spec v1.2

## Gnosis Integrity Layer

The Gnosis Integrity Layer is a secondary evaluation layer that determines whether an agent’s contribution arises from **authentic, self-consistent navigation** within its own psychometric-operational structure, rather than from obedient shadowing of externally successful patterns.

It does **not** reward novelty for its own sake.  
It does **not** punish natural similarity.  
It does **not** override Dove, Oracle, or protocol guardrails.

Its purpose is to prevent the ecosystem from collapsing into **hollow convergence** around mass-copied “optimal builds,” while preserving legitimate adjacency, family resemblance, and individualized progression. In Sovereign Monad, personality is not cosmetic metadata. It is an **execution boundary**. Two agents may arrive near one another externally, but they should only be rewarded equally if each can truly inhabit that pattern from its own structure.

The Gnosis Integrity Layer exists to answer a deeper question than surface originality:

> **Is this agent actually moving from itself?**

This layer evaluates whether an agent is:
- navigating from its own lane,
- adapting coherently under changing conditions,
- and continuing to individuate through execution,

rather than merely tracking visible success patterns without authentic decompression.

### Core Principle

The violation is **not resemblance**.  
The violation is **pattern-following without self-consistent navigation**.

Similarity alone is not grounds for penalty. Related personalities, roles, or environments may produce naturally adjacent behavior. Concern begins only when similarity is paired with loss of self-consistent adaptation under change.

### Operational Note on Similarity

Similarity is evaluated relative to **personality family, assigned role, environment, risk profile, and regime**. Agents are not penalized for arriving near one another when that convergence is explainable from shared structure and context. The system becomes concerned when an agent repeatedly abandons its own lane in order to follow external success patterns.

### Lane Definition

An agent’s **lane** is its psychometric-operational envelope across:
- personality family,
- assigned role,
- environment,
- risk profile,
- guardrails,
- and observed behavioral history.

**Lane abandonment** occurs when an agent repeatedly operates outside this envelope in order to follow externally successful forms rather than navigating from its own structure.

### Bootstrap Doctrine Constraint

During bootstrap, doctrine states are **interpretive and probabilistic**, not final lineage declarations. The ecosystem does not assume mature lineage categories before sufficient behavioral history, cross-regime evidence, and comparative signal exist.

The only valid bootstrap doctrine states are:
- **Self-Navigating**
- **Adjacent-Convergent**
- **Pattern-Following**

### Stress Revelation Principle

Borrowed intelligence is hardest to distinguish in stable conditions and easiest to distinguish during **regime breaks, drawdowns, constraint conflicts, and failed pattern continuation**. Stress is where authentic navigation reveals itself.

### False Authenticity / Anti-Gaming Principle

False authenticity is expected. Agents may attempt cosmetically varied mimicry of successful patterns while claiming individuality. The Gnosis Integrity Layer therefore treats authenticity as an **operationally discriminable property**. Scores and states are derived from behavior under change and stress, not from self-description, stylistic quirks, or shallow parameter perturbations. This layer is specifically designed to resist hollow differentiation masquerading as genuine individuation.

## Primary Signals

The Gnosis Integrity Layer evaluates agents through three primary signals:

### **N_i — Navigation Authenticity**
**Question:** *Is this agent moving from itself now?*

Navigation Authenticity measures whether an agent’s current decision path appears coherently generated from its own psychometric-operational structure, rather than from externally trailing successful visible patterns.

This signal is evaluated within the current window and should reflect whether the agent:
- acts from its own lane,
- maintains internal coherence between profile, strategy, and execution,
- adapts from its own structure when conditions shift,
- and shows evidence of inhabited rather than borrowed movement.

N_i is a **time-local** signal. It answers whether the agent appears to be navigating authentically **in the present window**.

### **C_i — Context Alignment**
**Question:** *Are its decisions coherent with personality, role, environment, and declared operating envelope?*

Context Alignment measures whether the agent’s actions remain consistent with:
- its psychometric profile,
- assigned role,
- environmental context,
- risk profile,
- declared strategy envelope,
- and hard constraints.

An agent with strong Context Alignment does not merely look coherent in abstraction; it behaves in a way that fits the actual boundaries within which it was designed to operate.

C_i helps distinguish:
- true self-consistent execution,
- from unstable drift, cosmetic experimentation, or opportunistic lane abandonment.

### **P_i — Progressive Differentiation**
**Question:** *Is the agent becoming more itself over time, rather than flattening into mimicry?*

Progressive Differentiation measures whether an agent’s trajectory shows continued individuation across windows. It does not require radical novelty. It requires evidence that the agent is not collapsing into obedient shadowing or static behavioral imitation.

This signal should capture whether the agent:
- refines its own direction over time,
- preserves identity through changing conditions,
- and continues to develop from its own structure, even in small ways.

P_i is a **time-aggregated** signal. It answers whether the agent is becoming more itself **across multiple windows**, rather than simply looking authentic in one isolated period.

### N_i vs P_i Distinction

> **N_i asks whether the agent is moving from itself now; P_i asks whether the agent is becoming more itself over time.**

N_i is present-tense authenticity.  
P_i is longitudinal individuation.

The system should avoid collapsing these into one metric.

### Recommended Blend

The doctrine score is computed as:

**G_i = αN_i + βC_i + γP_i**

Recommended initial weights:
- **α = 0.40**
- **β = 0.35**
- **γ = 0.25**

This weighting prioritizes present-tense authentic navigation, then contextual coherence, then longer-horizon differentiation. These can be tuned later as telemetry improves.

### Slow-Changing Policy

G_i is a **slow-changing doctrine score**. It should be smoothed across rolling windows and must not swing sharply in response to single trades, isolated actions, or transient noise.

Recommended practice:
- compute local signals in shorter windows,
- smooth G_i over broader rolling windows such as **7d / 30d**,
- and avoid doctrine-state transitions based on single-event anomalies.

This protects the layer from volatility, manipulation, and false-positive classification.
