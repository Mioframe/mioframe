# Virtualization library

Status: **architecture accepted; implementation preflight pending capability proof**.

This document is the architecture source of truth for Mioframe's reusable viewport virtualization infrastructure. Database-specific integration and performance investigation are owned by `docs/database-virtualization.md` and `docs/database-virtualization-profiling.md`.

## Goal

Provide one small, upper-layer-independent virtualization primitive that keeps mounted UI work bounded by viewport and overscan for very large scrollable collections whose item dimensions may differ and may change after mount.

Current consumers justify all capabilities in this contract:

- the database needs vertical virtualization for many rows;
- the database needs horizontal virtualization for many properties;
- row heights are dynamic;
- column widths are dynamic and require consumer-owned aggregation from header/cell measurements;
- both axes share one database scroll container;
- future list/card presentations may reuse the same one-axis primitive without importing database semantics.

## Architecture decision

The shared library owns **one virtual-axis primitive**.

Do not add a separate virtual-grid engine or presentation components.

```text
1D list                  database grid
────────                 ─────────────
useVirtualAxis           useVirtualAxis(vertical)
                         +
                         useVirtualAxis(horizontal)
                         +
                         database-owned composition
```

A two-dimensional grid is composition of two independent axes against the same scroll element. If future requirements prove that cross-axis behavior itself needs generic ownership, that is a later architecture decision; it is not required now.

## Ownership

### `src/shared/ui/virtualization`

Owns:

- adapter to the selected headless virtualization engine;
- virtual range calculation exposure;
- provisional size estimates;
- dynamic measured-size updates;
- scroll-offset correction/anchoring supplied by the engine;
- overscan;
- deep index navigation;
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
- any aggregation needed to turn several DOM measurements into one logical-axis item size;
- focus, selection, editing, keyboard behavior, and accessibility semantics;
- reset boundaries when their presentation meaning changes.

For the database, these responsibilities stay in `entities/databaseData`.

## Source of truth and state

The logical item collection remains consumer-owned.

The virtualizer owns only ephemeral geometry derived from:

- item count;
- stable keys;
- scroll viewport;
- provisional estimates;
- measured sizes;
- overscan.

Measurements are runtime presentation state. They are never database/view/document state and are not persisted by the shared library.

The library must not become a second source of truth for ordering or membership.

## Public API

The public surface should stay at one composable plus small domain-agnostic types.

Conceptual API:

```ts
useVirtualAxis(options)
```

Required options:

- `count` — reactive logical item count;
- `getItemKey(index)` — stable identity for the logical item at an index;
- `getScrollElement()` — current scroll element or null before mount;
- `orientation` — `vertical` or `horizontal`;
- `estimateSize(index)` — provisional size for an item not yet authoritatively measured;
- `overscan` — optional consumer-tunable overscan with a narrow shared default if capability testing supports one.

Required returned capabilities:

- `virtualItems` — current ordered virtual range;
- `totalSize` — estimated/measured full axis extent;
- `measureElement(element)` — register/update an item from its rendered DOM size;
- `setItemSize(index, size)` — supply an authoritative size calculated by a consumer-owned measurement coordinator;
- `scrollToIndex(index, options?)` — make a logical item reachable without requiring preceding items to have rendered.

Conceptual `VirtualItem` fields:

- `index`;
- `key`;
- `start`;
- `size`;
- `end`.

Exact Vue wrapper types and option-object syntax are resolved in implementation preflight against the selected engine. Do not expose third-party engine classes/types as Mioframe public API.

## Dynamic-size contract

Fixed item size is never a correctness requirement.

`estimateSize` is provisional only. It exists so geometry can be approximated before an item is rendered or measured.

After authoritative measurement:

- the measured size replaces the estimate for geometry;
- an item may change size repeatedly;
- changes must update total extent and virtual offsets;
- changes before the viewport must preserve a stable visible anchor according to the selected engine's scroll-correction behavior;
- no complete hidden collection may be mounted merely to discover sizes.

## Measurement modes

Two measurement paths are required because the current database needs both.

### Element measurement

`measureElement(element)` is used when one DOM element corresponds to one logical axis item.

Current database use:

- a rendered database row is the logical vertical item;
- its final height already includes the tallest/wrapped visible cell in that row;
- resize observation can remeasure it when content or column width changes.

This path should use the selected engine's native dynamic-measurement/ResizeObserver integration rather than a Mioframe-owned offset algorithm.

### Consumer-supplied measurement

`setItemSize(index, size)` is used when one logical axis item has no single authoritative DOM element.

Current database use:

- a logical column width may be derived from its header and several currently rendered cells;
- `entities/databaseData` owns that aggregation/policy;
- after deriving the current width, it supplies the result to the horizontal virtual axis.

The shared library does not know how that size was calculated.

Do not use DOM element measurement and consumer-supplied sizing concurrently as competing sources for the same logical axis item unless the selected engine explicitly defines a safe contract and a current consumer requires it. The database design should use row DOM measurement vertically and consumer-supplied column sizing horizontally.

## Stable identity

`getItemKey` is required for large/dynamic collections. Index is position, not identity.

The adapter must configure the engine to retain measurements according to stable keys where supported.

Consumer responsibilities after reorder/filter/schema changes:

- current index-to-key mapping must remain accurate;
- asynchronous consumer-owned measurements must be associated with the intended stable item before being applied;
- removed items must not retain consumer-owned measurement state indefinitely.

The shared API should not introduce a second key registry when the underlying engine can own measurement identity directly.

## Two-axis composition

Database rendering uses one scroll element:

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

The consumer derives the rendered intersections from the two current ranges.

Cross-axis effects stay consumer-owned. Example:

```text
column width changes
       ↓
visible cells reflow
       ↓
row DOM heights change
       ↓
row ResizeObserver / measureElement
       ↓
vertical axis updates
```

No shared grid coordinator is required for this flow.

## Scroll container contract

The consumer owns the physical scroll container.

The adapter requires only `getScrollElement()` and must tolerate null before mount and cleanup on unmount.

For two-axis use, both axes may reference the same container.

The library must not:

- create nested scroll containers;
- decide sticky headers/actions;
- change overflow behavior outside its consumer;
- own scroll restoration across product views.

## Scroll navigation and anchoring

`scrollToIndex` is part of the current required API because virtualization removes deep offscreen items from the DOM and consumers need a supported way to reach them.

The library owns geometry-level navigation only. It does not own focus.

Typical consumer sequence:

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

When measured sizes before the viewport change, the adapter should rely on the selected engine's supported scroll-adjustment mechanism. Do not implement a second Mioframe scroll-anchor algorithm unless capability testing proves the engine insufficient.

## Rendering contract

The library is headless.

It must not expose `VirtualList.vue`, `VirtualTable.vue`, `VirtualGrid.vue`, or a render-prop component in the first implementation.

Reasons:

- current consumers need different DOM and accessibility semantics;
- database table rendering and future list/card rendering are not the same presentation contract;
- a composable keeps native/Material/product ownership with the truthful consumer;
- no current requirement needs a generic rendering component.

## Engine boundary

A mature headless engine is preferred. `@tanstack/vue-virtual` is the current candidate because its documented model includes:

- vertical and horizontal virtualizers;
- variable/dynamic sizes;
- element measurement;
- programmatic item resizing;
- overscan;
- stable item keys;
- scroll-to-index;
- scroll adjustment when measured sizes change.

Adoption is conditional on the capability experiment in `docs/database-virtualization-profiling.md`.

Accept the engine when Mioframe can implement this document as a thin adapter.

Reject/reconsider it if correct behavior requires Mioframe to own substantial:

- offset trees;
- measurement scheduling;
- resize observation infrastructure;
- scroll correction;
- hidden full-content measurement;
- duplicate range algorithms.

The adapter must not expose the engine instance, engine-specific virtual item type, engine option names, or arbitrary option passthrough. An unrestricted passthrough would make the wrapper meaningless and couple consumers to the dependency.

## Error and invalid-input behavior

The virtualizer is presentation infrastructure, not a recoverable business service.

Implementation preflight must define deterministic handling for programmer/configuration errors such as:

- negative count;
- non-finite/non-positive authoritative sizes;
- duplicate/unstable keys when detectable;
- out-of-range `scrollToIndex`/`setItemSize` calls.

Prefer explicit development failure/warning or narrow normalization according to existing shared-UI conventions. Do not introduce a user-visible `DomainError` taxonomy for virtual geometry.

## Lifecycle

The composable owns cleanup of the selected engine integration and observers registered by `measureElement`.

Consumer-owned measurement coordinators own their own observers/state and cleanup.

Changing logical count/order must update virtual ranges without creating a parallel retained collection.

Measurement cache invalidation should be as narrow as the selected engine and current consumer require. Do not add a generic cache-generation/reset protocol before a confirmed scenario needs it.

## Accessibility and interaction

The shared virtualizer owns no ARIA roles or keyboard semantics.

Virtualization changes which items exist in the DOM, so consumers must explicitly handle:

- focus when a focused item is about to leave the range;
- keyboard navigation to an offscreen logical item;
- accessibility count/index semantics when required by the rendered pattern;
- editing/overlay ownership for virtualized items.

Those are presentation-specific contracts and must not be guessed by the generic axis.

## Minimum proof

### Shared reusable browser proof

Because geometry, scrolling, ResizeObserver, and anchoring require a real browser, the shared adapter needs isolated reusable browser proof for:

- 10,000+ logical items with bounded DOM;
- variable vertical sizes;
- variable horizontal sizes;
- post-mount resize;
- `scrollToIndex` to a deep item;
- size correction before viewport without unacceptable anchor jump;
- consumer-supplied `setItemSize` updates;
- cleanup/remount;
- two independent axes using one scroll container in a test fixture, without adding a production grid abstraction.

Do not duplicate third-party unit tests. Protect only Mioframe's adapter contract and integration behavior.

### Deterministic/component proof

Use lower-level tests only for Mioframe-owned pure validation/API wiring that does not claim browser geometry.

### Database product proof

Database-specific bounded cell counts, deep row/column scrolling, editing, view switching, correctness, and performance stay with the database architecture/profiling plan.

## Performance invariants

For a fixed viewport and overscan:

- mounted axis items must remain bounded as logical count grows;
- range derivation/measurement must not require scanning or mounting every logical item on each scroll frame;
- the shared layer must not introduce work proportional to the cross product of two axes;
- consumer-supplied size updates affect only the owning axis geometry.

Absolute timing budgets are established by controlled profiling, not invented in this library contract.

## Rejected alternatives

- custom Mioframe virtualizer: unnecessary while a mature engine satisfies the contract;
- fixed-size-only virtualizer: violates current content requirements;
- separate `useVirtualGrid`: adds an abstraction without current cross-axis generic behavior;
- generic `VirtualList`/`VirtualTable` components: mixes geometry with presentation semantics;
- adding virtualization to `MDTable`/`MDList`: wrong ownership and excessive shared UI blast radius;
- engine imports directly in `entities/databaseData`: prevents the required reusable lower-level ownership and spreads dependency semantics;
- arbitrary third-party options passthrough: leaks dependency API and destroys the adapter boundary;
- persisted measurement state: no current product requirement and creates another state source;
- hidden full collection measurement: defeats bounded rendering.

## Shared UI blast radius

Initial library introduction should:

- add only `src/shared/ui/virtualization` and its public entry point/tests;
- not modify existing `MDList`, `MDTable`, or Material components to establish the primitive;
- gain the database as the first production consumer;
- require consumer review only for code actually migrated to the new primitive.

## Implementation readiness

Architecture decisions resolved:

- owner and dependency direction;
- one-axis abstraction instead of presentation/grid abstractions;
- dynamic sizing contract;
- two required measurement paths;
- two-axis composition model;
- scroll-container ownership;
- navigation vs focus ownership;
- persistence/state boundary;
- engine encapsulation boundary;
- required reusable browser proof.

Remaining preflight blockers before production code:

- execute the focused candidate-engine capability experiment;
- confirm the candidate supports both measurement paths and stable anchoring without substantial Mioframe algorithms;
- resolve exact TypeScript/Vue signatures and invalid-input behavior against the confirmed dependency;
- select exact test/spec paths according to current Storybook/browser-test migration policy.

Verdict for library architecture: **ready for capability proof and implementation preflight; production implementation starts only after those preflight blockers are resolved**.
