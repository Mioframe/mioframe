# Virtualization library

Status: **architecture accepted; `@tanstack/vue-virtual` selected; integration proof and implementation preflight pending**.

This document is the architecture source of truth for Mioframe's reusable viewport virtualization infrastructure. Database-specific integration and performance investigation are owned by `docs/database-virtualization.md` and `docs/database-virtualization-profiling.md`.

## Goal

Provide one small, upper-layer-independent virtualization primitive that keeps mounted UI work bounded by viewport and overscan for very large scrollable collections whose item dimensions may differ and may change after mount.

Current requirements justify the complete initial contract:

- the database needs vertical virtualization for many rows;
- the database needs horizontal virtualization for many properties;
- row heights are dynamic;
- column widths are dynamic and require consumer-owned aggregation from header/cell measurements;
- both axes share one database scroll container;
- future list/card presentations must be able to reuse the same one-axis primitive without importing database semantics.

## Accepted architecture

The shared library owns **one virtual-axis primitive** implemented as a narrow Mioframe adapter over **`@tanstack/vue-virtual`**.

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

Do not add a second virtualization algorithm or a separate generic grid engine.

A two-dimensional grid is composition of two independent axes against the same scroll element:

```text
1D list                  database grid
────────                 ─────────────
useVirtualAxis           useVirtualAxis(vertical)
                         +
                         useVirtualAxis(horizontal)
                         +
                         database-owned composition
```

If a future requirement proves that cross-axis behavior itself needs generic ownership, that is a later architecture decision. It is not required by the current database contract.

## Engine decision

`@tanstack/vue-virtual` is the selected virtualization engine.

The selection is based on required current capabilities provided by TanStack Virtual:

- Vue integration through `useVirtualizer`;
- vertical and horizontal virtualization;
- stable `getItemKey` support;
- provisional `estimateSize` values for unmeasured items;
- dynamic DOM measurement through `measureElement`;
- programmatic item size updates through the engine's `resizeItem` capability;
- `scrollToIndex` for deep navigation;
- overscan and total-size/range geometry;
- supported scroll-position adjustment when measured sizes change.

The integration proof is no longer a library-selection experiment. Its purpose is to verify that Mioframe can consume these capabilities through the narrow adapter defined here under the actual Vue/browser/database geometry we require.

Reconsider the dependency only if that proof demonstrates a blocking incompatibility that would force Mioframe to own substantial virtualization machinery such as:

- an offset/index tree;
- a second range algorithm;
- independent resize-observation scheduling;
- independent scroll-anchor/correction logic;
- hidden full-content measurement;
- another general-purpose dynamic-size engine.

A normal integration quirk or narrow adapter mapping is not sufficient reason to replace the selected engine.

## Ownership

### `src/shared/ui/virtualization`

Owns:

- the only production import boundary for `@tanstack/vue-virtual`;
- mapping Mioframe's virtual-axis contract to TanStack Virtual;
- virtual-range exposure;
- provisional estimates;
- dynamic measured-size updates;
- engine-backed scroll correction/anchoring;
- overscan;
- deep-index navigation;
- lifecycle and cleanup of engine/browser observation owned by the adapter;
- domain-agnostic public types.

Must not know:

- database documents, items, properties, views, filters, or sorting;
- Material components;
- list/card/table presentation semantics;
- selection state;
- edit state;
- focus policy for items leaving the viewport;
- persisted column/row sizes;
- business loading or paging semantics.

### Consumers

Consumers own:

- logical collection and stable item identity;
- scroll-container placement and CSS/layout;
- actual item markup;
- dimension estimates appropriate to the presentation;
- aggregation needed to turn several DOM measurements into one logical-axis item size;
- focus, selection, editing, keyboard behavior, and accessibility semantics;
- reset boundaries when presentation meaning changes.

For the database, these responsibilities remain in `entities/databaseData`.

## Source of truth and state

The logical item collection remains consumer-owned.

The virtualizer owns only ephemeral presentation geometry derived from:

- item count;
- stable keys;
- scroll viewport;
- provisional estimates;
- measured sizes;
- overscan.

Measurements are runtime presentation state. They are never database/view/document state and are not persisted by the shared library.

The virtualizer must never become a second source of truth for item ordering or membership.

## Public API

The initial public surface is one composable plus small domain-agnostic types.

Conceptually:

```ts
useVirtualAxis(options)
```

Required options:

- `count` — reactive logical item count;
- `getItemKey(index)` — stable identity for the logical item at an index;
- `getScrollElement()` — current scroll element or null before mount;
- `orientation` — `vertical` or `horizontal`;
- `estimateSize(index)` — provisional size for an item not yet authoritatively measured;
- `overscan` — optional consumer-tunable overscan with a narrow shared default if integration testing supports one.

Required returned capabilities:

- `virtualItems` — current ordered virtual range;
- `totalSize` — estimated/measured full-axis extent;
- `measureElement(element)` — register/update an item from rendered DOM size;
- `setItemSize(index, size)` — Mioframe-facing name for supplying an authoritative consumer-calculated size; the adapter maps this to TanStack Virtual's `resizeItem` capability;
- `scrollToIndex(index, options?)` — make a logical item reachable without requiring preceding items to have rendered.

Conceptual `VirtualItem` fields:

- `index`;
- `key`;
- `start`;
- `size`;
- `end`.

Exact Vue/TypeScript signatures are finalized in implementation preflight. Do not expose TanStack `Virtualizer`, TanStack `VirtualItem`, TanStack option objects, or arbitrary option passthrough through the Mioframe public API.

## Dynamic-size contract

Fixed item size is never a correctness requirement.

`estimateSize` is provisional only. It exists so geometry can be approximated before an item is rendered or measured.

After authoritative measurement:

- measured size replaces the estimate for geometry;
- an item may change size repeatedly;
- size changes update total extent and virtual offsets;
- changes before the viewport preserve a stable visible anchor using the selected engine's supported correction behavior;
- no complete hidden collection may be mounted merely to discover sizes.

The adapter must use TanStack's native measurement/correction mechanisms rather than recreating them in Mioframe.

## Measurement modes

Two measurement paths are required by the current database.

### Element measurement

`measureElement(element)` applies when one DOM element represents one logical axis item.

Current database use:

- a rendered database row is the logical vertical item;
- its rendered height includes wrapping and the tallest visible cell;
- content or column-width changes may resize it after mount;
- TanStack dynamic element measurement/ResizeObserver integration updates the vertical geometry.

### Consumer-supplied measurement

`setItemSize(index, size)` applies when one logical axis item has no single authoritative DOM element.

Current database use:

- a logical column width may be derived from its header and currently rendered cells;
- `entities/databaseData` owns that aggregation and presentation policy;
- after deriving the current width, it supplies the authoritative axis size;
- the shared adapter maps that update to TanStack `resizeItem`.

The shared library does not know how the size was calculated.

Do not use both measurement paths as competing sources for the same logical item unless a current consumer requires that behavior and the TanStack contract makes it safe. The database design uses row DOM measurement vertically and consumer-supplied column sizing horizontally.

## Stable identity

`getItemKey` is required. Index represents position, not identity.

The adapter must configure TanStack's stable-key capability from consumer keys rather than create a parallel key registry.

Consumers remain responsible for:

- keeping index-to-key mapping accurate after reorder/filter/schema changes;
- associating asynchronous consumer-owned measurements with the intended stable item;
- releasing consumer-owned measurement state for removed items.

## Two-axis composition

Database rendering uses one physical scroll element:

```text
                         shared scroll element
                          /               \
                         /                 \
       vertical useVirtualAxis       horizontal useVirtualAxis
                  |                         |
           visible rows              visible columns
                  \                         /
                   \                       /
                    database visible cell matrix
```

The shared library does not create or own the matrix.

Cross-axis effects remain consumer-owned. Example:

```text
column width changes
       ↓
visible cells reflow
       ↓
row DOM heights change
       ↓
TanStack-backed measureElement
       ↓
vertical axis updates
```

No shared grid coordinator is required for this flow.

## Scroll container contract

The consumer owns the physical scroll container.

Both axes may reference the same element. The adapter tolerates `null` before mount and owns cleanup on unmount.

The library must not:

- create nested scroll containers;
- decide sticky headers/actions;
- change consumer overflow behavior;
- own product-view scroll restoration.

## Scroll navigation and anchoring

`scrollToIndex` is part of the required API because offscreen logical items do not exist in the DOM.

The library owns geometry-level navigation only:

```text
logical target selected
       ↓
scrollToIndex(target)
       ↓
target enters virtual range
       ↓
consumer DOM appears
       ↓
consumer may focus/select/edit it
```

Focus and editing remain consumer-owned.

When measured sizes before the viewport change, the adapter uses TanStack's supported scroll-adjustment behavior. Do not introduce a second Mioframe scroll-anchor algorithm unless a demonstrated blocker cannot be resolved through the selected engine's supported contract.

## Rendering contract

The library is headless.

Do not expose `VirtualList.vue`, `VirtualTable.vue`, `VirtualGrid.vue`, or a render-prop component in the initial implementation.

Reasons:

- current consumers require different DOM/accessibility semantics;
- database table rendering and list/card rendering are different presentation contracts;
- a composable keeps presentation ownership with the truthful consumer;
- no current requirement needs a generic rendering component.

## Dependency boundary

Only `src/shared/ui/virtualization` may import TanStack Virtual for this architecture.

The adapter must not expose:

- the engine instance;
- engine-specific types;
- engine-specific option names where Mioframe does not need them;
- arbitrary third-party option passthrough.

This keeps the dependency replaceable and prevents TanStack semantics from becoming database or future-list APIs.

## Error and invalid-input behavior

The virtualizer is presentation infrastructure, not a recoverable business service.

Implementation preflight must define deterministic handling for programmer/configuration errors including:

- negative count;
- non-finite/non-positive authoritative sizes;
- duplicate/unstable keys when detectably invalid;
- out-of-range `scrollToIndex`/`setItemSize` calls.

Do not introduce a user-visible `DomainError` taxonomy for virtual geometry.

## Lifecycle

The composable owns cleanup of TanStack integration and observations registered through its measurement path.

Consumer-owned measurement coordinators own their own state/observers and cleanup.

Changing count/order updates virtual ranges without creating a retained duplicate logical collection.

Do not add a generic measurement-cache generation/reset protocol until a confirmed consumer requires one.

## Accessibility and interaction

The shared virtualizer owns no ARIA roles or keyboard semantics.

Consumers must explicitly own:

- focus when a focused item leaves the virtual range;
- keyboard navigation to an offscreen logical item;
- accessibility count/index semantics required by the rendered pattern;
- editing and overlay ownership for virtualized items.

## Required integration proof

Because geometry, scrolling, ResizeObserver, and anchoring require a real browser, the adapter needs isolated reusable browser proof for the Mioframe/TanStack integration:

- 10,000+ logical items with bounded DOM;
- variable vertical sizes;
- variable horizontal sizes;
- post-mount resize;
- `scrollToIndex` to a deep item;
- size correction before the viewport without unacceptable anchor jump;
- consumer-supplied `setItemSize` mapped through TanStack `resizeItem`;
- cleanup/remount;
- two independent axes using one scroll container in a test fixture, without adding a production grid abstraction.

Do not duplicate TanStack's own unit tests. Prove only Mioframe's adapter contract and the browser behavior on which current consumers depend.

A failure in this proof is handled as follows:

1. determine whether Mioframe misused the supported TanStack contract;
2. if so, correct the adapter/integration;
3. if a narrow TanStack limitation can be accommodated without new generic algorithms, document and contain it at the adapter boundary;
4. reconsider the engine only if correct required behavior would otherwise require Mioframe to implement substantial virtualization machinery.

## Database product proof

Database-specific bounded cell counts, deep row/column scrolling, editing, view switching, correctness, dynamic column policy, and performance remain owned by the database architecture/profiling plan.

## Performance invariants

For a fixed viewport and overscan:

- mounted axis items remain bounded as logical count grows;
- the Mioframe adapter does not scan or mount the complete logical collection on each scroll frame;
- the shared layer introduces no work proportional to the cross product of two axes;
- consumer-supplied size updates affect only the owning axis geometry.

Absolute timing budgets are established by controlled database profiling, not invented in this library contract.

## Rejected alternatives

- custom Mioframe virtualizer — unnecessary ownership of solved infrastructure;
- `vue-virtual-scroller` as the primary engine — more presentation/scroller-oriented than the required narrow headless-axis boundary;
- VueUse `useVirtualList` — insufficient for the required dynamic two-axis contract;
- TanStack Table — wrong responsibility; database/table state already has Mioframe owners;
- direct TanStack imports in `entities/databaseData` — leaks dependency semantics and prevents one reusable lower boundary;
- fixed-size-only virtualization — violates current content requirements;
- separate `useVirtualGrid` — adds an abstraction without generic cross-axis behavior;
- generic `VirtualList`/`VirtualTable` components — mixes geometry with presentation semantics;
- virtualization added to `MDTable`/`MDList` — wrong ownership and excessive blast radius;
- arbitrary TanStack options passthrough — destroys the adapter boundary;
- persisted measurement state — no current product requirement;
- hidden full-collection measurement — defeats bounded rendering.

## Shared UI blast radius

Initial introduction should:

- add only `src/shared/ui/virtualization`, its public entry point, and its proof;
- add `@tanstack/vue-virtual` as the selected dependency;
- not modify existing `MDList`, `MDTable`, or Material components merely to establish the primitive;
- gain the database as the first production consumer;
- require consumer review only for code actually migrated to the primitive.

## Implementation readiness

Resolved architecture decisions:

- owner and dependency direction;
- selected engine: `@tanstack/vue-virtual`;
- one-axis abstraction instead of presentation/grid abstractions;
- dynamic sizing contract;
- element and consumer-supplied measurement paths;
- mapping of consumer-supplied size to TanStack `resizeItem`;
- two-axis composition model;
- scroll-container ownership;
- navigation vs focus ownership;
- persistence/state boundary;
- engine encapsulation boundary;
- required reusable browser proof;
- conditions under which the engine decision may be reopened.

Remaining preflight blockers before production implementation:

- execute the focused Mioframe/TanStack integration proof;
- resolve exact TypeScript/Vue signatures and invalid-input behavior against the installed dependency;
- select exact test/spec paths according to current testing/Storybook migration policy.

Verdict for library architecture: **accepted; selected engine fixed; ready for integration proof and implementation preflight**.
