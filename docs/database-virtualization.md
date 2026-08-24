# Database virtualization

Status: **accepted virtualization architecture; PR #217 is blocked by the repeated dynamic table-surface movement failure**.

This is the architecture source of truth for PR #217. Older profiling/result documents are historical where they conflict with this file.

Current contracts:

- completed native-table integration: `docs/database-virtualization-integration-correction-handoff.md`;
- completed relation cold-bootstrap correction: `docs/database-virtualization-relation-bootstrap-correction-handoff.md`;
- completed branch-E2E proof correction: `docs/database-virtualization-branch-e2e-correction-handoff.md`;
- completed shared frame correction: `docs/md-table-frame-correction-handoff.md`;
- active dynamic surface correction: `docs/database-virtualization-dynamic-surface-offset-correction-handoff.md`;
- active dynamic surface preflight: `docs/database-virtualization-dynamic-surface-offset-correction-preflight.md`;
- active Database review: `src/entities/databaseData/REVIEW.md`;
- active shared virtualization review: `src/shared/ui/virtualization/REVIEW.md`;
- shared Table review: `src/shared/ui/Table/REVIEW.md`;
- deferred residual performance work: `docs/database-chrome-jank-follow-up.md`.

## Accepted virtualization architecture

- `@tanstack/vue-virtual` is the sole virtual-item range, measurement, measured-size cache, and scroll-correction engine.
- `useVirtualCollection` is the shared one-axis boundary.
- Database composes independent row/property virtual collections with native table rendering.
- Only mounted row × mounted property intersections instantiate expensive value cells.
- Service/worker remains canonical for row membership/filter/sort/order.
- Existing inline-edit, relation, accessibility, dynamic-sizing, sticky-surface, and value ownership remains unchanged.
- Structural boundedness and deep correctness remain required, including 30,000 × 300 without materializing 9,000,000 logical intersections.

Settled boundary invariant:

> Leading/trailing row and column spacer DOM exists only when the corresponding virtual distance is greater than zero.

Cold-bootstrap invariant:

> A non-empty logical collection with no mounted virtual items may render only transient `aria-hidden` bootstrap table structure. It disappears when TanStack supplies real items and never becomes a second range/measurement owner.

## Dynamic collection-surface ownership

The physical scroll-root owner owns layout facts created by composition inside that root.

For Database:

- top-level `DatabaseViewWidget` owns `.database-view` and the content that can precede `DatabaseViewLayout`; therefore it owns the current root-to-Database-layout offset on both axes;
- `DatabaseRelationValueInline` owns its local overflow root and supplies the truthful local offset for its Database layout; with the current unpadded direct-child structure that offset is zero;
- `DatabaseViewLayout` forwards those offsets;
- `DatabaseDataTable` owns virtualization presentation and consumes explicit offsets; it does not discover widget sibling topology through ancestor observers;
- `useVirtualCollection` forwards the reactive `surfaceOffset` to TanStack and keeps public geometry collection-surface-relative;
- TanStack owns the resulting range and item-position calculation.

No persistent second geometry cache is required. The widget may hold the current reactive offsets that represent its own layout fact.

The top-level offset must update when preceding composition changes without replacing the scroll root. Update it from the root/composition owner's render/layout lifecycle and normal bounding/resize observation. Do not measure bounding boxes on every scroll or in a continuous animation-frame loop.

## Why no TanStack cache reset is selected

The repeated CI failure required reconsidering whether dynamic `surfaceOffset` needs explicit engine invalidation.

Current engine evidence does not support adding one:

- TanStack's measurement-layout dependencies include `scrollMargin`;
- changing `scrollMargin` rebuilds item starts from the new margin while retaining measured item sizes in the TanStack-owned cache;
- the Vue adapter watches reactive options and calls `setOptions()` / `_willUpdate()`.

Therefore `virtualizer.measure()` or a Mioframe cache-reset protocol is broader than the current requirement and is rejected unless the new shared capability proof directly demonstrates that the existing engine contract fails.

Before the Database consumer correction is implemented, `VirtualCollectionCapability.browser.spec.ts` must prove a reactive same-root `surfaceOffset` change. If that proof fails with current `useVirtualCollection`, stop for architecture; do not add a Database workaround.

## Shared MDTable presentation

The shared outer-frame defect has been corrected at `2889a1d6598850a4a8886d6d1a7d95a40f8cd1da`:

- one root-owned native border/radius;
- no `tr::before`/`tr::after` perimeter reconstruction;
- `<colgroup>` before `<thead>` is supported;
- final-row corner shaping is singular;
- sticky-header offset derives from the table border width.

Static, visual, and Storybook behavior CI lanes pass for that code head. The current red application E2E is the Database moving-surface contract, not the Table frame. Operator reinspection of real Database corners remains required before merge.

## Current blocker evidence

Exact-head CI on `2889a1d6598850a4a8886d6d1a7d95a40f8cd1da` failed only application E2E:

`tests/e2e/databaseVirtualizationFlows.spec.ts` — `keeps real preceding Database content connected to the table-owned surface range`.

Desktop Chromium failed the initial attempt and both retries. The first top -> deep transition reaches the final logical row. After dismissing the real success card, the table's physical root-relative offset is proven to move upward; after returning to the top, the second deep transition does not reach `aria-rowcount`. Mobile Chrome passes. The remaining 82 application E2E tests pass.

This same scenario failed in an earlier exact-head run, so it is not accepted as flakiness or a proof-only issue.

## Verification workflow

During implementation use focused verifier runs for feedback.

Required proof:

- shared dynamic same-root `surfaceOffset` browser capability;
- complete `tests/e2e/databaseVirtualizationFlows.spec.ts` after the consumer correction;
- persisted relation-filter E2E if Database table production code changes;
- type-check and applicable static checks.

Before coding handoff, the cumulative PR gate is mandatory:

`pnpm verify --base origin/develop`

If it finds another PR-caused in-contract failure, fix it, focused-verify that correction, then rerun the complete branch gate until clean. Do not force `--profile github-actions` locally.

Exact-head GitHub CI remains the final automatic gate.

## Residual Chromium jank

Residual heterogeneous-content Chromium jank remains deferred to a separate PR and is not a #217 blocker. Evidence and next discriminator remain in `docs/database-chrome-jank-follow-up.md`.

Do not add Number-specific, worker/query/storage, Material, or speculative shared-virtualization performance changes to #217.

## Merge criteria

PR #217 may merge only when:

1. the shared dynamic same-root `surfaceOffset` capability proof passes;
2. widget-owned surface geometry replaces entity-owned ancestor/sibling discovery and the moving-surface product scenario is clean without retry;
3. `pnpm verify --base origin/develop` passes on the resulting branch;
4. operator reinspection confirms Database border/corner/sticky presentation;
5. exact-head GitHub CI is green;
6. final full resulting-PR review has no blocker.

## Forbidden before merge

- second geometry/range/measurement cache or virtualizer;
- public exposure of the TanStack virtualizer;
- unconditional `virtualizer.measure()`/cache reset for `surfaceOffset` change;
- entity-owned observation of widget sibling topology as a compatibility path;
- per-scroll or continuous-rAF bounding-box measurement;
- broad/subtree MutationObserver over the virtualized table;
- Database-specific behavior in shared virtualization;
- new Database border/radius framework or MDTable frame rework for the geometry failure;
- Number/value/query or worker/query/storage performance work;
- timeout inflation, sleeps, retry-as-success, remount/force-update recovery, or unrelated cleanup.
