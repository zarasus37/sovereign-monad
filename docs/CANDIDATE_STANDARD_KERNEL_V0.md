# Candidate Standard Kernel v0

This document records the current internal implementation target for the first
candidate Sovereign Monad standard kernel.

It is subordinate to:

- `docs/sovereign_monad_MOF_v2.3.0.md`
- `docs/ECOSYSTEM_BUILD_MAP.md`

If this document conflicts with the MOF or the build map, the canonical files
win.

This document does not declare a public standard. It freezes the current kernel
candidate for implementation use until either:

- the conformance matrix exposes a concrete failure in the kernel definition, or
- live proof exposes a concrete failure in the kernel definition.

## Freeze Status

Current state:

- frozen as an internal implementation target
- not declared as a public standard
- not yet backed by a full conformance harness
- not yet proven through the live Phase 1a path

## Ordered Kernel

The current candidate kernel is ordered and should be implemented in this
sequence:

1. Implementation honesty
2. Three-speed classification
3. Gate-first declaration
4. Boundary / authority / live-effect / rollback discipline
5. Dove visible-conscience constraint
6. Gnosis retrospective-only constraint
7. Validator separation + rejection logic
8. Live proof requirement

The order matters. Later elements depend on earlier ones.

## Status Legend

- `Satisfied` = present in canon and materially reflected in current artifacts
- `Partial` = canon and/or artifacts exist, but proof or enforcement is incomplete
- `Missing` = not yet represented in repo artifacts strongly enough to treat as conformance-ready

## Conformance Matrix

| # | Kernel element | Canonical anchors | Current repo artifacts | Status | Proof gap | Misread risk |
|---|---|---|---|---|---|---|
| 1 | Implementation honesty | MOF states that sound doctrine and implemented reality are different categories and neither masquerades as the other; current status rollups explicitly distinguish local build-state from live state. | `docs/sovereign_monad_MOF_v2.3.0.md`; `monad-mev/README.md`; `monad-mev/execution-truth-core/README.md`; `monad-mev/ecosystem-state-api/README.md`; `monad-mev/slot-core/docs/SLOT_CORE.md` | Partial | Add a machine-checkable conformance pass that rejects authority-bearing surfaces making live claims without evidence; keep local-vs-live labeling consistent across all authority surfaces. | A builder could mistake repeated `local-only` prose for a sufficient enforcement mechanism, producing interfaces that are described honestly in docs but still consumed downstream as live authority. |
| 2 | Three-speed classification | MOF explicitly classifies Dove, Gnosis, Signal, Oracle, Narrative, Data Rail, DAO, Keys, and Emergence as local analysis/observation surfaces until later phases; current live chain remains Phase 1a first. | `docs/sovereign_monad_MOF_v2.3.0.md`; `docs/ECOSYSTEM_BUILD_MAP.md`; package READMEs in `monad-mev` that state `analysis-only`, `local-analysis-only`, or `does not claim live truth` | Partial | Expose speed classification at every authority-bearing interface where callers could mistake the surface for live truth; add conformance checks for that labeling. | A builder could mistake selective classification in docs for uniform system classification, producing one unlabeled surface that silently acts like live truth. |
| 3 | Gate-first declaration | MOF defines the current build gate and immediate priority chain: live Phase 1a proof, approved-source registration, then execution-truth closure; build map repeats the same live frontier. | `docs/sovereign_monad_MOF_v2.3.0.md`; `docs/ECOSYSTEM_BUILD_MAP.md`; `monad-mev/execution-truth-core`; `monad-mev/cardia-activation-core`; `monad-mev/public-activation-core` | Partial | Add an artifact-backed review surface that requires change sets or proposals to declare the gate they serve instead of relying on operator discipline alone. | A builder could mistake canonical gate ordering in docs for enforced proposal discipline, producing side work that looks valid but does not advance the live chain. |
| 4 | Boundary / authority / live-effect / rollback discipline | Phase 1a invariants define exact routing and pause boundaries; governance owns explicit pause surfaces; the live chain is still capital-gated and downstream activation requires rollback-conscious guarded-live discipline. | `contracts/phase1a/GovernanceController.sol`; `contracts/phase1a/InboundReceiver.sol`; `contracts/phase1a/RevenueRouter.sol`; `contracts/base/RevenueSinkBase.sol`; `scripts/verify-phase1a.js`; `monad-mev/docs/GUARDED-LIVE-ACTIVATION.md`; `monad-mev/execution-truth-core/src/snapshot.ts` | Partial | Surface boundary scope, authority mode, live effect, and rollback/containment explicitly for authority-bearing interfaces; document Phase 1a live rollback/containment paths as concrete operator procedures rather than implied controls. | A builder could mistake the existence of pause functions and guarded-live notes for a complete rollback model, producing a system with control paths but no explicit containment discipline. |
| 5 | Dove visible-conscience constraint | MOF defines Dove as witness/observer, not magical enforcement; Tiered Dove signals are explicit; Dove failure must not halt economic flow; live Dove deployment remains pending Phase 1a proof. | `DoveCore.sol`; `contracts/base/DoveAware.sol`; `contracts/phase1a/DoveRouterObserver.sol`; `contracts/phase1a/RevenueSinkFounder.sol`; `test/phase1a.reconstruction.js`; `test/phase1a.expansion.js`; `monad-mev/dove-integration-core/src/dove.ts` | Partial | Complete live deployment and observer wiring, then verify that live flags, pauses, and evidence trails are reconstructable from actual artifacts rather than local-only interpretation surfaces. | A builder could mistake `Dove exists` for `Dove is reconstructable and non-weaponized in live conditions`, producing a nominal conscience layer with no auditable evidence path. |
| 6 | Gnosis retrospective-only constraint | MOF defines Gnosis as retrospective-only, explicitly prohibits predictive surveillance, and distinguishes it from Dove; local Gnosis exists but live integration is later-phase. | `docs/sovereign_monad_MOF_v2.3.0.md`; `monad-mev/gnosis-core/README.md`; `monad-mev/gnosis-core`; `monad-mev/gnosis-evaluator-core`; `monad-mev/boundary-stress-monitor` | Partial | Add conformance checks that any consumer of Gnosis outputs remains downstream/review-oriented; prove that no live or planned integration uses anticipated scores to suppress valid behavior upstream. | A builder could mistake a retrospective-only local scaffold for a guaranteed architectural property, producing future integrations that quietly convert Gnosis into predictive control. |
| 7 | Validator separation + rejection logic | The MOF requires critical review and honest status reporting, but the detailed validator split and header rejection posture currently live outside the repo by operator choice. | Repo artifact not yet present by design; current enforcement lives in the chat-only shared charter and Addendum A rather than in a repo-backed harness. | Missing | Create a conformance harness, review template, or audit protocol that captures validator separation, header completeness, rejection rules, and arbitration in a reviewable artifact. | A builder could mistake the existence of a chat-only collaboration discipline for a repo-backed control layer, producing inconsistent enforcement whenever the conversation context is missing. |
| 8 | Live proof requirement | MOF explicitly states that live Phase 1a proof is the first capital-gated truth conversion; approved-source registration and execution-truth closure sit behind it; only after full sequence completion should Phase 1a be treated as live. | `scripts/deploy-phase1a.js`; `scripts/verify-phase1a.js`; `deployments/phase1a-progress-*.json`; `monad-mev/execution-truth-core`; `monad-mev/cardia-activation-core`; `monad-mev/public-activation-core` | Partial | Re-fund deployer, complete resumable live deployment proof, register the bootstrap approved source, verify the first live routing path, and record the resulting execution-truth evidence in the downstream blocker surfaces. | A builder could mistake deploy scripts, verification scripts, and blocked downstream readiness packages for completed live proof, producing claims of operational truth before the chain has actually passed the path. |

## Current Conclusion

The candidate kernel is viable and grounded strongly enough to use as an
internal implementation target.

It is not yet a public or externally adoptable standard because:

- conformance is not yet backed by a repo-level harness
- validator separation is still chat-only rather than artifact-backed
- live proof across the Phase 1a path is still incomplete
- rollback / containment is not yet surfaced as a uniform live kernel discipline

## Immediate Next Move

Use this matrix as the first review surface for live-kernel work.

The next implementation step is not to expand the kernel. It is to close proof
gaps against the current live chain:

1. complete live Phase 1a deployment proof
2. register the bootstrap approved source
3. close runtime execution-truth
4. use the resulting evidence to tighten the partial rows above

No expansion of the kernel should occur unless:

- the matrix exposes a concrete enforcement failure, or
- live proof exposes a concrete enforcement failure.
