# Database virtualization

Status: **shared virtualization architecture accepted; PR #217 remains blocked by the top-level widget surface-offset diagnosis and one relation-value loading offset invariant**.

This is the architecture source of truth for PR #217. Older profiling/result documents are historical where they conflict with this file.

Current contracts:

- completed native-table integration correction: `docs/database-virtualization-integration-correction-handoff.md`;
- completed relation cold-bootstrap correction: `docs/database-virtualization-relation-bootstrap-correction-handoff.md`;
- completed branch-E2E proof correction: `docs/database-virtualization-branch-e2e-correction-handoff.md`;
- completed shared frame correction: `docs/md-table-frame-correction-handoff.md`;
- completed deep-state shared discriminator: `docs/database-virtualization-deep-state-surface-offset-discriminator-handoff.md`;
- **active top-level diagnosis**: `docs/database-virtualization-widget-surface-offset-diagnosis-handoff.md`;
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

The reusable browser capability now proves the exact lifecycle that the product failure exercises:

`deep -> change physical pre-surface extent + reactive surfaceOffset while still deep -> top -> deep`.

On the same root/list it changes approximately 240px -> 96px, reaches logical tail `9999` before and after, recovers item `0` at top, keeps mounted work bounded, and proves self-consistent leading/trailing/total geometry and physical scroll extent.

`useVirtualCollection.ts` remains unchanged. Therefore no shared/TanStack production correction, `virtualizer.measure()`, cache-reset protocol, or virtualizer exposure is justified by the current evidence.

## Current top-level ownership direction

The physical scroll-root/composition owner supplies root-to-collection-surface layout facts. `DatabaseDataTable` must not rediscover upper-layer sibling/ancestor topology.

Current implementation flow:

`DatabaseViewWidget -> DatabaseViewLayout -> DatabaseDataTable -> useVirtualCollection(surfaceOffset) -> TanStack scrollMargin`

The removed entity root/table `useElementBounding`, root `MutationObserver`, and ancestor/sibling discovery path must not return as fallback.

## Active blocker — top-level widget numeric offset lifecycle

Exact-head CI on `dcb72917f2fcd49c58a1caa9f8f6cc7ade58bd4a` still failed the moving-surface product scenario 3/3 on desktop Chromium while Mobile Chrome passed.

Because shared behavior is now proved, the next required evidence is consumer-side: compare the numeric vertical/horizontal offset supplied by `DatabaseViewWidget` with the actual DOM-derived root-to-`DatabaseViewLayout` offset at the same product checkpoints:

1. initial top;
2. settled first deep;
3. immediately after success-card dismiss while still deep;
4. returned top;
5. second deep attempt.

Current widget production derives offsets from two `useElementBounding` states plus current root scroll position and refreshes the bounds from `onMounted` / `onUpdated`. This is the current diagnosis target, not yet a confirmed root cause.

Decision rule:

- if supplied offsets diverge from physical offsets, widget offset production/lifecycle owns the correction;
- if supplied offsets remain truthful throughout a reproduced failure, stop and reconsider architecture before production edits.

Do not speculate with `next-frame`, `nextTick`, rAF, extra observers, or cache reset before numeric evidence.

## Separate blocker — relationValueEdit loading topology

`RelationValueFieldData` passes vertical/horizontal zero to `DatabaseDataTable`. Horizontal zero matches the current local root. Vertical zero is not unconditional while a loading progress indicator is rendered before the table in the same `.relation-value-field__data` root.

This remains feature-owned and must be corrected without restoring entity geometry discovery. It is deferred until the primary top-level diagnosis resolves.

## Verification workflow

For the active diagnosis use the focused verifier first. Because the defect is repeatedly specific to GitHub Actions Chromium conditions, a targeted focused `--profile github-actions` run is allowed for diagnosis only when the normal profile does not reproduce it.

The ordinary pre-handoff branch gate remains:

`pnpm verify --base origin/develop`

Do not force `--profile github-actions` on that normal final branch gate.

## Residual Chromium jank

Residual heterogeneous-content Chrome jank is intentionally deferred to a separate PR and is not a #217 merge blocker.

Retained evidence and the next String-vs-Number/data-density discriminator are recorded in `docs/database-chrome-jank-follow-up.md`.

## Merge criteria

PR #217 may merge only when:

1. top-level numeric offset diagnosis leads to a verified correction or architecture decision;
2. repeated moving-surface product E2E passes cleanly without retry;
3. relation-value loading/zero-offset invariant is truthful;
4. operator inspection confirms Database border/corner/sticky presentation;
5. coding-agent `pnpm verify --base origin/develop` passes cleanly on final code;
6. exact-head GitHub CI is green;
7. final resulting PR review finds no blocker.

## Forbidden before merge

- speculative top-level production correction before numeric diagnosis;
- restoring entity-owned ancestor/sibling geometry discovery;
- shared virtualization/TanStack changes without new contrary evidence;
- unconditional `virtualizer.measure()` or cache reset;
- exposing TanStack virtualizer instances;
- second geometry/range/measurement state;
- retry/remount/sleep/timeout/force recovery;
- Number/value/query or worker/query/storage performance optimization;
- broad shared-UI redesign unrelated to confirmed blockers.
