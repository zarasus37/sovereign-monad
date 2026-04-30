# Organ Intelligence Calibration Report

Date context: 2026-04-30

## Scope

Calibration run for the adaptive policy surfaces introduced in:

1. `Synapse` adaptive routing
2. `Cardia` adaptive allocation
3. `Pneuma` market execution

Companion uplift scoring also reported for:

1. `Cortex` institutional coverage
2. `Vox` truth-verification coverage

Command:

```powershell
npm --prefix organ-runtime run calibrate:intelligence
```

## Calibrated Policy Parameters

### Synapse policy

1. `conflictSeverityGap = 3`
2. `lowConfidenceBlockThreshold = 0.45`
3. `capitalEscalationMinSeverity = 2`

### Cardia coefficients

1. `returnWeight = 1.2`
2. `riskPenaltyWeight = 0.18`
3. `drawdownPenaltyWeight = 0.06`
4. `elevatedStressPenalty = 2.5`
5. `crashStressPenalty = 11`
6. `allocateThreshold = 2`
7. `reduceThreshold = -4`
8. `hardBlockRiskScore = 70`

### Pneuma policy

1. `urgentLatencyPenaltyDivisor = 90`
2. `normalLatencyPenaltyDivisor = 180`
3. `minSettlementReliability = 0.72`

## Benchmark Uplift vs Baseline

### Synapse

1. Baseline routing accuracy: `0.50`
2. Calibrated routing accuracy: `1.00`
3. Relative lift: `+100%`

### Cardia

1. Baseline decision accuracy: `0.25`
2. Calibrated decision accuracy: `1.00`
3. Relative lift: `+300%`

### Pneuma

1. Baseline execution-choice accuracy: `0.3333`
2. Calibrated execution-choice accuracy: `1.00`
3. Relative lift: `+200%`
4. Calibrated average execution cost: `24.111 bps`

### Cortex coverage

1. Baseline institutional coverage: `0.25`
2. Upgraded institutional coverage: `1.00`
3. Relative lift: `+300%`

### Vox coverage

1. Baseline truth-verification coverage: `0.00`
2. Upgraded truth-verification coverage: `1.00`
3. Relative lift: `+100%` (from zero baseline to full coverage)

## Interpretation Boundary

These uplifts are from deterministic benchmark fixtures in `organ-runtime/src/tools/calibrate-organ-intelligence.ts`.
They are valid for architecture and policy direction, but not a substitute for live-outcome calibration on production telemetry.
