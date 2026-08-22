# Database virtualization collection API implementation preflight

Status: **ready**.

Authoring source: `docs/database-virtualization-collection-api-handoff.md`, `docs/virtualization-library.md`, `docs/database-virtualization.md`, and `docs/database-virtualization-browser-proof.md`.

## Goal

Replace the current `useVirtualAxis` capability implementation with the selected minimal `useVirtualCollection` API and prove both the shared public contract and the database native-table consumer before production migration.

Do not migrate production database rendering or implement secondary performance optimizations.

## Confirmed current state

- `@tanstack/vue-virtual` is already installed on the selected `3.13.x` line.
- `src/shared/ui/virtualization` currently contains the superseded `useVirtualAxis` adapter plus generic list/grid fixtures/tests.
- `DatabaseVirtualizationCapabilityFixture.vue` currently consumes the old adapter and does not yet represent the final shared API contract.
- Production `DatabaseDataTable.vue` remains unchanged.

## Public API

Create/replace with:

- `src/shared/ui/virtualization/useVirtualCollection.ts`
- `src/shared/ui/virtualization/index.ts`

Conceptual contract:

```ts
import type { ComputedRef, MaybeRefOrGetter, ObjectDirective } from 'vue';

type VirtualCollectionAxis = 'vertical' | 'horizontal';
type VirtualCollectionKey = string | number | bigint;
type EstimateSize<T> = number | ((value: T, index: number) => number);

interface UseVirtualCollectionOptions<T, TKey extends VirtualCollectionKey> {
  root: MaybeRefOrGetter<HTMLElement | null | undefined>;
  key: (value: T, index: number) => TKey;
  estimateSize: EstimateSize<T>;
  axis?: VirtualCollectionAxis;
  overscan?: number;
  surfaceOffset?: MaybeRefOrGetter<number>;
}

interface VirtualCollectionItem<T, TKey extends VirtualCollectionKey> {
  index: number;
  key: TKey;
  value: T;
  offset: number;
  size: number;
}

interface UseVirtualCollectionResult<T, TKey extends VirtualCollectionKey> {
  items: Readonly<ComputedRef<readonly VirtualCollectionItem<T, TKey>[]>>;
  totalSize: Readonly<ComputedRef<number>>;
  leadingSize: Readonly<ComputedRef<number>>;
  trailingSize: Readonly<ComputedRef<number>>;
  measure: ObjectDirective<HTMLElement, VirtualCollectionItem<T, TKey>>;
}

function useVirtualCollection<T, TKey extends VirtualCollectionKey>(
  source: MaybeRefOrGetter<readonly T[]>,
  options: UseVirtualCollectionOptions<T, TKey>,
): UseVirtualCollectionResult<T, TKey>;
```

Use repository naming/type conventions where exact Vue typing requires a type-only equivalent, but do not add public capabilities beyond this contract.

## Internal mapping

Use exactly one TanStack `useVirtualizer` per `useVirtualCollection` call.

Map:

- `count` from current source length;
- `getItemKey(index)` from `options.key(source[index], index)`;
- `getScrollElement` from `options.root` via normal Vue reactivity;
- `horizontal` from `axis === 'horizontal'`;
- `estimateSize(index)` from numeric estimate or `(value, index)` callback;
- `overscan` directly when provided;
- TanStack `scrollMargin` from current `surfaceOffset`.

Returned `items` map current TanStack virtual items back to current source values.

Public `offset` is collection-surface-relative:

```text
virtualItem.start - surfaceOffset
```

`totalSize` is the collection extent.

For a non-empty current virtual range:

```text
leadingSize = first.offset
trailingSize = totalSize - (last.offset + last.size)
```

Clamp only unavoidable floating-point/browser residuals at zero if needed; do not silently normalize arbitrary invalid configuration.

For an empty virtual range, leading/trailing are zero.

## Measurement directive

`measure` is created per composable instance and is the only public element-measurement binding.

Required behavior:

### `mounted`

- receive the bound current `VirtualCollectionItem`;
- set/update the TanStack-required measurement index attribute on the actual element;
- call the owning TanStack virtualizer's `measureElement(element)`.

### `updated`

- refresh the index attribute from the new binding value before measurement;
- call `measureElement(element)` again so Vue element reuse/index remapping cannot preserve stale association.

Do not require the consumer to bind any engine attribute or method.

Do not build explicit element cleanup infrastructure. TanStack remains the element observer/cache owner. The shared browser proof must demonstrate virtual eviction and full fixture remount without stale observable behavior.

Do not add:

- element -> item maps;
- independent ResizeObserver;
- manual `resizeItem` state;
- custom unobserve registry;
- custom range/offset math.

If the installed TanStack/Vue lifecycle proves that the directive cannot safely preserve association without one of those mechanisms, stop and record `not ready` rather than broadening the abstraction.

## Root lifetime

`root` may be null before mount.

The public contract does not promise arbitrary live replacement of one non-null physical root with another while the collection instance remains alive. The collection/root owner should remount/recreate when root identity structurally changes.

Do not add root discovery or root lifecycle machinery.

## Required removal

Delete the superseded shared implementation/proof:

- `src/shared/ui/virtualization/useVirtualAxis.ts`
- `src/shared/ui/virtualization/useVirtualAxis.test.ts`
- `src/shared/ui/virtualization/VirtualAxisListFixture.vue`
- `src/shared/ui/virtualization/VirtualAxisGridFixture.vue`
- `src/shared/ui/virtualization/VirtualizationCapability.stories.ts`
- `src/shared/ui/virtualization/VirtualizationCapability.browser.spec.ts`

Replace `index.ts`; do not keep compatibility aliases for `useVirtualAxis`.

## Shared proof files

Create:

- `src/shared/ui/virtualization/VirtualCollectionCapabilityFixture.vue`
- `src/shared/ui/virtualization/VirtualCollectionCapability.stories.ts`
- `src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts`

Do not create a generic grid fixture.

The shared fixture should use ordinary consumer-owned markup (`<ul>/<li>` or `<div>`) and the returned measurement directive.

Required shared contracts:

1. at least 10,000 logical items with bounded mounted item count;
2. returned visible item values/keys/indices match source truth;
3. directive creates no wrapper DOM and consumer template contains no explicit TanStack measurement binding;
4. one mounted item grows and then shrinks, with observable geometry updating both times;
5. stable-key reorder/remap followed by another resize updates the remapped item at its new index;
6. deep scroll produces materially large `leadingSize` and correct visible logical item identity;
7. unmount/remount of the fixture returns to correct behavior without page errors/stale geometry.

Chromium owns this shared proof.

## Database capability files

Update:

- `src/entities/databaseData/DatabaseVirtualizationCapabilityFixture.vue`
- `src/entities/databaseData/DatabaseVirtualizationCapability.stories.ts`
- `src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts`

The database fixture must import only the shared public virtualization entry point, never `@tanstack/vue-virtual` directly.

Use actual `MDTable`.

Fixture defaults:

- at least 5,000 logical rows;
- at least 300 logical properties;
- one shared physical scroll root;
- synthetic text/body data only;
- viewport small enough that mounted rows/columns/cells are bounded.

Use:

- one vertical `useVirtualCollection` for rows;
- one horizontal `useVirtualCollection` for properties;
- returned row directive on real `<tr>`;
- returned property directive on real `<th>`;
- the exact same `columns.items` for header and all mounted rows;
- top/bottom spacers from row leading/trailing size;
- left/right spacers from property leading/trailing size;
- the previously discovered phantom min-content box only if still required by native table layout.

No per-cell measurement state.

## Dynamic database sizing

### Rows

Provide deterministic controls that let one mounted row:

1. grow substantially;
2. be observed at the larger consumed height;
3. shrink back;
4. be observed at the smaller consumed height.

Use observable browser geometry, not TanStack private cache fields.

### Columns

Change body content only; keep the header label unchanged.

Prove wider body content grows the native column and measured `<th>`.

After the property scrolls outside the virtual range and returns, use returned public item `size` as the remount minimum so width remains stable within a small browser tolerance.

Do not implement live shrink/reset of discovered column width.

## Deep 2D database proof

### Vertical

Programmatically scroll near the vertical end and assert:

- mounted rows remain bounded;
- a logical row near the end is mounted;
- full logical `aria-rowindex` is correct;
- top spacer/leading extent is materially large;
- early rows are not materialized.

### Horizontal

Programmatically scroll near the horizontal end and assert:

- mounted columns/cells remain bounded;
- a logical property near the end (for example index >= 290) is mounted in header and body;
- full logical `aria-colindex` is correct;
- left spacer/leading extent is materially large;
- early properties are no longer mounted;
- header/body property ranges agree.

Merely unmounting an early column is not deep horizontal proof.

## Accessibility

On initial and deep ranges prove:

- native table/row/columnheader/cell semantics;
- complete logical `aria-rowcount`;
- complete logical `aria-colcount`;
- correct logical row/column indices;
- virtual spacer rows/cells excluded from logical semantics.

No ARIA grid conversion.

## Playwright configuration

Update `playwright.storybook.config.ts`:

- Chromium ordinary Storybook behavior discovery remains unchanged and therefore runs both shared/database owner-local browser specs;
- `firefox-virtualization-capability` must match only `src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts`;
- remove references to deleted shared capability files.

Do not broaden Firefox to the full Storybook suite.

## Result artifact

Create `docs/database-virtualization-collection-api-result.md` recording:

- resolved `@tanstack/vue-virtual` and transitive core versions;
- Playwright/Chromium/Firefox versions;
- exact final test counts/outcomes by project;
- shared API contract matrix;
- database native-table contract matrix;
- whether phantom spacer normalization remains required;
- whether Firefox real-`MDTable` dynamic row measurement passes;
- whether the shared implementation stayed free of registry/observer/cache/option-passthrough growth;
- final `ready` or `not ready` verdict.

Do not reuse stale counts/claims from the superseded capability result.

## TEST IMPACT

- Shared public collection/measurement API: primary proof `VirtualCollectionCapability.browser.spec.ts`, Chromium.
- Shared dynamic measurement/remap/lifecycle: same owner-local browser proof.
- Database native-table geometry: primary proof `DatabaseVirtualizationCapability.browser.spec.ts`, Chromium + narrow Firefox.
- Structural scalability: observable bounded mounted item/row/column/cell counts; no wall-clock budget in capability task.
- Accessibility: database browser proof.
- Unit validation/API-shape suite for the old wrapper: removed; do not replace it unless a new pure contract actually requires unit proof.
- Product E2E/performance timing: deferred to production migration.

## Verification

Run verifier-managed checks:

```bash
pnpm verify --only type-check --files \
  src/shared/ui/virtualization/useVirtualCollection.ts \
  src/shared/ui/virtualization/index.ts \
  src/shared/ui/virtualization/VirtualCollectionCapabilityFixture.vue \
  src/shared/ui/virtualization/VirtualCollectionCapability.stories.ts \
  src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts \
  src/entities/databaseData/DatabaseVirtualizationCapabilityFixture.vue \
  src/entities/databaseData/DatabaseVirtualizationCapability.stories.ts \
  src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts \
  playwright.storybook.config.ts

pnpm verify --only storybook-behavior --files \
  src/shared/ui/virtualization/VirtualCollectionCapability.browser.spec.ts \
  src/entities/databaseData/DatabaseVirtualizationCapability.browser.spec.ts

pnpm verify --only storybook-build --files \
  src/shared/ui/virtualization/VirtualCollectionCapability.stories.ts \
  src/entities/databaseData/DatabaseVirtualizationCapability.stories.ts \
  playwright.storybook.config.ts
```

Run applicable format/eslint/oxlint checks and final `pnpm verify` if focused planning does not cover the complete task diff.

## Do not change

- `DatabaseDataTable.vue`;
- `DatabaseViewLayout.vue`;
- `DatabaseViewWidget.vue`;
- `EditableInlineValue.vue`;
- relation production components;
- worker/service code;
- `MDTable.vue` or Material components;
- package dependency versions unless consistency is actually broken.

## Stop conditions

Stop and record `not ready` without inventing another architecture if:

- `useVirtualCollection` needs a second element registry/observer/geometry cache;
- correct behavior requires arbitrary TanStack options to become public;
- the measurement directive cannot preserve correct remapped-item association using engine-owned lifecycle;
- real `MDTable` dynamic `<tr>` geometry cannot work in Firefox without fixed heights or another measurement engine;
- deep horizontal spacer geometry is incorrect in either required engine;
- partial native-table accessibility cannot represent deep logical positions;
- implementation starts growing a generic grid/rendering component or functional VNode wrapper.
