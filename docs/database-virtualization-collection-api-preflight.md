# Database virtualization collection API correction preflight

Status: **ready**.

Authoring source: `docs/database-virtualization-collection-api-handoff.md`, `docs/virtualization-library.md`, `docs/database-virtualization.md`, and `docs/database-virtualization-browser-proof.md`.

## Goal

Correct the existing `useVirtualCollection` implementation/proof without changing the accepted architecture or migrating production database rendering.

## Confirmed current state

- `useVirtualCollection` is implemented and is the only shared virtualization API.
- database capability consumes only the shared public entry point and uses actual `MDTable`.
- current browser corpus passes, but several assertions prove DOM effects rather than the public virtual geometry contract.
- production database components remain unchanged.

## Files to update

Shared implementation/proof:

- `src/shared/ui/virtualization/useVirtualCollection.ts`
- `src/shared/ui/virtualization/VirtualCollectionCapabilityFixture.vue`
- `src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts`

Database capability:

- `src/entities/databaseData/DatabaseVirtualizationCapabilityFixture.vue`
- `src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts`

Evidence:

- `docs/database-virtualization-collection-api-result.md`

Update stories only if a new deterministic story variant is necessary for the required proof.

Do not change production database components, `MDTable.vue`, worker/service code, or dependency versions unless consistency is actually broken.

## Shared implementation correction

`readValue()` must validate index bounds independently from the value.

A source such as:

```ts
const source: readonly (string | undefined)[] = ['a', undefined, 'c'];
```

has a valid value at index `1`.

Use an explicit integer/in-bounds check before reading the entry. Do not interpret `undefined` as missing.

Do not add a validation framework or change the public API.

## Shared proof correction

### Observable geometry exposure in fixture

Expose deterministic test-only outputs derived only from the public `useVirtualCollection` result when needed, for example:

- current item `size` by stable key/index;
- current item `offset`;
- `totalSize`;
- `leadingSize`;
- `trailingSize`.

Do not expose the TanStack instance or private state.

### Grow/shrink

For a mounted vertical item:

1. capture DOM height and public item `size` or following public offset;
2. grow content;
3. prove DOM height grows;
4. prove public virtual geometry grows accordingly;
5. shrink content;
6. prove both DOM height and public geometry shrink again.

The test must fail if only DOM layout changes while measurement state stays stale.

For horizontal dynamic growth, likewise prove public item `size` changes, not only `boundingBox().width`.

### Stable-key remap

Use one stable item identity.

1. grow and prove its public `size`;
2. reorder so the stable item moves to another index;
3. scroll it back into range;
4. verify returned `{ key, index, value }` reflects the new position;
5. grow it again;
6. prove its public geometry increases at the new index.

Do not use physical height alone as the final proof.

### `surfaceOffset`

Add a deterministic non-zero `surfaceOffset` scenario.

Prove:

- public item `offset` is collection-surface-relative rather than root-relative;
- `leadingSize` is collection-relative;
- `totalSize` remains the collection extent;
- `trailingSize` remains correct;
- no consumer subtracts engine scroll margin manually.

Use actual layout content before the virtual collection or another faithful browser setup so the non-zero offset corresponds to a real collection surface position.

### Deep extents

At deep scroll, assert both:

- materially large/correct `leadingSize`;
- `trailingSize` consistent with the last mounted item's public `offset + size` and `totalSize`.

Do not inspect TanStack internals.

### Source value contract

Add the lowest faithful proof that a valid `undefined` source entry can participate in the collection without `RangeError` and with the correct stable key/value semantics. Use unit proof only if that contract can be proven faithfully without browser behavior; otherwise keep it in the shared fixture/spec.

## Database proof correction

### Row grow/shrink

In addition to `<tr>` bounding geometry, expose/observe the matching public row item geometry.

Prove:

- row public `size` grows after content growth;
- row public `size` shrinks after content shrink;
- subsequent row offset/total extent changes consistently when useful.

This corrected assertion must run in Chromium and the narrow Firefox project.

### Column body-driven growth

Prove all of:

1. header text does not change;
2. body content widens the native column;
3. `<th>` physical width grows;
4. corresponding public column item `size` grows.

### Column remount minimum

Correct the existing false-positive path:

1. widen one visible property through body content;
2. wait until public column `size` reflects the larger width;
3. record that public size;
4. scroll the property completely out of range;
5. while it is unmounted, remove/reset the body-content widening condition;
6. scroll back;
7. prove the property remounts with `min-width` from the previously measured public `size` and remains within tolerance of the recorded width.

The test must fail if native body content alone is responsible for the remounted width.

### Bounded cell work

Count actual mounted logical data cells explicitly, excluding spacer cells.

At initial range and after deep 2D scrolling prove:

- mounted rows are bounded;
- mounted columns are bounded;
- mounted data cells are bounded by approximately mounted rows × mounted columns and are far below the 5,000 × 300 logical cross product.

Use a deterministic generous upper bound derived from fixture viewport/overscan rather than an exact incidental count.

### Above-viewport anchor correction

Add a deterministic scenario:

1. scroll to a position where a measured row is above the viewport and a stable visible anchor row can be identified;
2. resize the above-viewport row;
3. prove virtual geometry updates;
4. prove the visible anchor's viewport position changes by less than one representative row height / the documented bounded tolerance.

Do not require pixel-exact anchoring.

Run this in Chromium and Firefox because the database capability spec is the same narrow cross-engine proof owner.

## Existing accepted behavior to preserve

- actual `MDTable` usage;
- dedicated fixed-size wrapper as the one physical scroll root;
- phantom min-content horizontal spacer normalization where required;
- 5,000 × 300 logical fixture scale;
- shared header/body property range;
- native table accessibility semantics;
- Firefox project matched only to the database capability spec;
- no direct TanStack import from `databaseData`.

## TEST IMPACT

- Shared geometry contract: primary owner `VirtualCollectionCapability.browser.spec.ts` in Chromium.
- Valid `undefined` source value: lowest faithful unit or shared-browser proof.
- Shared `surfaceOffset`/leading/trailing geometry: shared browser proof.
- Shared remap measurement: shared browser proof using public geometry.
- Database dynamic row/column measurement: database browser proof in Chromium + Firefox using public geometry plus DOM geometry.
- Database bounded 2D work: database browser proof including explicit mounted-cell count.
- Database column remount minimum: database browser proof with widening content removed before remount.
- Above-viewport scroll correction: database browser proof in Chromium + Firefox.
- Product E2E/performance timing remains deferred.

## Verification

Run verifier-managed focused checks for every changed file, including at minimum:

```bash
pnpm verify --only type-check --files \
  src/shared/ui/virtualization/useVirtualCollection.ts \
  src/shared/ui/virtualization/VirtualCollectionCapabilityFixture.vue \
  src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts \
  src/entities/databaseData/DatabaseVirtualizationCapabilityFixture.vue \
  src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts

pnpm verify --only storybook-behavior --files \
  src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts \
  src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts
```

Run the verifier-selected unit lane if a focused unit test is added for the generic source-value contract.

Run applicable storybook-build/static, format, ESLint/Oxlint checks and final `pnpm verify` when focused planning does not cover the complete correction diff.

Do not rely on retries, sleeps, force, or timeout inflation.

## Result artifact

Rewrite `docs/database-virtualization-collection-api-result.md` from the final evidence.

It must include:

- exact final test counts/outcomes;
- PASS/FAIL for public-geometry grow/shrink;
- PASS/FAIL for post-remap public geometry;
- PASS/FAIL for non-zero `surfaceOffset` and `trailingSize`;
- PASS/FAIL for valid `undefined` source values;
- PASS/FAIL for public column size growth and remount minimum after widening content is removed;
- PASS/FAIL for bounded mounted data-cell count;
- PASS/FAIL for above-viewport anchor stability;
- Chromium/Firefox results;
- retained native-table normalization;
- final `ready` or `not ready` verdict.

Do not retain the previous `Ready` verdict unless every corrected contract passes.

## Forbidden

- public API expansion;
- TanStack instance/private cache exposure;
- tests that prove only DOM size while claiming virtual measurement correctness;
- independent observer/cache/registry/range state;
- production database migration;
- worker/query/paging/index changes;
- fallback rendering architecture work;
- broad retries, sleeps, force, or timeout inflation.

## Stop conditions

Stop and record `not ready` if any corrected public-geometry contract cannot be proven without exposing TanStack internals or adding a second lifecycle/geometry system.
