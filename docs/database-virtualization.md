# Database virtualization

Status: **virtualization implementation and proofs accepted; PR #217 remains pending operator visual reinspection, exact-head CI, and final resulting-PR review**.

This is the architecture source of truth for PR #217. Older profiling/result documents are historical where they conflict with this file.

## PR #217 scope

This PR finishes Database virtualization itself.

In scope through completion:

- bounded row/property rendering;
- deep-range correctness and physical-root/surface geometry;
- top-level and nested relation roots;
- native-table spacer/bootstrap integration;
- sticky header/action behavior;
- accessibility and logical ARIA contracts;
- presentation regressions introduced or exposed by the virtualization/native-table migration.

Explicitly deferred to later PRs:

- remaining heterogeneous-content Chromium freezes/jank;
- value-type-specific rendering cost investigation;
- other causes of Short -> Full or scrolling stalls that are not caused by virtualization correctness/integration.

Those performance investigations remain owned by `docs/database-chrome-jank-follow-up.md` and are not #217 merge criteria.

## Completed contracts

- native-table integration correction: `docs/database-virtualization-integration-correction-handoff.md`;
- relation cold-bootstrap correction: `docs/database-virtualization-relation-bootstrap-correction-handoff.md`;
- branch-E2E proof correction: `docs/database-virtualization-branch-e2e-correction-handoff.md`;
- shared frame correction: `docs/md-table-frame-correction-handoff.md`;
- deep-state shared discriminator: `docs/database-virtualization-deep-state-surface-offset-discriminator-handoff.md`;
- consolidated completion pass: `docs/database-virtualization-completion-pass-handoff.md`;
- supporting top-level diagnosis: `docs/database-virtualization-widget-surface-offset-diagnosis-handoff.md`.

Current reviews:

- `src/entities/databaseData/REVIEW.md`;
- `src/features/relationValueEdit/REVIEW.md`;
- `src/shared/ui/virtualization/REVIEW.md`;
- `src/shared/ui/Table/REVIEW.md`.

## Accepted virtualization architecture

- `@tanstack/vue-virtual` is the sole virtual-item range/measurement/cache/scroll-correction engine.
- `useVirtualCollection` remains the shared one-axis boundary with its current public API.
- Database uses independent row/property virtual collections and native `<table>` rendering.
- Only mounted row × mounted property intersections instantiate expensive outer cells.
- Physical scroll-root/composition owners supply truthful root-to-collection-surface offsets.
- Service/worker remains canonical for row membership/filter/sort/order.
- Structural boundedness and deep correctness remain required, including 30,000 × 300 without materializing 9,000,000 logical intersections.

Implementation flow:

`DatabaseViewWidget -> DatabaseViewLayout -> DatabaseDataTable -> useVirtualCollection(surfaceOffset) -> TanStack scrollMargin`

The removed entity root/table ancestor/sibling geometry-discovery path must not return.

## Settled presentation contracts

Leading/trailing row and column spacer DOM exists only when the corresponding virtual distance is greater than zero.

A non-empty logical collection with no mounted virtual items may render only transient `aria-hidden` bootstrap table structure. It disappears when TanStack supplies real virtual items and never becomes a second range/measurement owner.

`MDTable` uses one native root-owned outer border/radius with no per-row pseudo-element perimeter.

Database body action cells remain sticky/right below the shared sticky-header plane; the header action intersection remains locally elevated inside the header plane.

## Shared deep-state surfaceOffset contract — accepted

Reusable browser capability proves:

`deep -> change physical pre-surface extent + reactive surfaceOffset while still deep -> top -> deep`

on the same root/list. Both deep phases reach the logical tail, top recovery reaches item `0`, mounted work remains bounded, and public/physical geometry remains consistent.

`useVirtualCollection.ts` remains unchanged. No shared/TanStack production correction, `virtualizer.measure()`, cache-reset protocol, or virtualizer exposure is justified.

## Top-level moving-surface diagnosis — no production defect confirmed

A historical exact-head CI run reproduced the moving-surface product scenario failure 3/3 on desktop Chromium. Later runs passed without a production correction.

The consolidated completion pass performed the required consumer-side numeric diagnosis. The coding agent reports supplied widget offsets matched current physical root-to-`DatabaseViewLayout` offsets at every checkpoint:

- initial top: vertical `178`, horizontal `16`;
- first deep: vertical `178`, horizontal `16`;
- dismiss while deep: vertical `0`, horizontal `16`;
- returned top: vertical `0`, horizontal `16`;
- second deep: vertical `0`, horizontal `16`.

Both deep phases reached logical row `46`; the historical failure was not reproduced; temporary diagnostic instrumentation was removed.

Together with the accepted shared deep-state proof, current evidence does not support another production geometry/cache/lifecycle correction. Do not add timers, extra observers, remounts, cache resets, or shared changes for this historical episode.

Any new exact-head reproduction reopens this finding from the new concrete evidence.

## Relation local-root invariant — resolved

`RelationValueFieldData` now renders the loading progress indicator and `DatabaseDataTable` mutually exclusively. Explicit local `verticalSurfaceOffset=0` and `horizontalSurfaceOffset=0` are truthful whenever the table is mounted.

Owner-local component proof and relevant relation/database E2E are reported green.

## Sticky action/header stacking — resolved

`DatabaseDataTable` body action cells now use local `z-index: 0`, below shared sticky `thead` (`z-index: 1`), while the header action cell remains locally elevated.

The existing sticky native-table application E2E now performs `document.elementFromPoint()` hit-testing after simultaneous vertical + horizontal scrolling and proves:

- body right edge belongs to the sticky body action cell rather than an ordinary value cell;
- top-right header/action intersection belongs to the header action cell rather than a body action cell;
- ordinary header area remains above body action cells.

No shared `MDTable` correction was required.

## Verification evidence

Coding agent reports focused unit/E2E/relation E2E/format/ESLint/Oxlint/type-check green and cumulative:

`pnpm verify --base origin/develop`

passed in one iteration with no remaining local failure.

Exact-head GitHub CI remains the authoritative automatic merge gate. A retry/flaky pass is not accepted. Any new moving-surface reproduction reopens that finding.

## Residual Chromium jank

Residual heterogeneous-content Chrome jank and other non-virtualization freeze causes are intentionally deferred to later PRs and are not #217 merge blockers.

Retained evidence and future discriminators are recorded in `docs/database-chrome-jank-follow-up.md`.

## Remaining merge criteria

PR #217 may merge only when:

1. operator inspection confirms Database border/corner/sticky presentation, including combined vertical + horizontal sticky behavior;
2. exact-head GitHub CI is green without retry/flaky classification;
3. final resulting-PR review finds no blocker.

## Forbidden before merge

- expanding #217 into unrelated residual performance optimization;
- speculative moving-surface production recovery without new failing evidence;
- restoring entity-owned ancestor/sibling geometry discovery;
- shared virtualization/TanStack changes without new contrary evidence;
- unconditional `virtualizer.measure()` or cache reset;
- exposing TanStack virtualizer instances;
- second geometry/range/measurement state;
- retry/remount/sleep/timeout/force recovery;
- Number/value/query or worker/query/storage performance optimization;
- broad shared-UI redesign unrelated to confirmed virtualization blockers.
