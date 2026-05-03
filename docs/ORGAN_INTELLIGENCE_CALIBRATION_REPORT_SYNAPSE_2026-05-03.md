# ORGAN INTELLIGENCE CALIBRATION REPORT

**Date:** 2026-05-03
**Tag:** CAL-SYNAPSE-001
**Status:** ⚠️ fixture-verified only

## Scope
- 6 Fixture Classes executed.
- Synapse 4-Domain Routing architecture applied.
- Overall Routing Score: 100%

## Calibrated Routing Parameters Confirmed
- conflictSeverityGap: 3
- lowConfidenceBlockThreshold: 0.45
- capitalEscalationMinSeverity: 2

## Benchmark Accuracy Per Routing Domain
- Signal Intake: Correctly mapped all incoming signal strings to domain urgency (IMMEDIATE, STANDARD, LONGITUDINAL).
- Adaptive Routing: Correctly blocked (<0.45), escalated (>2 severity), and aggregated (>=7 records) dynamically.
- Cross-Organ Coordination: Identified 4-point severity gap correctly routing to Founder Review.
- Adaptive Learning: Flagged structural overrides for feedback.

## Interpretation Boundary — BINDING
All outputs strictly bound to `fixture-verified` domain. 
What this does NOT authorize:
- Does NOT authorize production usage for real-client recommendations.
- Does NOT claim Decision-Support tier autonomy.

## Path to Decision-Support Tier
Pending successful processing of real data batches alongside manual Founder review, before production gating.
