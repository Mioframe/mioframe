# Database virtualization

Status: **architecture investigation; implementation not ready**.

This document is the living architecture handoff for large database rendering and reusable collection virtualization. Controlled profiling and capability analysis are defined in `docs/database-virtualization-profiling.md`. The architecture must be updated from measured results before production implementation begins.

## Goal

Remove multi-second UI blocking when switching a database from a small filtered view to a large full view, while making rendering scale to very large logical collections.

Confirmed product requirements for this work:

- profiling and performance analysis use reproducible automated tests, not a live-device-only procedure;
- 30,000+ database rows are a required scale baseline;
- tables may also contain very many properties/columns;
- item height and width may vary with content and may change after mount;
- virtualization infrastructure should be reusable by future large one- and two-dimensional visualizations, including lists with different presentation formats;
- correctness, interaction, editing, scrolling, filtering, and sorting must be preserved.

The rendering invariant is:

> Mounted UI work is bounded by the viewport and overscan, not by the total logical row or column count.

For a table, mounted cell cost should therefore scale with approximately `visibleRows * visibleColumns`, not `allRows * allColumns`.

## Confirmed current behavior and evidence

Current repository evidence:

- `src/entities/databaseData/DatabaseDataTable.vue` renders every `itemId` and, inside every row, every property with nested `v-for` loops;
- `src/entities/databaseData/useDatabaseData.ts` consumes the complete ordered filtered ID list from the worker-facing database service;
- filtering/sorting are owned by `src/shared/service/databaseDocument` and currently return a complete ordered ID list;
- each rendered editable value currently establishes multiple reactive reads through database property/effective/stored value composables, so full-table materialization amplifies subscription cost as well as DOM/component cost;
- `src/shared/ui/Table/MDTable.vue` is a native table presentation primitive and has no virtualization contract;
- no repository-owned generic virtualizer currently exists.

The current defect is therefore consistent with unbounded main-thread rendering work, but profiling must still attribute actual costs before additional optimizations are selected.

## Non-goals

This investigation does not by itself:

- change database filtering, sorting, persistence, or view semantics;
- introduce pagination as a product behavior;
- require fixed row heights or fixed column widths;
- recreate native `table-layout: auto` by rendering all hidden cells for measurement;
- migrate existing `MDList` consumers;
- turn `MDTable` into a generic virtual-table framework;
- introduce worker paging, indexes, batch-read protocols, or new caches without measured need;
- build a generic "data visualization framework" for hypothetical layouts;
- guarantee literally unbounded document size independent of available memory/CPU.

## Affected scenarios

Required scenarios include:

- switch from a short filtered database view to a full large view;
- switch back while previous rendering work could still be active;
- vertical scrolling to deep rows;
- horizontal scrolling to deep columns;
- dynamic row height caused by content changes;
- dynamic column width caused by rendered content;
- inline editing of a currently visible row/cell;
- filter/sort correctness and ordering;
- relation-valued cells and other variable-height content;
- desktop and mobile viewport behavior.

## Boundaries and ownership

| Owner | Responsibility in this work |
| --- | --- |
| feature | No new business state. Existing user actions remain unchanged. |
| `entities/databaseData` | Database-specific integration: complete row/property identities, table/grid composition, visible cell rendering, database-specific sizing policy, sticky/action behavior, and any table measurement coordination. |
| widget | Composition only. Must not own virtual ranges, sizing policy, filtering, or sorting. |
| page/pane | No change expected. |
| `shared/ui/virtualization` | Upper-layer-independent dynamic virtualization primitives for large scrollable 1D/2D collections. No database, Material, selection, or business semantics. |
| `shared/ui/Table` | Preserve current presentation ownership by default. Change only if profiling/prototype proves an unavoidable generic table-surface requirement. |
| service/worker | Preserve current canonical filter/sort result initially. Optimize only when measured worker compute/transfer cost is a remaining bottleneck. |

This shared placement is justified by an upper-layer-independent current requirement, not by speculative reuse: the database needs dynamic virtualization now, and the same geometry primitive must not be tied to database semantics so future list presentations can consume it without duplicating the engine integration.

## Source of truth

- ordered row membership: existing complete worker/service `itemIdList` unless profiling proves that contract itself must change;
- column/property membership and order: existing database property/view contract;
- stored database values: existing database document state;
- virtual ranges, measurements, scroll offsets, overscan, and discovered sizes: ephemeral presentation state only.

Virtualization must never become a second data-ordering or filtering source of truth.

## State shape

The generic virtualization layer should need only presentation facts conceptually equivalent to:

```ts
type VirtualItemKey = string | number;

type VirtualMeasurement = {
  key: VirtualItemKey;
  size: number;
};
```

A virtual axis derives visible items from:

- logical count;
- stable item keys;
- scroll container geometry;
- provisional size estimates for unseen items;
- measured sizes for mounted items;
- overscan.

For database rendering, presentation measurements are keyed by stable domain identity:

- rows: `DatabaseItemId`;
- columns: `DatabasePropertyId`.

Measurements are not persisted document/view state.

## Dynamic sizing contract

Fixed dimensions are forbidden as a correctness requirement.

Required behavior:

1. an unseen item may receive a provisional estimate only so virtual geometry can be constructed;
2. after mount, actual DOM measurement is authoritative;
3. mounted items may change size repeatedly as content, wrapping, relation content, or viewport geometry changes;
4. size changes must update virtual geometry without requiring remount of the complete collection;
5. size corrections before the visible anchor must preserve stable scrolling rather than visibly jumping the user's viewport.

A headless engine with dynamic measurement and scroll-adjustment support is preferred over a Mioframe-owned offsets/measurement algorithm. `@tanstack/vue-virtual` is the current candidate, but adoption remains conditional on the controlled capability proof in the profiling plan.

## Minimum sufficient design hypothesis

### Shared virtualization primitive

Create a narrow `src/shared/ui/virtualization` module only after the capability proof succeeds.

The intended abstraction is a dynamic virtual axis, not presentation-specific components such as `VirtualTable`, `VirtualCardList`, and `VirtualMaterialList`.

Conceptual capability:

```ts
useVirtualAxis({
  count,
  getKey,
  getScrollElement,
  estimateSize,
  orientation,
  overscan,
})
```

with derived visible items, total virtual size, measurement integration, and `scrollToIndex`/equivalent navigation capability.

A two-dimensional grid is composition of one vertical and one horizontal axis. Do not introduce a second independent virtualization algorithm for grids.

The exact public API and names are **not ready** until the capability experiment proves the smallest required adapter surface.

### Database grid integration

`entities/databaseData` consumes the generic geometry and owns database-specific rendering.

Expected shape:

```text
complete ordered row IDs ------> vertical virtual axis ---+
                                                        |
complete property IDs ---------> horizontal virtual axis -+--> visible cell matrix
```

Only rows/columns selected by the virtual ranges may instantiate expensive cell UI/reactive reads.

### Row sizing

Row height is dynamic. The rendered row is measured after layout and remeasured after content/width changes. A relation cell or wrapped value may therefore increase or decrease the row height without violating the virtualization contract.

### Column sizing

Column width is dynamic, but horizontal virtualization creates a fundamental limitation: exact native intrinsic width cannot depend on content that has never been rendered.

The initial candidate semantics are **progressively discovered intrinsic sizing**:

- unseen columns use an estimate;
- headers and mounted cells contribute actual measured requirements;
- a discovered wider requirement may enlarge the current column presentation;
- hidden cells are never bulk-rendered solely to discover their width;
- session-local measurements are presentation state.

Whether width should be grow-only for the lifetime of a view, when it may shrink, and how width changes interact with row remeasurement remain explicit decisions to validate in browser experiments before implementation readiness.

### Additional optimizations

Virtualization is the baseline architecture because the product scale requirement independently makes full DOM materialization unacceptable.

Other optimizations are selected only from profiling evidence. Possible measured follow-ups include:

- removing duplicate/unnecessary per-cell reactive reads;
- changing value read granularity;
- optimizing worker filter/sort computation;
- reducing worker-to-main transfer cost;
- introducing range/query protocols only if the complete-ID contract is shown to be a bottleneck.

Do not bundle these merely because they may improve performance.

## Simplest viable alternative

Vertical-only virtualization is simpler but insufficient because the product explicitly requires very large column counts.

Progressive full rendering is simpler but insufficient because it eventually materializes the entire logical collection and therefore does not satisfy the bounded-rendering invariant.

The minimum complete design is therefore dynamic virtualization in both axes, with database-specific two-axis composition and no broader visualization framework.

## Rejected approaches

Rejected for this architecture unless new evidence changes a requirement:

- full row/column DOM materialization;
- progressive rendering that eventually mounts the complete table;
- CSS hiding or `content-visibility` as the primary scalability mechanism;
- fixed row height or fixed column width as a required data/presentation contract;
- hidden offscreen rendering of all rows/cells for measurement;
- pagination solely to avoid rendering cost;
- independent custom virtualizers for table, list, and cards;
- moving database logic into the generic shared virtualization module;
- immediate worker paging/index infrastructure without profiling evidence;
- a generic visualization/layout framework covering tree, kanban, masonry, calendar, graph, or other unconfirmed scenarios.

## Shared UI blast radius

Intended first-pass blast radius:

- add a new isolated shared virtualization module;
- database table becomes its first production consumer;
- no existing `MDList` consumer migration;
- no behavioral change to `MDTable` unless a later architecture revision proves it necessary.

Any change to existing shared list/table primitives requires a separate consumer/blast-radius review before implementation.

## Acceptance matrix

| Contract | Required outcome |
| --- | --- |
| Large rows | 30,000+ logical rows do not cause full row DOM/component materialization. |
| Large columns | Large logical property counts do not cause full column/cell materialization. |
| Combined scale | Mounted cells remain bounded by visible row/column ranges plus overscan. |
| Dynamic sizes | Correct rendering does not rely on fixed height/width; post-mount size changes are supported. |
| Responsiveness | Switching to the large view does not create a multi-second main-thread block and input/navigation remain responsive. |
| Correctness | Full/filtered views retain exact membership and ordering from existing filter/sort semantics. |
| Scrolling | Deep vertical and horizontal targets are reachable and stable. |
| Editing | Visible values remain editable without stale writes or lost focus caused by ordinary virtualization updates. |
| View switching | Old virtual/measurement state does not leak into a newly selected view. |
| Reuse boundary | Generic virtualization contains no database, Material, filter/sort, selection, or product-specific contract. |

## Performance contract under investigation

Primary metrics:

- maximum main-thread task duration caused by large-view switching;
- input/frame acknowledgement after the switch action;
- mounted row/column/cell counts relative to viewport and overscan;
- worker query compute latency;
- worker-to-main result latency/transfer cost;
- layout/style/paint cost after result delivery.

Initial responsiveness budget to validate in the controlled harness:

- no switch-caused main-thread task over **100 ms**;
- target individual main-thread work slices at or below the browser long-task threshold of **50 ms**;
- structural bounded-rendering assertions are preferred over wall-clock-only assertions wherever possible.

These numbers are not yet a persistent CI budget. The profiling phase must determine whether they are stable and representative enough to become automated regression gates and must record the exact test environment if they do.

## Risk matrix

| Risk | Why it matters | Required resolution |
| --- | --- | --- |
| Dynamic row measurement | wrapping/relation content changes height | capability/browser proof before ready |
| Dynamic column measurement | hidden content cannot provide exact intrinsic width | choose and prove column-sizing semantics |
| Scroll anchoring | corrected sizes above viewport can jump content | browser proof with deep scrolling and resize |
| Cell reactive fan-out | visible cells may still be too expensive | profile after bounded rendering before changing read APIs |
| Worker filter/sort | 30k+ logical data still requires computation | measure separately from UI rendering |
| Worker transfer | complete ID arrays may become material at larger scales | measure before protocol change |
| Relation rendering | nested/variable content may amplify measurement/rendering | dedicated representative scenario |
| Focus/edit lifecycle | virtual removal can destroy focused elements | define expected offscreen behavior before implementation ready |
| Accessibility semantics | changing native table layout may affect semantics/navigation | browser/component proof according to final DOM design |
| Performance-test noise | absolute timing can be hardware-sensitive | use structural invariants and controlled repeated measurements |

## Required test proof

`docs/testing/architecture.md` remains canonical.

Before implementation readiness, resolve proof ownership for:

- deterministic adapter/geometry contracts owned by Mioframe rather than third-party behavior;
- reusable browser behavior for dynamic measurement, scrolling, and anchoring of the shared virtualization integration;
- centralized application E2E for the complete database view-switch/edit/scroll scenario;
- task-specific controlled performance measurements for the current implementation and the candidate architecture;
- persistent performance regression checks only for budgets shown to be stable and worth maintaining.

`happy-dom` cannot prove geometry, scrolling, measurement, or responsiveness. Lower-level setup may create a valid large database state, but the view-switch action under product E2E must use the real UI.

Exact spec paths, durable impact mappings, and persistent-vs-task-specific measurement ownership are deferred until the profiling findings are complete and implementation preflight is prepared.

## Required verification

Current branch phase is documentation/research only. No production verification gate is claimed by these documents.

Before production implementation begins:

1. execute the controlled profiling plan against the current implementation;
2. execute the virtualization capability experiment;
3. update this document with measured decisions and remove resolved alternatives;
4. set `Implementation readiness` to `ready` only when test ownership, budgets, public contracts, sizing semantics, and dependency choice are explicit;
5. run implementation preflight to select exact files/specs and focused verification.

## Forbidden

During the investigation phase, do not:

- modify production rendering to make the baseline look better before it is measured;
- choose additional optimization work from intuition alone;
- add permanent production diagnostics solely for one-off profiling;
- require fixed item dimensions;
- render hidden complete datasets for measurement;
- weaken filter/sort/edit behavior to satisfy performance numbers;
- add arbitrary sleeps/retries or inflated timeouts to performance/browser proof;
- expose TanStack or another engine directly to database/widgets if a shared adapter is accepted;
- ask implementation work to resolve architecture decisions still marked open here.

## Implementation readiness

Required product direction is resolved:

- virtualization is required;
- both row and column scale matter;
- dynamic sizes are required;
- reusable upper-layer-independent virtualization infrastructure is required;
- profiling must be controlled and automated;
- 30,000+ rows are an explicit baseline.

Unresolved blockers:

- measured baseline cost decomposition;
- candidate virtualizer capability proof in Vue/browser conditions used by Mioframe;
- final column width discovery/shrink semantics;
- focus/edit behavior when a virtualized item leaves the viewport;
- final performance budgets and whether each is task-specific or persistent;
- evidence on whether worker query/transfer or per-cell read contracts need changes;
- exact proof/spec ownership and implementation file set.

Verdict: **not ready**.
