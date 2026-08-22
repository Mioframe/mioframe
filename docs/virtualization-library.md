# Virtualization library

Status: **architecture accepted; `@tanstack/vue-virtual` selected; integration proof and implementation preflight pending**.

This document is the architecture source of truth for Mioframe's reusable viewport virtualization infrastructure. Database rendering owns its presentation integration in `docs/database-virtualization.md`; performance investigation is defined in `docs/database-virtualization-profiling.md`.

## Goal

Provide one small, upper-layer-independent virtualization primitive for very large scrollable collections whose item sizes may differ and may change after mount.

The invariant is:

> Mounted UI work is bounded by viewport and overscan, not by total logical item count.

## Accepted architecture

The shared library owns **one virtual-axis primitive** implemented as a narrow adapter over **`@tanstack/vue-virtual`**.

```text
@tanstack/vue-virtual
         ↓
shared/ui/virtualization
         ↓
   useVirtualAxis
      ↓       ↓
 future 1D   database
collections    ↓
          vertical axis
               +
          horizontal axis
```

There is no second Mioframe virtualization algorithm, generic grid engine, `VirtualTable`, or `VirtualList` in the initial design.

A two-dimensional surface is consumer composition of two axes. Each axis owns only its own geometry and may use the same or a different physical scroll element from another axis. The top-level database uses one shared two-dimensional scroll root; a nested presentation may use a different horizontal root when its current UI already has a local horizontal scroller.

## Engine decision

`@tanstack/vue-virtual` is selected because the current contract requires capabilities it already owns:

- Vue `useVirtualizer` integration;
- vertical and horizontal axes;
- stable item keys;
- provisional estimates;
- dynamic `measureElement` sizing backed by browser measurement;
- repeated post-mount resize;
- overscan and total/range geometry;
- `scrollToIndex`;
- scroll-position correction when measurements before the viewport change.

The capability proof validates Mioframe's use of this engine. It is not a library comparison.

Reopen the engine decision only if required behavior would otherwise force Mioframe to implement substantial general-purpose virtualization machinery such as its own offset/index tree, range algorithm, resize scheduler, scroll-anchor algorithm, or hidden full-content measurement.

## Ownership

### `src/shared/ui/virtualization`

Owns:

- the only production import boundary for `@tanstack/vue-virtual`;
- mapping the Mioframe axis contract to TanStack;
- virtual range and total-size exposure;
- estimate-to-measurement geometry;
- the TanStack-specific DOM-index association required by dynamic `measureElement`;
- engine-backed resize observation and scroll correction;
- overscan;
- deep-index navigation;
- lifecycle and cleanup of the engine integration;
- domain-agnostic public types.

Must not know:

- database documents/items/properties/views;
- filter/sort/data semantics;
- Material components;
- table/list/card markup;
- selection, focus, or edit state;
- sticky headers/actions;
- persisted sizes;
- paging/loading/business state.

### Consumers

Consumers own:

- logical collection and stable identity;
- physical scroll-container placement;
- item markup and accessibility semantics;
- presentation-specific estimates and CSS size constraints;
- any scroll margin between the virtual surface origin and its scroll root;
- sticky/floating occlusion represented as scroll padding;
- focus, editing, selection, and keyboard behavior.

Consumers do **not** know or emit TanStack's `data-index`/`indexAttribute` convention. Logical index association for element measurement is part of the shared adapter contract.

## Source of truth

The logical collection remains consumer-owned.

The virtualizer owns only ephemeral geometry derived from:

- item count;
- stable keys;
- scroll viewport;
- estimates;
- measured DOM sizes;
- overscan.

The engine measurement cache is the geometry source of truth for the axis. Do not duplicate it in a generic Mioframe cache.

Measurements are not persisted product state.

## Public API

The initial public surface is one composable plus small domain-agnostic types.

Conceptually:

```ts
useVirtualAxis(options)
```

Required options:

- `count` — reactive logical item count;
- `getItemKey(index)` — stable identity for the current logical item;
- `getScrollElement()` — axis scroll element or `null` before mount;
- `orientation` — `vertical` or `horizontal`;
- `estimateSize(index)` — provisional size before authoritative measurement;
- `overscan` — optional narrow consumer override;
- `scrollMargin` — optional reactive offset from scroll-root origin to virtual-surface origin;
- `scrollPaddingStart` / `scrollPaddingEnd` — optional occlusion padding used by deep navigation, for example sticky headers/actions.

Required returned capabilities:

- `virtualItems` — ordered current virtual items;
- `totalSize` — current estimated/measured axis extent;
- `measureElement(index, element)` — associate a rendered logical index with its DOM owner and connect it to TanStack dynamic measurement without exposing TanStack's DOM attribute convention;
- `scrollToIndex(index, options?)` — reach a logical item without mounting all predecessors.

The exact Vue-friendly binding may be an equivalent ref-binder API, for example a function derived for one virtual item, if implementation preflight shows that is cleaner. The architectural requirement is that the consumer supplies logical index + element through a Mioframe API and never manually supplies a TanStack-specific `data-index` attribute.

Conceptual `VirtualItem` fields:

- `index`;
- `key`;
- `start`;
- `size`;
- `end`.

Exact Vue/TypeScript reactive signatures are finalized in implementation preflight.

### Measurement identity boundary

TanStack `measureElement` requires the measured element to carry an index attribute (`data-index` by default, configurable through `indexAttribute`) so the engine can map ResizeObserver measurements to the current logical index.

That convention is an engine implementation detail and must not leak into database or future consumers.

The shared adapter therefore owns one private measurement-index mechanism. A valid implementation may:

1. use a Mioframe-private `indexAttribute` value configured on TanStack;
2. establish/update that private attribute inside the Mioframe measurement binding before delegating to TanStack `measureElement`;
3. let TanStack own subsequent ResizeObserver observation, key lookup, size caching, range updates, and scroll correction.

Do not create a second element→item registry or independent ResizeObserver merely to hide the attribute. The wrapper should adapt the required identity marker with the least additional state.

When Vue ref callbacks receive `null` on unmount, the adapter must forward cleanup semantics required by TanStack without requiring consumers to know the engine lifecycle.

### Deliberately not exposed initially

Do not expose:

- TanStack `Virtualizer` or `VirtualItem` types;
- TanStack `data-index`/`indexAttribute` conventions;
- arbitrary TanStack option passthrough;
- `resizeItem`/generic `setItemSize`;
- measurement-cache reset APIs;
- range-extractor/pinning APIs;
- generic grid coordination.

Those capabilities are added only if a current consumer proves they are required and the simpler DOM-measurement contract is insufficient.

## Dynamic-size contract

Fixed item size is never a correctness requirement.

`estimateSize` is provisional. After an item mounts, DOM measurement is authoritative.

Required behavior:

1. unseen item uses an estimate;
2. consumer binds logical index + mounted element through the Mioframe measurement API;
3. adapter associates the element with TanStack's private index marker and delegates to engine measurement;
4. the item may resize repeatedly through TanStack's observation path;
5. total extent and later offsets update;
6. changes before the viewport use TanStack's supported scroll correction;
7. hidden complete collections are never mounted only to discover sizes.

The adapter must not recreate TanStack's measurement or correction algorithm.

## Stable identity

`getItemKey` is required. Index is position, not identity.

Consumers must keep index-to-key mapping current after filter/reorder/schema changes. The adapter configures TanStack with consumer keys rather than creating a second key registry.

Measurement binding uses current index only to let TanStack resolve the stable key. Measurement lifetime remains keyed by the engine's stable-key cache, not by a Mioframe index cache.

## Scroll-root contract

A virtual axis uses an explicit scroll element supplied by its consumer. It never discovers a scroll owner by walking DOM/CSS heuristically.

The axis must tolerate `null` before mount and clean up when its root changes or the consumer unmounts.

`scrollMargin` exists because a virtual surface can begin after other content inside the same scroll root. The consumer owns calculation of that presentation offset; the shared library only forwards the geometry fact to the engine.

`scrollPaddingStart` and `scrollPaddingEnd` represent current occlusion inside the scroll viewport, such as a sticky header or sticky trailing action surface. They do not create those surfaces.

Two axes may share a scroll root, but the shared library does not require them to.

## Two-axis composition

The shared layer does not create a matrix.

```text
vertical useVirtualAxis       horizontal useVirtualAxis
           |                            |
     visible rows                visible columns
           \                            /
            \                          /
             consumer renders intersections
```

Cross-axis effects are normal consumer layout effects. Example:

```text
column width changes
       ↓
visible cells reflow
       ↓
row DOM height changes
       ↓
vertical Mioframe measurement binding
       ↓
TanStack updates row geometry
```

No shared grid coordinator is required.

## Scroll navigation

`scrollToIndex` owns geometry only.

```text
consumer chooses logical target
       ↓
scrollToIndex
       ↓
target enters virtual range
       ↓
consumer DOM mounts
       ↓
consumer optionally focuses/edits/selects
```

Focus and edit lifecycle stay with the presentation owner.

## Rendering contract

The library is headless.

Do not add rendering components in the initial implementation. Native table semantics, list semantics, Material composition, sticky behavior, CSS layout, and accessibility all remain with consumers.

## Error behavior

This is presentation infrastructure, not a recoverable business service.

Implementation preflight must define deterministic developer-facing handling for invalid configuration such as:

- negative count;
- non-finite/non-positive estimates where unsupported;
- unstable/duplicate keys when detectably invalid;
- out-of-range measurement index;
- out-of-range `scrollToIndex`.

Do not add user-facing `DomainError` codes for virtual geometry.

## Required integration proof

Use a real browser. `happy-dom` cannot prove the required geometry.

Protect only Mioframe's adapter contract:

- 10,000+ logical items with bounded mounted items;
- variable vertical sizes;
- variable horizontal sizes;
- post-mount resize without full remount;
- measurement identity stays correct after reorder/filter remapping of indices while stable keys are preserved;
- consumers do not need TanStack-specific DOM attributes;
- unmount/ref cleanup does not leave stale observed elements;
- deep `scrollToIndex`;
- `scrollMargin` with content before the virtual surface;
- start/end scroll padding;
- size correction before viewport with acceptable anchor stability;
- cleanup/remount and scroll-root replacement;
- two independent axes sharing one scroll root in a fixture;
- two independent axes using different roots in a narrow fixture when the consumer topology requires it.

Do not duplicate TanStack's own internal tests.

Failure handling:

1. verify adapter usage first;
2. fix Mioframe misuse;
3. contain narrow engine quirks at the adapter boundary when no new generic algorithm is required;
4. reopen dependency selection only for a demonstrated blocking incompatibility.

## Performance invariants

For fixed viewport and overscan:

- mounted item count stays bounded as logical count grows;
- adapter scrolling/measurement does not require mounting the full collection;
- shared code does not create cross-axis O(rows × columns) work;
- no duplicate Mioframe geometry cache shadows TanStack measurements;
- measurement binding adds no per-item observer/cache parallel to TanStack.

Absolute timing budgets belong to controlled product profiling, not this primitive.

## Rejected alternatives

- custom Mioframe virtualizer;
- direct TanStack imports in database/widgets;
- leaking TanStack `data-index`/`indexAttribute` requirements to consumers;
- an independent element→item measurement registry when the engine's index attribute already solves association;
- `vue-virtual-scroller` as primary engine;
- VueUse `useVirtualList` for this dynamic 2D requirement;
- TanStack Table as a second database/table state owner;
- fixed-size-only virtualization;
- separate generic `useVirtualGrid`;
- generic `VirtualList`/`VirtualTable` components;
- virtualization embedded into `MDTable`/`MDList`;
- arbitrary TanStack options passthrough;
- persisted measurement state;
- hidden full-collection measurement.

## Shared UI blast radius

Initial introduction should:

- add `@tanstack/vue-virtual`;
- add only `src/shared/ui/virtualization`, its public entry point, and focused proof;
- leave existing `MDList`, `MDTable`, and Material components unchanged merely to establish the primitive;
- gain database rendering as the first production consumer.

## Implementation readiness

Resolved:

- owner/dependency direction;
- selected engine;
- one-axis headless abstraction;
- DOM-measurement sizing contract;
- stable identity;
- TanStack measurement-index convention hidden behind Mioframe API;
- explicit axis scroll root;
- scroll margin/padding needs;
- two-axis composition without a shared grid;
- navigation vs focus ownership;
- state/persistence boundary;
- integration proof scope.

Remaining before production implementation:

- execute the focused Mioframe/TanStack browser proof;
- finalize exact Vue ref-binding signature and invalid-input behavior against the installed version;
- select exact proof files through implementation preflight.

Verdict: **library architecture accepted; selected engine fixed; ready for focused integration proof and implementation preflight**.
