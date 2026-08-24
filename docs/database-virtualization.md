# Database virtualization

Status: **shared virtualization architecture accepted; PR #217 remains blocked by top-level surface-offset correctness, one relation-value loading offset invariant, and a sticky action/header presentation defect**.

This is the architecture source of truth for PR #217. Older profiling/result documents are historical where they conflict with this file.

## PR #217 scope

This PR finishes Database virtualization itself.

In scope until merge:

- bounded row/property rendering;
- deep-range correctness and physical-root/surface geometry;
- top-level and nested relation roots;
- native-table spacer/bootstrap integration;
- sticky header/action behavior;
- accessibility and logical ARIA contracts;
- presentation regressions introduced or exposed by the virtualization/native-table migration.

Out of scope after those contracts are correct:

- remaining heterogeneous-content Chromium freezes/jank;
- value-type-specific rendering cost investigation;
- other causes of Short -> Full or scrolling stalls that are not caused by virtualization correctness/integration.

Those performance investigations remain owned by `docs/database-chrome-jank-follow-up.md` and will be handled in later PRs. Do not keep PR #217 open to optimize unrelated residual jank after virtualization is complete.

Current contracts:

- completed native-table integration correction: `docs/database-virtualization-integration-correction-handoff.md`;
- completed relation cold-bootstrap correction: `docs/database-virtualization-relation-bootstrap-correction-handoff.md`;
- completed branch-E2E proof correction: `docs/database-virtualization-branch-e2e-correction-handoff.md`;
- completed shared frame correction: `docs/md-table-frame-correction-handoff.md`;
- completed deep-state shared discriminator: `docs/database-virtualization-deep-state-surface-offset-discriminator-handoff.md`;
- active top-level diagnosis: `docs/database-virtualization-widget-surface-offset-diagnosis-handoff.md`;
- active diagnosis preflight: `docs/database-virtualization-widget-surface-offset-diagnosis-preflight.md`;
- active Database review: `src/entities/databaseData/REVIEW.md`;
- shared virtualization review: `src/shared/ui/virtualization/REVIEW.md`;
- active relation-value review: `src/features/relationValueEdit/REVIEW.md`;
- shared Table review: `src/shared/ui/Table/REVIEW.md`;
- deferred residual performance work: `docs/database-chrome-jank-follow-up.md`.

## Accepted virtualization architecture

- `@tanstack/vue-virtual` is the sole virtual-item range/measurement/cache/scroll-correction engine.
- `useVirtualCollection` remains the shared one-axis boundary with its current public API.
- Database uses independent row/property virtual collections and native `<table>` rendering.
- Only mounted row × mounted property intersections instantiate expensive outer cells.
- Service/worker remains canonical for row membership/filter/sort/order.
- Existing inline-edit, relation-root, accessibility, dynamic-sizing, sticky-surface, and value ownership remains unchanged.
- Structural boundedness and deep correctness remain required, including 30,000 × 300 without materializing 9,000,000 logical intersections.

## Settled presentation contracts

Leading/trailing row and column spacer DOM exists only when the corresponding virtual distance is greater than zero.

A non-empty logical collection with no mounted virtual items may render only transient `aria-hidden` bootstrap table structure. It disappears when TanStack supplies real virtual items and never becomes a second range/measurement owner.

`MDTable` uses one native root-owned outer border/radius; the previous per-row pseudo-element perimeter is removed.

## Shared deep-state surfaceOffset contract — accepted

The reusable browser capability proves:

`deep -> change physical pre-surface extent + reactive surfaceOffset while still deep -> top -> deep`.

On the same root/list it changes approximately 240px -> 96px, reaches logical tail `9999` before and after, recovers item `0` at top, keeps mounted work bounded, and proves self-consistent leading/trailing/total geometry and physical scroll extent.

`useVirtualCollection.ts` remains unchanged. No shared/TanStack production correction, `virtualizer.measure()`, cache-reset protocol, or virtualizer exposure is justified by current evidence.

## Current top-level ownership direction

The physical scroll-root/composition owner supplies root-to-collection-surface layout facts. `DatabaseDataTable` must not rediscover upper-layer sibling/ancestor topology.

Current implementation flow:

`DatabaseViewWidget -> DatabaseViewLayout -> DatabaseDataTable -> useVirtualCollection(surfaceOffset) -> TanStack scrollMargin`

The removed entity root/table `useElementBounding`, root `MutationObserver`, and ancestor/sibling discovery path must not return as fallback.

## Active correctness blocker — top-level widget numeric offset lifecycle

Exact-head CI previously reproduced the moving-surface product scenario failure 3/3 on desktop Chromium while Mobile Chrome passed. A later architect-head CI run passed, but production code did not correct this defect between those runs, so the known instability remains unresolved.

The required evidence is consumer-side: compare the numeric offset supplied by `DatabaseViewWidget` with the actual DOM-derived root-to-`DatabaseViewLayout` offset at:

1. initial top;
2. settled first deep;
3. immediately after success-card dismiss while still deep;
4. returned top;
5. second deep attempt.

Current widget production derives offsets from two `useElementBounding` states plus current root scroll position and refreshes the bounds from `onMounted` / `onUpdated`. This is a diagnosis target, not yet a confirmed root cause.

Decision rule:

- supplied offsets diverge from physical offsets -> widget offset production/lifecycle owns the correction;
- supplied offsets remain truthful throughout a reproduced failure -> stop and reconsider architecture before production edits.

Do not speculate with `next-frame`, `nextTick`, rAF, extra observers, or cache reset before numeric evidence.

## Presentation blocker — sticky body action cells cover the sticky header

Operator inspection confirms that a body action cell can render above the fixed header during scrolling.

The current stacking model explains the defect:

- shared `MDTable thead` is sticky at `z-index: 1`;
- every `DatabaseDataTable` action cell is sticky at `z-index: 2`;
- the action header cell uses a higher local z-index, but it remains inside the `thead` stacking context and cannot make ordinary header cells outrank body action cells.

Owner: `DatabaseDataTable` integration, not shared `MDTable` by default.

Required final behavior:

- sticky body action cells overlay ordinary body cells horizontally;
- the entire sticky header remains above body action cells vertically;
- the sticky header action intersection remains above sibling header cells when horizontally scrolled.

Use the minimum local stacking correction unless browser proof shows shared Table ownership must change.

## Separate correctness blocker — relationValueEdit loading topology

`RelationValueFieldData` passes vertical/horizontal zero to `DatabaseDataTable`. Horizontal zero matches the current local root. Vertical zero is not unconditional while a loading progress indicator is rendered before the table in the same `.relation-value-field__data` root.

This remains feature-owned and must be corrected without restoring entity geometry discovery. It remains part of completing virtualization correctness in PR #217.

## Verification workflow

For the active top-level diagnosis use focused verifier feedback first. Because the historical defect is specific to GitHub Actions Chromium conditions, a targeted focused `--profile github-actions` run is allowed for diagnosis only when the normal profile does not reproduce it.

The ordinary pre-handoff branch gate remains:

`pnpm verify --base origin/develop`

Do not force `--profile github-actions` on that normal final branch gate.

## Residual Chromium jank

Residual heterogeneous-content Chrome jank is intentionally deferred to later PRs and is not a #217 merge blocker once virtualization correctness and integration are complete.

Retained evidence and future discriminators are recorded in `docs/database-chrome-jank-follow-up.md`.

## Merge criteria

PR #217 may merge only when:

1. top-level numeric offset investigation resolves the known moving-surface correctness risk;
2. the moving-surface product scenario is stable without retry acceptance;
3. relation-value loading/zero-offset invariant is truthful;
4. body action cells never cover the sticky header and sticky intersection behavior is correct;
5. operator inspection confirms Database border/corner/sticky presentation;
6. coding-agent `pnpm verify --base origin/develop` passes cleanly on final code;
7. exact-head GitHub CI is green;
8. final resulting PR review finds no blocker.

Residual non-virtualization jank is explicitly not a merge criterion for #217.

## Forbidden before merge

- expanding #217 into unrelated residual performance optimization;
- speculative top-level production correction before numeric diagnosis;
- restoring entity-owned ancestor/sibling geometry discovery;
- shared virtualization/TanStack changes without new contrary evidence;
- unconditional `virtualizer.measure()` or cache reset;
- exposing TanStack virtualizer instances;
- second geometry/range/measurement state;
- retry/remount/sleep/timeout/force recovery;
- Number/value/query or worker/query/storage performance optimization;
- broad shared-UI redesign unrelated to confirmed virtualization blockers.
