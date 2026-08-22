# Virtual collection

Status: **architecture, public API, implementation, and browser capability proof accepted**.

This README is the source of truth for the reusable library in `src/shared/ui/virtualization`.

Database-specific architecture and performance work remain separate:

- [`docs/database-virtualization.md`](../../../../docs/database-virtualization.md)
- [`docs/database-virtualization-browser-proof.md`](../../../../docs/database-virtualization-browser-proof.md)
- [`docs/database-virtualization-collection-api-result.md`](../../../../docs/database-virtualization-collection-api-result.md)
- [`docs/database-virtualization-profiling.md`](../../../../docs/database-virtualization-profiling.md)

## Purpose

`useVirtualCollection` virtualizes one logical collection along one axis while leaving markup and layout consumer-owned.

```text
@tanstack/vue-virtual
          ↓
shared/ui/virtualization
          ↓
   useVirtualCollection
          │
          ├── visible logical items
          ├── leading/trailing extent
          ├── total extent
          └── per-instance vItem directive
                    ↓
             consumer-owned element
```

The library does not render DOM. Consumers may use `<div>`, `<li>`, `<tr>`, `<th>`, positioned surfaces, native tables, or another layout as long as the physical scroll root and logical axis are explicit.

## Quick start

### Vertical list

```ts
import { useTemplateRef } from 'vue';
import { useVirtualCollection } from '@shared/ui/virtualization';

interface Row {
  id: string;
  label: string;
}

const scrollRoot = useTemplateRef<HTMLElement>('scrollRoot');

const rows = useVirtualCollection(sourceRows, {
  root: () => scrollRoot.value,
  key: (row) => row.id,
  estimateSize: 40,
});

const vVirtualRow = rows.vItem;
```

```vue
<div ref="scrollRoot" class="scroll-root">
  <div :style="{ height: `${rows.leadingSize.value}px` }" />

  <div
    v-for="row in rows.items.value"
    :key="row.key"
    v-virtual-row="row"
  >
    {{ row.value.label }}
  </div>

  <div :style="{ height: `${rows.trailingSize.value}px` }" />
</div>
```

The consumer owns scroll-root CSS, spacer DOM, accessibility, selection, focus, editing, and sticky/floating UI.

### Dynamic size

No extra API is required for items that grow or shrink after mount. Apply `vItem` to the element whose real size owns the virtual item:

```ts
const vVirtualItem = collection.vItem;
```

```vue
<article v-for="item in collection.items.value" :key="item.key" v-virtual-item="item">
  <ExpandableContent :value="item.value" />
</article>
```

TanStack owns `ResizeObserver`, measured-size caching, disconnected-element cleanup, and scroll correction. Do not add a second size map or observer in the consumer.

### Horizontal collection

```ts
const columns = useVirtualCollection(properties, {
  root: () => scrollRoot.value,
  key: (property) => property.id,
  estimateSize: 120,
  axis: 'horizontal',
});
```

Use `columns.leadingSize` and `columns.trailingSize` as horizontal presentation extents. Two independent instances may be composed by a consumer that owns two axes; the library intentionally has no 2D coordinator.

### Collection surface inside a larger scroll root

When the collection starts after other content inside the same physical scroll root:

```ts
const rows = useVirtualCollection(sourceRows, {
  root: () => scrollRoot.value,
  key: (row) => row.id,
  estimateSize: 40,
  surfaceOffset: () => tableOffset.value,
});
```

`item.offset`, `leadingSize`, and `trailingSize` remain collection-surface-relative. Consumers must not subtract TanStack scroll margin themselves.

## Public API

```ts
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
  vItem: ObjectDirective<HTMLElement, VirtualCollectionItem<T, TKey>>;
}
```

### `source`

`MaybeRefOrGetter<readonly T[]>`. The library maps virtual indexes back to the current source and exposes `item.value` directly. A valid source value may itself be `undefined`; index validity is independent of value identity.

### `root`

Explicit physical scroll element. It may be null before mount. The library never discovers a scroll parent through DOM traversal or style heuristics.

A collection instance and its non-null root identity have the same lifetime. If composition replaces the physical root, remount/recreate the owner.

### `key`

Stable logical identity. Measured geometry follows this key across reorder/index remapping.

### `estimateSize`

Initial size in pixels, constant or `(value, index) => number`. Real mounted size replaces the estimate through `vItem`.

### `axis`

Defaults to `vertical`; use `horizontal` for one horizontal logical collection.

### `overscan`

Optional narrow override for work mounted around the visible range. It is not a pinning/range-extractor API.

### `surfaceOffset`

Distance along the active axis from the physical scroll-root origin to the logical collection-surface origin. Public geometry stays surface-relative.

### `items`

Current virtual range only. Each item exposes current `index`, stable `key`, current `value`, surface-relative `offset`, and estimated/measured `size`.

### `leadingSize` / `trailingSize` / `totalSize`

Presentation geometry only. Consumers decide whether to express it as spacers, padding, transforms, grid tracks, table spacer rows/cells, or another layout.

### `vItem`

Per-instance Vue directive applied directly to the consumer-owned measurement element.

```ts
const vVirtualRow = rows.vItem;
```

```vue
<tr v-for="row in rows.items.value" :key="row.key" v-virtual-row="row">
  ...
</tr>
```

The directive owns the private engine index marker and measurement call. Consumers do not bind TanStack attributes or call `measureElement`.

## When to use

Use `useVirtualCollection` when:

- there is one logical collection;
- virtualization is along one axis;
- a physical `HTMLElement` scroll root is explicit;
- rendering/layout remains consumer-owned;
- items may require real browser measurement.

Two independent instances are valid for independently virtualized axes such as table rows and properties.

## Deliberately unsupported

Do not expand the API for hypothetical reuse. It intentionally does not expose:

- TanStack virtualizer instances/types;
- direct `measureElement` or consumer-owned index attributes;
- `scrollToIndex` / smooth scrolling;
- scroll-padding APIs;
- custom range extractors/pinning;
- lanes/masonry;
- manual `resizeItem` setters;
- cache persistence/reset protocols;
- `VirtualList`, `VirtualTable`, or `VirtualGrid` rendering components;
- a two-dimensional coordinator;
- automatic scroll-parent discovery;
- window/document virtualization as a separate abstraction.

If a concrete production scenario needs one of these, compare the narrowest extension with direct TanStack usage first.

## Performance characteristics

The Mioframe layer does not eagerly clone/map the full logical source into virtual descriptors.

- source length is forwarded as the logical count;
- key and estimate access are index-based;
- Mioframe materializes `VirtualCollectionItem` descriptors only for TanStack's current virtual range;
- no second observer, measured-size cache, element registry, offset structure, or range engine exists;
- rendering DOM is entirely consumer-owned and can remain viewport-bounded.

This bounds expensive Vue/DOM work by viewport/overscan rather than total logical collection size. TanStack still owns logical geometry metadata, so this is not a claim that all memory or engine work is constant in `N`.

Product-level responsiveness must be measured in the real consumer; the shared capability fixture is not a wall-clock benchmark.

## Ownership

**Shared virtualization** owns reactive source-to-count/key/estimate mapping, axis configuration, explicit root/surface-offset/overscan forwarding, public item mapping, extents, and `vItem`.

**Consumer** owns DOM/layout topology, spacer strategy, accessibility, sticky/floating surfaces, focus/edit/selection behavior, and presentation-specific sizing policy.

**TanStack** owns range calculation, geometry, ResizeObserver behavior, measurement cache, disconnected-element cleanup, scroll correction, and engine lifecycle.

## Browser proof

The colocated capability proof is:

- `VirtualCollectionCapabilityFixture.vue`;
- `VirtualCollectionCapability.browser.spec.ts`;
- `VirtualCollectionCapability.stories.ts`.

It covers bounded mounted work, item mapping, grow/shrink measurement, stable-key remapping, non-zero `surfaceOffset`, deep extents, valid `undefined` values, and remount behavior.

The previously intermittent non-zero-`surfaceOffset` proof now reads deep public/DOM geometry in one browser-side snapshot and requires a self-consistent state stable across consecutive observations. The risk-specific `--repeat 10` diagnostic passed with no retries/flaky classification as part of the final 300/300 capability stability executions.

Database-specific native-table proof remains owned by `src/entities/databaseData`.

## Forbidden implementation drift

- arbitrary TanStack option/result mirroring;
- shared rendering components added only for convenience;
- functional/renderless VNode cloning when a directive is sufficient;
- independent observers, caches, registries, or range math;
- database/domain knowledge in shared virtualization;
- hidden full-collection measurement;
- abstraction justified only by hypothetical reuse.

## Readiness

Architecture/public API: **ready**.

Implementation/browser capability proof: **passed**.

Production database migration is a separate consumer stage and has not started. See [`docs/database-virtualization.md`](../../../../docs/database-virtualization.md).