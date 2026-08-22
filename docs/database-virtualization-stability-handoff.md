# Database virtualization capability stability correction handoff

Status: **ready**.

## Goal

Close the two known intermittent Storybook browser proofs without changing the accepted virtualization architecture, `useVirtualCollection` public API, runtime behavior, native-table model, or production database code.

The known intermittent contracts are:

1. shared non-zero `surfaceOffset` deep-scroll geometry;
2. database above-viewport row-resize anchor stability.

Known flaky behavior is failed proof. A later clean rerun does not close either finding.

## Accepted state — do not reopen

The following are already accepted:

- `@tanstack/vue-virtual` is the sole range/measurement/cache engine;
- `useVirtualCollection` is the only Mioframe virtualization API;
- public result surface is `items`, `totalSize`, `leadingSize`, `trailingSize`, `vItem`;
- `vItem` is the accepted per-instance Vue directive name;
- no second observer/cache/range/anchor engine exists;
- shared source/key/value/remap/grow/shrink/unmount behavior is accepted;
- native `MDTable` row/column virtualization architecture is accepted;
- bounded real mounted logical `<td>` DOM proof is accepted;
- production database migration has not started.

This correction must not change runtime code unless deterministic browser evidence demonstrates a real runtime defect. If that happens, stop and return the evidence for architecture review.

## Cause class

Current evidence points to proof timing/snapshot races rather than a `vItem` or runtime regression.

### Shared `surfaceOffset`

After deep scrolling, the current spec waits only for a large `leadingSize`, then reads `totalSize`, `trailingSize`, last-item geometry, and `scrollHeight` through separate browser reads. Those values can belong to different measurement/scroll-settling moments.

The proof must instead observe one synchronous browser-side geometry snapshot and wait for the complete public/DOM invariant to become self-consistent.

### Database anchor

The current spec scrolls, waits only for a non-empty mounted range, and immediately snapshots above-viewport/anchor geometry. That condition can already be true before the requested scroll/range/measurement state has settled.

After resize, the current proof also checks public row-size growth and anchor movement separately. It can therefore either sample anchor geometry before scroll correction settles or succeed before a later correction changes the anchor position.

The proof must establish a stable observable state both before and after the resize.

## Architecture decision

Keep all stabilization inside the two owner-local browser specs.

Use browser-side synchronous snapshots of public/DOM observables. Poll for observable settled conditions; do not wait for Vue internals, TanStack private state, fixed frame counts, or arbitrary delays.

### Shared snapshot

For the deep `surfaceOffset` state, read together at minimum:

- `leadingSize`;
- `totalSize`;
- `trailingSize`;
- current last mounted logical item identity/index;
- that item's public `offset` and `size`;
- viewport `scrollHeight`.

The settled snapshot must prove in the same observation:

- deep leading extent is reached;
- the tail item/range is valid;
- `trailingSize ≈ totalSize - (last.offset + last.size)` using the existing geometry tolerance;
- `scrollHeight ≈ surfaceOffset + totalSize` using the existing structural tolerance.

Do not widen tolerances to hide the race. If needed, require the same logical tail/range and valid invariants across consecutive poll observations before accepting the snapshot.

### Anchor snapshot

After programmatic scroll, obtain one browser-side snapshot containing at minimum:

- actual viewport `scrollTop` and bounds;
- mounted logical row identities and rectangles;
- a fully-above-viewport overscan row candidate;
- a middle overlapping visible anchor row and its Y position.

Do not capture the baseline until the requested scroll position and candidate geometry are settled. A local test helper may retain the previous poll sample and require the same chosen row identities plus stable anchor geometry across consecutive observations.

After growing the above-viewport row, obtain the post-resize state from observable public/DOM data and wait until:

- the same target row's public `data-row-size` has materially increased;
- the chosen visible anchor remains mounted;
- post-resize anchor geometry has settled across consecutive observations.

Only then assert that final anchor movement from the settled pre-resize baseline is below the existing one-row-height tolerance.

This ordering is required so the test cannot pass before TanStack-owned scroll correction finishes.

## Ownership

- `src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts` owns shared `surfaceOffset` proof.
- `src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts` owns native-table anchor proof.
- Fixtures remain deterministic setup only and should not gain test-only lifecycle signals unless public DOM observables are insufficient.
- Production virtualization/runtime code is out of scope unless browser evidence proves a real defect.

## Acceptance criteria

- Both known intermittent contracts are deterministic without retry-pass acceptance.
- Shared deep `surfaceOffset` comparisons come from one self-consistent browser snapshot rather than separate live reads.
- Database anchor baseline is captured only after requested scroll/range/geometry settles.
- Database final anchor assertion is made only after public row-size growth and post-resize anchor geometry settle.
- Existing semantic tolerances are not weakened.
- No sleeps, timeout inflation, force, broad retries, or recovery loops are added.
- No private TanStack state is inspected.
- No production API/runtime behavior changes.
- All other capability browser contracts remain unchanged and green.

## Risk-specific verification

After the correction is stable, run the focused Storybook behavior proof for both owner specs with a bounded repetition diagnostic:

```bash
pnpm verify --only storybook-behavior --files \
  src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts \
  src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts \
  --repeat 10
```

The required result is no failures, retries, or flaky classification. A retry-pass or a failed repetition means the correction is not complete.

Exact-head GitHub CI remains architect-owned final repository verification.

## Forbidden

- changing `useVirtualCollection` or `vItem`;
- changing TanStack integration/runtime lifecycle;
- changing capability fixture behavior merely to signal that a test may continue;
- adding independent measurement/scroll/anchor algorithms;
- inspecting TanStack private caches or instances;
- widening geometry/anchor tolerances to hide instability;
- sleeps or fixed frame-count waits;
- timeout inflation;
- Playwright `force`;
- broad retries or recovery loops;
- accepting a later clean rerun after any known intermittent failure.

## Stop condition

If a deterministic public/DOM snapshot shows that the required geometry itself remains incorrect after settling, stop. Do not patch the test around it; return the exact observable evidence for runtime architecture review.
