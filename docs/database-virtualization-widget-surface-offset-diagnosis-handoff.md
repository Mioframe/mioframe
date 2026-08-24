# Database virtualization widget surface-offset diagnosis handoff

## Goal

Determine why the top-level Database product scenario still fails on desktop Chromium after the shared deep-state `surfaceOffset` contract was proved correct.

## Confirmed current behavior and evidence

- Shared Storybook browser proof at `e52d6c7bf2397a62c6669078043f874025a0fdc0` passes `deep -> change surfaceOffset while deep -> top -> deep` on the same root/list, including bounded mount count and consistent public/physical geometry.
- `useVirtualCollection.ts` is unchanged; shared production is no longer the current owner candidate.
- Exact-head CI on `dcb72917f2fcd49c58a1caa9f8f6cc7ade58bd4a` still fails the top-level moving-surface product scenario 3/3 on desktop Chromium; Mobile Chrome passes.
- `DatabaseViewWidget` currently derives vertical/horizontal offsets from two `useElementBounding` snapshots plus current root scroll position and refreshes those snapshots from `onMounted`/`onUpdated`.
- VueUse `useElementBounding` documents synchronous bounding-box refresh by default and optional next-frame refresh; sibling layout movement is not itself a durable canonical layout fact.

## Non-goals

- no production correction before diagnosis;
- no shared virtualization or TanStack change;
- no entity geometry fallback;
- no relation-value correction in this pass;
- no MDTable, worker/query/storage, or performance follow-up.

## Affected scenario

Top-level `.database-view`: non-zero success-card extent -> deep range -> dismiss card while deep -> surface moves -> top -> deep.

## Ownership matrix

- widget: owns the top-level root-to-layout offset and is the current diagnosis target;
- shared/entity/feature/page/service/worker: unchanged during diagnosis.

## Source of truth and state shape

Compare, at the same lifecycle points:

1. the actual physical root-to-`DatabaseViewLayout` content-coordinate offset derived from current DOM geometry;
2. the numeric offset value currently supplied by `DatabaseViewWidget` to `DatabaseViewLayout`/`DatabaseDataTable`.

No persistent diagnostic state or public API is allowed.

## Public API / entry points

No public API change. Existing internal props remain the observation path.

## Minimum sufficient design

Use temporary, task-local diagnostic instrumentation in `DatabaseViewWidget` only if necessary to expose the supplied numeric offsets to verifier-managed product E2E output. Instrumentation must be removed before handoff and must not remain in the resulting PR diff.

Capture the offset pair and physical DOM-derived offset at these checkpoints:

- initial top before first deep;
- settled first deep before dismiss;
- immediately after dismiss/layout movement while still deep;
- after returning top;
- immediately before/while the second deep transition fails or succeeds.

Run the owning E2E under the normal focused verifier first. Because the defect is repeatedly CI-profile-specific, a targeted `github-actions` profile run is explicitly allowed for this diagnosis. The normal final branch gate must still use the default local profile.

## Decision rule

- If supplied offsets diverge from the physical DOM-derived offsets at any checkpoint, widget offset production/lifecycle is confirmed as root cause. Return evidence; do not implement the correction in this pass.
- If supplied offsets remain truthful throughout the failing sequence and the product still fails, stop and return evidence: the current architecture assumption is invalid and must be reconsidered before production edits.

## Rejected approaches

- speculative `updateTiming: 'next-frame'`, extra `nextTick`, rAF, observer, or cache reset without numeric evidence;
- adding a permanent `data-*` geometry API solely for tests;
- restoring entity-owned root/table discovery;
- weakening the product E2E.

## Shared UI blast radius

None. Shared production is already proved for the exact deep-state sequence.

## Acceptance matrix

- diagnosis captures supplied and physical offsets at all named checkpoints;
- evidence reproduces the desktop Chromium failure under a verifier-managed run when possible;
- no permanent production/test-only diagnostic surface remains;
- the result selects either widget lifecycle mismatch or architecture reconsideration with concrete numeric evidence.

## Required test proof

Primary product owner remains `tests/e2e/databaseVirtualizationFlows.spec.ts`. The existing moving-surface scenario must not be weakened. Diagnostic logging/assertion support may be temporary only unless it protects a stable observable contract without exposing implementation details.

## Required verification

Focused E2E first. Targeted CI-profile diagnosis is allowed because exact-head CI repeatedly reproduces the defect. No full production branch gate is required until temporary instrumentation has been removed; after cleanup run `pnpm verify --base origin/develop` and report exact result.

## Forbidden

Production correction; shared virtualization changes; `virtualizer.measure()`; permanent diagnostic DOM/API; entity fallback observer; sleeps; timeout inflation; retry-as-success; direct Playwright/Vite/browser commands; mutating Git workflow; relation-value correction in this pass.

## Implementation readiness

- Diagnosis target: resolved.
- Production correction: intentionally unresolved until numeric evidence exists.
- Unresolved blockers before diagnosis: none.
- Verdict: **ready for diagnosis only**.
