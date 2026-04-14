# Canonical Sync Discipline

This document defines how canonical documents, local mirrors, and subordinate docs stay synchronized across the Sovereign Monad workspace.

## 1. Canonical Authority

The canonical source set lives in `sovereign-monad`.

Canonical documents and artifacts:

- `docs/sovereign_monad_MOF_v2.3.0.md`
- `docs/ECOSYSTEM_BUILD_MAP.md`
- `docs/CANONICAL_SYNC_DISCIPLINE.md`
- `docs/Gnosis_Integrity_Layer_Spec_v1.2.md`
- `DoveCore.sol`
- `Revenue_Router_Specification_—_Phase_1a.pdf`
- `Revenue_Router_Specification_—_Phase_1a.zip`

Rule:

- if any mirror or subordinate doc conflicts with a canonical file, the canonical file wins

## 2. Approved Mirrors

The approved local mirrors live in `monad-mev`.

Mirror set:

- `docs/SOVEREIGN_MONAD_ECOSYSTEM_MASTER_OPERATING_FILE_v2.3.0.md`
- `docs/ECOSYSTEM_BUILD_MAP.md`
- `docs/CANONICAL_SYNC_DISCIPLINE.md`
- `docs/CANDIDATE_STANDARD_KERNEL_V0.md`

Rule:

- mirrors are convenience copies only
- mirrors are never edited as the source of truth
- mirrors are regenerated from `sovereign-monad`
- `monad-mev` mirrors should normally be refreshed only when a real phase, step, or status change has actually been completed
- routine mirror refresh cadence should be at most once per day, unless an urgent accuracy correction is needed

## 3. Subordinate Docs

Subordinate docs may summarize, explain, package, or operationalize canonical material, but they do not override it.

Primary subordinate docs in `monad-mev`:

- `README.md`
- `README.deploy.md`
- `docs/ONE-PAGER.md`
- `docs/PAYMENTS.md`
- `docs/GUARDED-LIVE-PROFILE.md`
- `docs/CANDIDATE_STANDARD_KERNEL_V0.md`
- `risk-engine/MEV_LICENSING_BUILD_GUIDE.md`

Primary subordinate docs in `sovereign-monad`:

- `README.md`
- `docs/CANDIDATE_STANDARD_KERNEL_V0.md`
- `docs/data_buyer_thesis.md`
- `docs/SLOT_SOURCE_HANDOFF.md`

Rule:

- subordinate docs must describe live status, phase, blockers, and maturity in terms that remain consistent with the canonical files

## 4. Required Update Sequence

When canonical content changes, update in this order:

1. edit the canonical document in `sovereign-monad`
2. regenerate all approved mirrors in `monad-mev`
3. update any subordinate docs affected by the canonical change
4. run verification searches for stale claims or mismatched counts
5. commit the canonical change and the regenerated mirrors together when practical

## 5. Verification Requirements

At minimum, verification should confirm:

- mirror files point back to the correct canonical path
- major counts and status labels match between canonical files and mirrors
- subordinate docs do not overstate status beyond the MOF and build map
- known package/test counts are current when explicitly mentioned

Recommended searches:

- `rg -n "17/17|24 tests|canonical|mirror|Phase 1a contracts" -S .`
- `git diff -- docs`

## 6. Operator Commands

From `monad-mev`:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\sync-canonical-mirrors.ps1
```

This command regenerates the approved mirrors from `sovereign-monad`.

Cadence rule:

- do not churn local mirrors throughout the day for partial progress
- update them when completed truth changes
- batch normal mirror refreshes into a single daily sync when practical

## 7. Non-Negotiable Rule

No mirror or subordinate doc is allowed to silently become a competing authority.
