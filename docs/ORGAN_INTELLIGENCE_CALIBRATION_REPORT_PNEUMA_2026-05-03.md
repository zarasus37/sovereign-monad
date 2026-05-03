# ORGAN INTELLIGENCE CALIBRATION REPORT

**Date:** 2026-05-03
**Tag:** CAL-PNEUMA-001
**Status:** ⚠️ fixture-verified only

## Scope
- 6 Fixture Classes executed.
- Pneuma 4-Domain Market Intelligence architecture applied.
- Overall Market Intelligence Score: 100%

## Calibrated Execution Parameters Confirmed
- urgentLatencyPenaltyDivisor: 90
- normalLatencyPenaltyDivisor: 180
- minSettlementReliability: 0.72

## Benchmark Accuracy Per Market Domain
- Price and Liquidity Intake: Correctly mapped all market indicators.
- Execution Intelligence: Correctly calculated latency penalties and execution costs (verified 24.111 bps for GMX).
- Regime Classification: Accurately identified NORMAL, STRESSED, CRISIS, and RECOVERING states with appropriate confidence scores.
- Converted Demand Detection: Correctly detected and routed pre-exploit anomaly signals to Synapse.

## Interpretation Boundary — BINDING
All outputs strictly bound to `fixture-verified` domain. 
What this does NOT authorize:
- Does NOT authorize production usage for real-client execution or trading.
- Does NOT claim Decision-Support tier autonomy.

## Path to Decision-Support Tier
Pending successful processing of real data batches alongside manual Founder review, before production gating.
