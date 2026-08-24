# Database virtualization

Status: **shared virtualization architecture accepted; PR #217 remains blocked by repeated deep-state surface movement and one relation-value loading offset invariant**.

This is the architecture source of truth for PR #217. Older profiling/result documents are historical where they conflict with this file.

Current contracts:

- completed native-table integration correction: `docs/database-virtualization-integration-correction-handoff.md`;
- completed relation cold-bootstrap correction: `docs/database-virtualization-relation-bootstrap-correction-handoff.md`;
- completed branch-E2E proof correction: `docs/database-virtualization-branch-e2e-correction-handoff.md`;
- completed shared frame correction: `docs/md-table-frame-correction-handoff.md`;
- current dynamic surface-offset architecture: `docs/database-virtualization-dynamic-surface-offset-correction-handoff.md`;
- active Database review: `src/entities/databaseData/REVIEW.md`;
- active shared virtualization review: `src/shared/ui/virtualization/REVIEW.md`;
- active relation-value review: `src/features/relationValueEdit/REVIEW.md`;
- shared Table review: `src/shared/ui/Table/REVIEW.md`;
- deferred residual performance work: `docs/database-chrome-jank-follow-up.md`.

## Accepted virtualization architecture

- `@tanstack/vue-virtual` remains the sole virtual-item range/measurement/cache/scroll-correction engine.
- `useVirtualCollection` remains the shared one-axis boundary.
- Database uses independent row/property virtual collections and native `<table>` rendering.
- Only mounted row × mounted property intersections instantiate expensive outer cells.
- Service/worker remains canonical for row membership/filter/sort/order.
- Existing inline-edit, relation-root, accessibility, dynamic-sizing, sticky-surface, and value ownership remains unchanged.
- Structural boundedness and deep correctness remain required, including 30,000 × 300 without materializing 9,000,000 logical intersections.

## Settled presentation contracts

Leading/trailing row and column spacer DOM exists only when the corresponding virtual distance is greater than zero.

A non-empty logical collection with no mounted virtual items may render only transient `aria-hidden` bootstrap table structure. That structure disappears as soon as TanStack supplies real virtual items and never becomes a second range/measurement owner.

`MDTable` uses one native root-owned outer border/radius; the previous per-row pseudo-element perimeter is removed.

## Surface-offset ownership direction

The physical scroll-root/composition owner supplies root-to-collection-surface layout facts. `DatabaseDataTable` must not rediscover upper-layer sibling/ancestor topology.

Current top-level flow is:

`DatabaseViewWidget -> DatabaseViewLayout -> DatabaseDataTable -> useVirtualCollection(surfaceOffset) -> TanStack scrollMargin`

The old entity-owned root/table `useElementBounding`, root `MutationObserver`, and `onUpdated` discovery path has been removed. Do not restore it as a fallback.

TanStack source inspection still does not justify unconditional cache reset: `scrollMargin` participates in measurement-layout dependencies and the Vue adapter forwards reactive option changes. `virtualizer.measure()` is not an accepted default correction.

## Reopened blocker — deep-state surface movement

Exact-head CI on `dcb72917f2fcd49c58a1caa9f8f6cc7ade58bd4a` again failed only the top-level moving-surface product scenario on desktop Chromium, initial attempt plus two retries. Mobile Chrome passed.

The important sequence is:

1. non-zero real preceding success-card content;
2. first deep/end virtual range succeeds;
3. preceding content is removed **while the root is still deep**;
4. the table surface physically moves upward;
5. the root returns to top;
6. the second deep transition fails to reach the logical final row.

The current shared dynamic `surfaceOffset` proof is insufficient because it performs `deep -> top -> change offset -> deep`. It does not exercise `deep -> change offset while deep -> top -> deep`.

Therefore no further Database/widget production patch is selected yet.

Required discriminator:

- strengthen the existing shared browser capability on the same physical root/list;
- enter a deep logical range;
- change physical pre-surface extent and reactive `surfaceOffset` while still deep;
- prove physical movement;
- return to top and prove first logical identity;
- scroll deep again and prove logical tail plus self-consistent public/DOM geometry.

If that shared capability fails, stop and reconsider shared boundary/engine interaction before any consumer workaround.

If it passes, the remaining defect is consumer-owned and must be diagnosed by observing the actual numeric offsets supplied by the widget through the same product lifecycle.

## Separate blocker — relationValueEdit loading topology

`RelationValueFieldData` currently passes vertical/horizontal zero to `DatabaseDataTable`. Horizontal zero matches the current local root. Vertical zero is not unconditional while a loading progress indicator is rendered before the table in the same `.relation-value-field__data` root.

This remains feature-owned and must be corrected without restoring entity geometry discovery. Prefer mutually exclusive loading/table rendering unless an existing product requirement proves that the empty table must stay mounted during the loading-only state.

## Verification workflow

Use focused verifier feedback while implementing. Before coding handoff, the cumulative PR branch gate is mandatory:

`pnpm verify --base origin/develop`

Do not force `--profile github-actions` for the normal local branch gate. An explicit CI-profile run may be used only for a concrete CI-environment diagnosis when the assigned task requires it; it does not replace the normal branch gate.

If the branch gate exposes another PR-caused in-contract failure, fix it, verify narrowly, then rerun the complete branch gate until clean.

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

- restoring entity-owned ancestor/sibling geometry discovery;
- unconditional `virtualizer.measure()` or cache reset without failed shared capability evidence and a new architecture decision;
- exposing TanStack virtualizer instances;
- second geometry/range/measurement state;
- retry/remount/sleep/timeout/force recovery;
- Database-specific shared virtualization behavior;
- Number/value/query or worker/query/storage performance optimization;
- broad shared-UI redesign unrelated to the confirmed blockers.
