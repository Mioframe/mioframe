# Virtual collection API

Status: **architecture accepted; `@tanstack/vue-virtual` selected; minimal shared collection API selected; implementation proof pending**.

This document is the source of truth for Mioframe's reusable virtualization boundary. Database rendering architecture is owned by `docs/database-virtualization.md`; browser capability proof by `docs/database-virtualization-browser-proof.md`.

## Goal

Expose a small, convenient, rendering-topology-independent API for virtualizing one logical collection along one axis without exposing TanStack setup or measurement wiring to consumers.

The API must remove consumer concepts rather than mirror the dependency.

## Selected architecture

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

The shared layer does not render or create DOM. Consumers choose `<div>`, `<li>`, `<tr>`, `<th>`, positioned surfaces, native tables, or other layouts and apply the returned directive to the element that owns one virtual item's measured size.

The directive therefore hides DOM measurement plumbing without owning DOM structure.

## Public API

The initial API is one composable.

Conceptually:

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

useVirtualCollection(source, options)
```

Exact imports/types may use the repository's established Vue type aliases, but the conceptual surface above is fixed.

### Source

`source` is a `MaybeRefOrGetter<readonly T[]>`.

The shared API maps current virtual indexes back to the current source and exposes `value` directly. Consumers must not repeat `source[item.index]` mapping merely to render a virtual item.

### Root

`root` is the explicit physical scroll element. The shared API never discovers a scroll parent through DOM traversal or computed-style heuristics.

A collection instance and its root identity have the same lifetime. Arbitrary live root replacement is not a public contract; recreate/remount the owning collection when composition replaces the physical root.

### Axis

`axis` defaults to `vertical`. `horizontal` uses the same collection contract; no separate horizontal API exists.

### Surface offset

`surfaceOffset` is the current distance, along the collection axis, between the scroll-root origin and the collection surface origin. It maps to the engine's scroll-margin concept.

Public `item.offset`, `leadingSize`, and `trailingSize` remain **collection-surface-relative**, so consumers do not subtract engine-specific margins themselves.

### Result geometry

`totalSize`, `leadingSize`, `trailingSize`, `item.offset`, and `item.size` are presentation geometry only. They are not persisted state.

A consumer may use them as spacer sizes, padding, absolute transforms, grid tracks, table spacer rows/cells, or any other layout it owns.

## Measurement directive

`measure` is a per-`useVirtualCollection` Vue directive instance.

Typical usage:

```ts
const rows = useVirtualCollection(source, options);
const vVirtualRow = rows.measure;
```

```vue
<li v-for="item in rows.items" :key="item.key" v-virtual-row="item">
  ...
</li>
```

The same directive contract must work on table elements:

```vue
<tr v-virtual-row="row">...</tr>
<th v-virtual-column="column">...</th>
```

The directive owns only integration plumbing required to associate the bound virtual item with the actual element and invoke TanStack measurement.

It may set/update TanStack's index attribute internally before calling `measureElement`. Consumers do not bind or know the attribute name.

The directive must refresh association when Vue reuses an element for a different current index/item.

It must not create:

- an element-to-item registry;
- an independent `ResizeObserver`;
- a measured-size cache;
- an offset/range structure;
- a custom cleanup scheduler.

TanStack remains responsible for element observation, disconnected-element cleanup, measured-size caching, offsets, ranges, and scroll correction.

## Ownership

### Shared virtualization

Owns only:

- mapping a reactive logical collection to TanStack count/keys/estimates;
- vertical/horizontal configuration;
- explicit root forwarding;
- optional surface offset and overscan forwarding;
- mapping TanStack virtual items back to `{ index, key, value, offset, size }`;
- collection-relative leading/trailing/total geometry;
- per-instance measurement directive.

### Consumer

Owns:

- markup and layout topology;
- spacer/padding/positioning strategy;
- accessibility semantics;
- sticky/floating surfaces;
- focus/edit/selection behavior;
- presentation-specific sizing policy such as database column grow-only remount minimums.

### TanStack

Owns:

- range calculation;
- estimated/measured geometry;
- `ResizeObserver` behavior;
- stable-key measurement cache;
- scroll correction;
- engine lifecycle.

## Why this boundary is justified

Direct TanStack is fewer shared files but forces each consumer to understand and repeat engine-specific collection mapping and element-measurement wiring.

The previous `useVirtualAxis` wrapper is rejected because it mirrored TanStack options/results and introduced a second vocabulary for the engine.

`useVirtualCollection` instead expresses the consumer problem:

```text
logical collection + root + stable key + estimate
                      ↓
visible values + extents + measurement directive
```

It hides repeated integration plumbing while leaving rendering entirely consumer-owned.

## Deliberately absent

Do not initially expose or implement:

- TanStack virtualizer instance/types;
- direct `measureElement` calls;
- `data-index`/`indexAttribute` in consumer markup;
- `scrollToIndex` or smooth scrolling;
- scroll padding APIs;
- range extractors/pinning;
- `resizeItem`/manual size setters;
- cache reset/persistence;
- generic `VirtualList`, `VirtualTable`, `VirtualGrid` components;
- a two-dimensional coordinator;
- root directives or automatic root discovery;
- validation/error framework beyond what current implementation needs to fail safely during development.

Add a capability only when a current production scenario requires it and the simpler API cannot satisfy that scenario.

## Proof requirement

Because the API owns real browser measurement binding, it requires browser proof.

Shared proof should be narrow:

- large logical collection remains bounded in mounted items;
- directive adds no wrapper DOM and works on ordinary consumer-owned elements;
- dynamic grow/shrink remeasurement works;
- stable-key/index remapping keeps directive measurement associated with the current item;
- collection-relative leading/trailing geometry remains correct after deep scroll;
- unmount/remount does not leave observable stale behavior.

Do not duplicate TanStack's generic test suite or build a generic grid fixture.

Database native-table proof separately exercises the same public API on `<tr>`/`<th>` and owns table-specific geometry.

## Forbidden

- mirroring arbitrary TanStack options/results;
- shared rendering components merely to make virtualization convenient;
- functional/renderless components that clone or constrain consumer VNodes when a directive can bind behavior directly;
- independent observers/caches/range math;
- database knowledge in shared virtualization;
- hidden full-collection measurement;
- abstraction justified by hypothetical future behavior rather than this narrow current contract.

## Readiness

Architecture: **ready**.

Implementation/proof handoff: `docs/database-virtualization-collection-api-handoff.md`.
Implementation preflight: `docs/database-virtualization-collection-api-preflight.md`.
