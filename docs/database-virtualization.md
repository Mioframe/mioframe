# Database virtualization

Status: **shared virtualization architecture accepted provisionally; PR #217 remains blocked by the deep-state surface-movement discriminator and one relation-value loading offset invariant**.

This is the architecture source of truth for PR #217. Older profiling/result documents are historical where they conflict with this file.

Current contracts:

- completed native-table integration correction: `docs/database-virtualization-integration-correction-handoff.md`;
- completed relation cold-bootstrap correction: `docs/database-virtualization-relation-bootstrap-correction-handoff.md`;
- completed branch-E2E proof correction: `docs/database-virtualization-branch-e2e-correction-handoff.md`;
- completed shared frame correction: `docs/md-table-frame-correction-handoff.md`;
- previous dynamic surface-offset correction: `docs/database-virtualization-dynamic-surface-offset-correction-handoff.md` — its widget-owned direction remains preferable to entity discovery, but it did not resolve exact-head CI;
- **active architecture discriminator**: `docs/database-virtualization-deep-state-surface-offset-discriminator-handoff.md`;
- active discriminator preflight: `docs/database-virtualization-deep-state-surface-offset-discriminator-preflight.md`;
- active Database review: `src/entities/databaseData/REVIEW.md`;
- active shared virtualization review: `src/shared/ui/virtualization/REVIEW.md`;
- active relation-value review: `src/features/relationValueEdit/REVIEW.md`;
- shared Table review: `src/shared/ui/Table/REVIEW.md`;
- deferred residual performance work: `docs/database-chrome-jank-follow-up.md`.

## Accepted virtualization architecture

- `@tanstack/vue-virtual` remains the sole virtual-item range/measurement/cache/scroll-correction engine unless the active discriminator proves the current shared boundary cannot satisfy deep-state surface movement.
- `useVirtualCollection` remains the shared one-axis boundary; no production API change is selected before the discriminator.
- Database uses independent row/property virtual collections and native `<table>` rendering.
- Only mounted row × mounted property intersections instantiate expensive outer cells.
- Service/worker remains canonical for row membership/filter/sort/order.
- Existing inline-edit, relation-root, accessibility, dynamic-sizing, sticky-surface, and value ownership remains unchanged.
- Structural boundedness and deep correctness remain required, including 30,000 × 300 without materializing 9,000,000 logical intersections.

## Settled presentation contracts

Leading/trailing row and column spacer DOM exists only when the corresponding virtual distance is greater than zero.

A non-empty logical collection with no mounted virtual items may render only transient `aria-hidden` bootstrap table structure. That structure disappears as soon as TanStack supplies real virtual items and never becomes a second range/measurement owner.

`MDTable` uses one native root-owned outer border/radius; the previous per-row pseudo-element perimeter is removed.

## Current surface-offset ownership direction

The physical scroll-root/composition owner should supply root-to-collection-surface layout facts. `DatabaseDataTable` must not rediscover upper-layer sibling/ancestor topology.

Current top-level implementation flow is:

`DatabaseViewWidget -> DatabaseViewLayout -> DatabaseDataTable -> useVirtualCollection(surfaceOffset) -> TanStack scrollMargin`

The old entity-owned root/table `useElementBounding`, root `MutationObserver`, and `onUpdated` discovery path has been removed. Do not restore it as a fallback.

This implementation direction is **not yet accepted as sufficient**, because exact-head CI still fails the moving-surface product scenario.

TanStack source inspection alone does not justify unconditional cache reset: `scrollMargin` participates in measurement-layout dependencies and the Vue adapter forwards reactive option changes. `virtualizer.measure()` is not an accepted correction before the browser discriminator.

## Active blocker — deep-state surface movement

Exact-head CI on `dcb72917f2fcd49c58a1caa9f8f6cc7ade58bd4a` failed only the top-level moving-surface product scenario on desktop Chromium, initial attempt plus two retries. Mobile Chrome passed.

The product sequence is:

1. non-zero real preceding success-card content;
2. first deep/end virtual range succeeds;
3. preceding content is removed **while the root is still deep**;
4. the table surface physically moves upward;
5. the root returns to top;
6. the second deep transition fails to reach the logical final row.

The current shared browser proof instead performs `deep -> top -> change offset -> deep`. It therefore cannot resolve ownership for the failing lifecycle.

### Required discriminator before any further production patch

On the same physical root and logical collection:

1. start with a non-zero physical pre-surface extent and matching reactive `surfaceOffset`;
2. reach a settled logical tail;
3. while still deep, shrink the physical pre-surface extent and reactive `surfaceOffset`;
4. prove the surface changed and root/list identity is retained;
5. return to top and prove first logical identity;
6. scroll deep again and prove logical tail plus self-consistent public/DOM geometry.

If this shared capability fails with current production shared code, stop and return to architecture for the shared boundary/engine interaction. Do not patch Database/widget code.

If it passes, shared production remains unchanged and the next architecture task is consumer diagnosis of the actual numeric offsets supplied through the top-level widget lifecycle. Do not perform that diagnosis/fix inside the discriminator task.

## Separate blocker — relationValueEdit loading topology

`RelationValueFieldData` currently passes vertical/horizontal zero to `DatabaseDataTable`. Horizontal zero matches the current local root. Vertical zero is not unconditional while a loading progress indicator is rendered before the table in the same `.relation-value-field__data` root.

This remains feature-owned and must be corrected without restoring entity geometry discovery. It is intentionally not part of the active discriminator task.

## Verification workflow

For the discriminator, use focused verifier-managed Storybook behavior first. The task may then run `pnpm verify --base origin/develop` to observe the cumulative branch state; the known moving-surface application E2E remains an unresolved blocker and must not trigger speculative production edits inside the discriminator pass.

For later coding corrections, the normal pre-handoff gate remains:

`pnpm verify --base origin/develop`

Do not force `--profile github-actions` for the normal local branch gate.

## Residual Chromium jank

Residual heterogeneous-content Chrome jank is intentionally deferred to a separate PR and is not a #217 merge blocker.

Retained evidence and the next String-vs-Number/data-density discriminator are recorded in `docs/database-chrome-jank-follow-up.md`.

## Merge criteria

PR #217 may merge only when:

1. the strengthened deep-state shared surface-offset discriminator establishes the correct owner;
2. the repeated top-level moving-surface product scenario passes cleanly without retry;
3. the relation-value loading/zero-offset invariant is truthful;
4. operator inspection confirms Database border/corner/sticky presentation;
5. coding-agent `pnpm verify --base origin/develop` passes cleanly on final code;
6. exact-head GitHub CI is green;
7. final resulting PR review finds no blocker.

## Forbidden before merge

- another Database/widget production patch before the active discriminator result;
- restoring entity-owned ancestor/sibling geometry discovery;
- unconditional `virtualizer.measure()` or cache reset without failed shared capability evidence and a new architecture decision;
- exposing TanStack virtualizer instances;
- second geometry/range/measurement state;
- retry/remount/sleep/timeout/force recovery;
- Database-specific shared virtualization behavior;
- Number/value/query or worker/query/storage performance optimization;
- broad shared-UI redesign unrelated to the confirmed blockers.
