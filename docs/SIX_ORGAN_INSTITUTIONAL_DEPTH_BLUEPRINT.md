# Six-Organ Institutional Depth Blueprint (v1)

Date context: 2026-04-30

This file defines the implementation standard for all six opening organs at institutional depth.

Status: accepted ecosystem upgrade track. The current `organ-runtime` surfaces are analysis-mode implementations, and final live authority remains gated by runtime execution truth, funded `Cardia` activation, telemetry calibration, and governance controls.

## 1) Objective

Move each organ from simple role logic to:

1. explicit phase-based processing
2. quantitative scoring and confidence
3. conflict-aware coordination
4. auditable outputs for Data Rail and governance

## 2) Organ Standards

### Hepar

Must produce:

1. deterministic forensic risk vectors
2. multi-agent consensus fusion
3. symbolic status integration (`proved_safe` / `counterexample` / `unknown`)
4. action banding and attestation metadata

### Cortex

Must produce:

1. causal drivers (not summary-only)
2. scenario matrix with probabilities and stress posture
3. decision-support recommendations with confidence
4. model-update hooks for recurring failure modes

### Synapse

Must produce:

1. source trust weighting
2. conflict detection and arbitration routing
3. capital-sensitive escalation behavior
4. route auditability (why signal routed where)

### Cardia

Must produce:

1. risk-adjusted allocation scoring
2. reserve-aware deployable budget logic
3. stress-regime actions (crash, liquidity stress, reserve breach)
4. measurable net allocation and blocked-exposure tracking

### Pneuma

Must produce:

1. venue/counterparty filtered execution choices
2. cost-optimized route selection
3. fill ratio + cost metrics
4. feedback signals back into Synapse/Cortex/Cardia

### Vox

Must produce:

1. audience-specific packages from a common truth set
2. proof-reference linkage
3. narrative truth status (`verified` / `incomplete` / `conflicted`)
4. coherence warnings for operator follow-up

## 3) Current Build Surface in `organ-runtime`

Institutional-depth companion snapshots are now implemented for:

1. `Hepar`: forensic + consensus layers
2. `Cortex`: strategic stress/scenario/recommendation layer
3. `Synapse`: adaptive trust/conflict/escalation layer
4. `Cardia`: adaptive allocation/stress-response layer
5. `Pneuma`: market-interface execution intelligence layer
6. `Vox`: truth-verified multi-audience narrative layer

All are analysis-mode surfaces and do not grant live autonomous authority by themselves.

## 4) Pass/Fail Definition (Per Organ)

An organ is **Institutional-Depth PASS** when:

1. it emits structured outputs with confidence/decision state
2. test coverage validates key edge cases
3. outputs can be tied to evidence records
4. orchestration captures interactions with at least two other organs

An organ is **FAIL** when it is only static role logic without adaptive scoring, auditable reasoning, or cross-organ integration.

## 5) Next Realism Steps

1. feed these analysis modules with live telemetry streams instead of static samples
2. persist decisions and evidence roots into Data Rail artifacts
3. calibrate thresholds against historical incident and trade outcomes
4. formalize governance override policy for escalated conflicts
5. add reliability dashboards (precision/recall, false positives, execution slippage, narrative trust score)
