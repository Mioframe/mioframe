# Virtual collection

Status: **architecture accepted; `@tanstack/vue-virtual` selected; minimal shared collection API selected; implementation/browser capability proof passed**.

This README is the source of truth for Mioframe's reusable virtualization library in `src/shared/ui/virtualization`.

Database-specific rendering architecture, capability evidence, and performance work remain separate:

- [`docs/database-virtualization.md`](../../../../docs/database-virtualization.md) — database integration architecture;
- [`docs/database-virtualization-browser-proof.md`](../../../../docs/database-virtualization-browser-proof.md) — browser capability contract;
- [`docs/database-virtualization-collection-api-result.md`](../../../../docs/database-virtualization-collection-api-result.md) — accepted capability result;
- [`docs/database-virtualization-profiling.md`](../../../../docs/database-virtualization-profiling.md) — product performance plan.

## Purpose

`useVirtualCollection` virtualizes one logical collection along one axis while leaving markup and layout completely consumer-owned.

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
          └── per-instance measurement directive
                    ↓
             consumer-owned element
```

The library does not render DOM. A consumer may use `<div>`, `<li>`, `<tr>`, `<th>`, positioned surfaces, native tables, or another layout as long as one physical scroll root and one logical axis are explicit.

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

const vVirtualRow = rows.measure;
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

The consumer owns scroll-root CSS, spacer DOM, accessibility, selection, focus, editing, and any sticky/floating UI.

### Dynamic item size

No extra API is required for rows that grow or shrink after mount. Apply the returned directive to the element whose real size owns the virtual item:

```vue
<article v-for="item in collection.items.value" :key="item.key" v-virtual-item="item">
  <ExpandableContent :value="item.value" />
</article>
```

TanStack owns `ResizeObserver`, measured-size caching, and scroll correction. Do not add a second size map or observer in the consumer.

### Horizontal collection

```ts
const columns = useVirtualCollection(properties, {
  root: () => scrollRoot.value,
  key: (property) => property.id,
  estimateSize: 120,
  axis: 'horizontal',
});
```

Use `columns.leadingSize` and `columns.trailingSize` as horizontal presentation extents. The same API can be used independently for rows and columns; the library intentionally does not provide a two-dimensional coordinator.

### Collection surface inside a larger scroll root

When the virtual collection starts after other content inside the same physical scroll root, pass the distance from the root origin to the collection surface:

```ts
const rows = useVirtualCollection(sourceRows, {
  root: () => scrollRoot.value,
  key: (row) => row.id,
  estimateSize: 40,
  surfaceOffset: () => tableOffset.value,
});
```

`item.offset`, `leadingSize`, and `trailingSize` remain collection-surface-relative. Consumers must not perform an additional TanStack scroll-margin subtraction.

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
  measure: ObjectDirective<HTMLElement, VirtualCollectionItem<T, TKey>>;
}
```

### `source`

`source` is a `MaybeRefOrGetter<readonly T[]>`.

The library maps current virtual indexes back to the current source and exposes `value` directly. A valid source value may itself be `undefined`; index validity is independent from value identity.

Consumers should render `item.value` rather than repeat `source[item.index]` mapping.

### `root`

The explicit physical scroll element. It may be `null` or `undefined` before mount.

The library never discovers a scroll parent through DOM traversal or computed-style heuristics.

A collection instance and its non-null root identity have the same lifetime. If composition structurally replaces the physical root, remount/recreate the owner rather than treating arbitrary live root replacement as a supported API.

### `key`

Returns stable logical identity for the current source value. Keys are required for measured geometry to follow an item across reorder/index remapping.

### `estimateSize`

Initial size in pixels, either constant or computed from `(value, index)`. Real mounted size replaces the estimate through the measurement directive.

### `axis`

Defaults to `vertical`. Use `horizontal` for one horizontal logical collection.

### `overscan`

Optional narrow override for how much work is mounted around the visible range. Do not use overscan as a substitute for product-specific pinning or range extraction.

### `surfaceOffset`

Current distance along the active axis between the physical scroll-root origin and the logical collection-surface origin.

Public geometry remains surface-relative.

### `items`

Only the current virtual range. Each item exposes:

- `index` — current logical position;
- `key` — stable logical identity;
- `value` — current source value;
- `offset` — collection-relative start position in pixels;
- `size` — current estimated/measured size in pixels.

### `leadingSize` / `trailingSize` / `totalSize`

Presentation geometry only. Consumers may express it as spacer elements, padding, transforms, grid tracks, table spacer rows/cells, or another layout they own.

The library does not prescribe a spacer strategy.

### `measure`

A per-instance Vue directive. Apply it directly to the consumer-owned element whose physical size represents one virtual item.

```ts
const vVirtualRow = rows.measure;
```

```vue
<tr v-for="row in rows.items.value" :key="row.key" v-virtual-row="row">
  ...
</tr>
```

The directive owns the private engine index marker and measurement call. Consumers do not bind TanStack attributes or call `measureElement` directly.

## When to use this library

Use `useVirtualCollection` when all of these are true:

- there is one logical collection;
- virtualization is along one axis;
- a physical `HTMLElement` scroll root is explicit;
- rendering/layout must remain consumer-owned;
- items may need real browser measurement.

Two independent instances are valid when a consumer owns two independent axes, such as database rows and properties.

## Deliberately unsupported

Do not expand the library merely to cover a hypothetical consumer. The initial API intentionally does not expose:

- TanStack virtualizer instances or types;
- direct `measureElement` calls or consumer-owned `data-index`;
- `scrollToIndex` or smooth scrolling;
- scroll-padding APIs;
- custom range extractors or pinned items;
- lanes/masonry;
- manual `resizeItem` setters;
- cache persistence/reset protocols;
- `VirtualList`, `VirtualTable`, or `VirtualGrid` rendering components;
- a two-dimensional coordinator;
- root directives or automatic scroll-parent discovery;
- window/document virtualization as a separate abstraction.

If a concrete production scenario requires one of these, first compare the narrowest extension with direct TanStack usage. Do not turn this API into a mirror of the dependency.

## Performance characteristics

The Mioframe layer does not eagerly clone/map the complete logical source into virtual descriptors.

- source length is forwarded as the logical count;
- key and estimate access are index-based;
- Mioframe materializes `VirtualCollectionItem` descriptors only for `getVirtualItems()` — the current viewport/overscan range;
- no second observer, measured-size cache, element registry, offset structure, or range engine exists;
- rendering DOM is entirely consumer-owned and can remain bounded by the virtual range.

This makes expensive Vue/DOM work viewport-bounded rather than proportional to the full logical collection.

TanStack still owns logical geometry metadata, so this is not a claim that all memory or engine work is constant with respect to total item count. Product-level responsiveness must be measured in the real consumer; the shared capability fixture is not a wall-clock benchmark.

## Ownership

### Shared virtualization

Owns only:

- reactive logical collection → TanStack count/key/estimate mapping;
- vertical/horizontal configuration;
- explicit root and optional surface-offset/overscan forwarding;
- public `{ index, key, value, offset, size }` mapping;
- collection-relative leading/trailing/total geometry;
- per-instance measurement directive.

### Consumer

Owns:

- DOM and layout topology;
- spacer/padding/positioning strategy;
- accessibility semantics;
- sticky/floating surfaces;
- focus/edit/selection behavior;
- presentation-specific sizing policy.

### TanStack

Owns:

- range calculation;
- estimated/measured geometry;
- `ResizeObserver` behavior;
- stable-key measurement cache;
- disconnected-element cleanup;
- scroll correction;
- engine lifecycle.

## Why this boundary exists

Direct TanStack would use fewer shared files, but every consumer would have to repeat engine-specific collection mapping and element-measurement wiring.

The rejected `useVirtualAxis` design mirrored TanStack options/results and created a second vocabulary for the same engine.

`useVirtualCollection` instead describes the consumer problem:

```text
logical collection + root + stable key + estimate
                      ↓
visible values + extents + measurement directive
```

It removes engine concepts from consumers without taking ownership of rendering.

## Browser proof

Because the API owns real browser measurement binding, its contract is protected by the colocated Storybook capability fixture/spec:

- `VirtualCollectionCapabilityFixture.vue`;
- `VirtualCollectionCapability.browser.spec.ts`;
- `VirtualCollectionCapability.stories.ts`.

The proof covers bounded mounted work, current item mapping, grow/shrink remeasurement, stable-key/index remapping, non-zero `surfaceOffset`, deep leading/trailing geometry, valid `undefined` source values, and remount behavior.

Database-specific native `<table>` proof is intentionally owned by `src/entities/databaseData` rather than this library.

## Forbidden implementation drift

- arbitrary TanStack option/result mirroring;
- shared rendering components added only for virtualization convenience;
- functional/renderless VNode cloning when a directive is sufficient;
- independent observers, caches, registries, or range math;
- database/domain knowledge in shared virtualization;
- hidden full-collection measurement;
- abstraction justified only by hypothetical future reuse.

## Readiness

Architecture: **ready**.

`useVirtualCollection` implementation and browser capability proof: **passed**. See [`docs/database-virtualization-collection-api-result.md`](../../../../docs/database-virtualization-collection-api-result.md) for the accepted capability evidence.

Production database migration is a separate consumer stage; see [`docs/database-virtualization.md`](../../../../docs/database-virtualization.md).
