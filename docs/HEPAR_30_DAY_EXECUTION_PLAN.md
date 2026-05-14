# Hepar 30-Day Execution Plan

**Goal by Day 30:** Hepar is generating measurable revenue (Tier 3 forensic reports or paid pilot leads) with the full six-organ system actively contributing.

## Week 1 (Days 1–7): Live-Telemetry & Observability Hardening
*   **Day 1–2:** Add structured logging + Application Insights to every function (`lead-scan`, `proposal-gen`, `outreach`, `followup`, `assessment-trigger`). *(Note: Completed today)*
*   **Day 3–4:** Implement end-to-end tracing (correlation IDs) so every lead can be tracked from scan → enrichment → proposal → outreach.
*   **Day 5–7:** Run first live-telemetry calibration cycles on real protocols (feed real DefiLlama/Tally/Snapshot data). Collect precision/recall and false-positive metrics (per Hepar Monte Carlo Consensus Blueprint §9).

## Week 2 (Days 8–14): Organ Synchronization & First Enriched Output
*   **Day 8–10:** Refine `organ-integration.ts` with error handling, retries, and timeout guards.
*   **Day 11–12:** Add automated quality gates (minimum organ confidence scores before a lead is considered “enriched”).
*   **Day 13–14:** First end-to-end test of enriched leads flowing into `proposal-gen` and `outreach` functions.

## Week 3 (Days 15–21): Tier Promotion Evidence & Data Rail Activation
*   **Day 15–17:** Run 30+ protocol assessments with live telemetry. Package results into Data Rail with LightVerify certification.
*   **Day 18–19:** Prepare first Tier 3 forensic report template (NDA-ready).
*   **Day 20–21:** Activate `enriched-leads` → `proposals` → `outreach` loop with basic follow-up cadence.

## Week 4 (Days 22–30): First Revenue Surface Launch
*   **Day 22–24:** Launch first paid pilot (Tier 3 forensic report) under NDA to one protocol or institutional partner.
*   **Day 25–27:** Activate Cardia guardrails on enriched leads (allocation caps, risk bands).
*   **Day 28–30:** Implement basic monitoring dashboard + founder review queue for all revenue-related flows.

## Success Metric by Day 30
At least one paid engagement or signed pilot + full six-organ enrichment active on every qualified lead.
