# Database virtualization collection API correction handoff

Status: **ready**.

## Goal

Keep the accepted `useVirtualCollection` architecture and correct the capability proof so it demonstrates the shared geometry contract rather than only DOM resizing side effects.

Production database migration remains out of scope until this correction passes review.

## Confirmed findings

The current implementation boundary is accepted:

- `useVirtualCollection` is the only shared virtualization API;
- consumers do not import TanStack or bind its measurement attributes;
- no second observer/cache/range engine exists;
- database uses the real `MDTable` through the shared API;
- the dedicated wrapper scroll root is a valid native-table integration requirement.

The current proof is incomplete:

1. dynamic grow/shrink tests assert only physical `boundingBox()` changes and therefore do not prove that public virtual geometry updated;
2. stable-key remap proof similarly does not prove post-remap virtual geometry ownership;
3. column remount stability leaves widened body content active, so native table layout can satisfy the assertion without the cached public `size` being effective;
4. bounded 2D proof checks row/column counts but not mounted data-cell count;
5. non-zero `surfaceOffset` and `trailingSize` are public contracts but are not proven;
6. database browser proof requires acceptable anchor stability after an above-viewport row resize but does not currently prove it;
7. `readValue()` incorrectly treats a valid `undefined` source value as an out-of-range index.

## Architecture and ownership

No architecture change.

- Shared virtualization owns only collection mapping, collection-relative geometry, and the per-instance measurement directive.
- TanStack remains sole owner of observation, measured-size cache, ranges, offsets, and scroll correction.
- Database owns table DOM, spacer DOM, column sizing policy, accessibility, and fixture scroll-root topology.
- No explicit directive cleanup registry is required; engine-owned disconnected-element cleanup remains authoritative unless new browser evidence proves otherwise.

## Required correction

### Shared implementation

Fix source bounds checking so `readonly T[]` may legally contain `undefined` values. Check index bounds explicitly instead of using `value === undefined` as the absence test.

Do not change the public API.

### Shared browser proof

Dynamic measurement assertions must prove public virtual geometry in addition to physical DOM geometry.

For grow/shrink, observe at least one of:

- the affected returned item's public `size`;
- a following item's public `offset`;
- `totalSize`, `leadingSize`, or `trailingSize` where that directly represents the changed measurement.

The assertion must fail if DOM content changes but TanStack measurement does not update.

For stable-key reorder/remap:

- resize a stable item;
- reorder so its index changes;
- bring the same stable item back into range;
- resize it again;
- prove the public geometry for the item at its new current index updates correctly.

Add a non-zero `surfaceOffset` scenario and prove public `offset`/`leadingSize`/`trailingSize` stay collection-relative.

Deep-scroll proof must verify both materially large `leadingSize` and meaningful/correct `trailingSize`, not only `leadingSize`.

### Database browser proof

Dynamic `<tr>` and `<th>` tests must prove the relevant public collection geometry changed, not only DOM `boundingBox()`.

Column remount stability must:

1. widen a mounted property through body content;
2. prove public property `size` increased;
3. scroll the property out of range;
4. remove the widening body-content condition while it is unmounted;
5. scroll it back into range;
6. prove the returned public `size` used as `min-width` preserves the previously discovered width within tolerance.

Count mounted data cells explicitly and prove the count remains bounded at the 5,000 × 300 logical fixture scale, including after deep 2D scrolling.

Add an above-viewport row-resize scenario and prove scroll anchoring remains within the documented tolerance; do not require pixel-exact stability.

### Result document

Until these corrections pass, the capability result must remain `not ready` and production migration preflight must remain blocked.

After correction, update exact test counts/outcomes and contract matrix from the final verifier run.

## Acceptance criteria

- public API unchanged;
- `undefined` source entries are valid values when their index is in bounds;
- grow/shrink proves public virtual geometry updates;
- remap + second resize proves geometry follows the stable item at its new index;
- `surfaceOffset` is proven with non-zero input and collection-relative public geometry;
- deep shared proof validates both leading and trailing extent;
- database row/column measurement proof validates public collection geometry;
- column remount test removes the widening content before remount and still preserves width through public `size`;
- mounted cell count is explicitly bounded;
- above-viewport row resize proves acceptable anchor stability;
- Chromium shared/database proof passes;
- Firefox database proof passes for the corrected geometry assertions;
- no second observer/cache/registry/range implementation is introduced.

## Forbidden

- changing the public `useVirtualCollection` API to make tests easier;
- exposing TanStack instance/types/private cache;
- inspecting TanStack private measurement state in tests;
- introducing an independent observer/cache/registry;
- adding generic grid/rendering components;
- changing production database rendering;
- changing worker/query/paging/index behavior;
- weakening proof with sleeps, force, broad retries, or timeout inflation.

## Readiness

Correction scope, ownership, and proof requirements are resolved.

Verdict: **ready for one focused correction round**.
