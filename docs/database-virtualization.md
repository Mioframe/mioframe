# Database virtualization

Status: **baseline architecture accepted; profiling in progress; production implementation not ready**.

This document is the architecture source of truth for large database rendering and reusable collection virtualization. Controlled profiling and capability analysis are defined in `docs/database-virtualization-profiling.md`.

The baseline architecture below is a decision, not one of several equal implementation options. Profiling refines unresolved sizing, adapter, proof, and secondary-optimization details inside this architecture. Change the baseline architecture only when measured or repository evidence demonstrates that one of its assumptions is false.

## Architecture decision status

Accepted now:

- large collections require viewport-bounded rendering rather than progressive full materialization;
- database tables require virtualization on both row and column axes;
- item dimensions are dynamic and may change after mount; fixed row/column size is not a correctness contract;
- generic virtualization geometry belongs in an upper-layer-independent `shared` module;
- database row/column composition, cell rendering, table sizing policy, editing, and sticky behavior remain owned by `entities/databaseData`;
- filtering/sorting and canonical ordered membership remain service/worker-owned initially;
- the same generic dynamic-axis primitive must be usable by future list/card/other scrollable collection presentations without embedding database or Material semantics;
- additional optimizations are added only when measurements show a remaining bottleneck.

Deferred until controlled evidence:

- exact public API of the shared virtualization adapter;
- final external engine dependency (`@tanstack/vue-virtual` is the current candidate);
- final progressively-discovered column width/reset/shrink policy;
- focus/edit lifecycle when a virtual item leaves the viewport;
- whether per-cell read/subscription fan-out needs optimization after bounded rendering;
- whether worker filter/sort or worker-to-main transfer needs optimization;
- final stable performance budgets and persistent test ownership.

## Goal

Remove multi-second UI blocking when switching a database from a small filtered view to a large full view, while making rendering scale to very large logical collections.

Confirmed product requirements:

- profiling and performance analysis use reproducible automated tests, not a live-device-only procedure;
- 30,000+ database rows are a required scale baseline;
- tables may contain very many properties/columns;
- item height and width may vary with content and may change after mount;
- virtualization infrastructure must remain reusable by future large one- and two-dimensional collection presentations, including lists with different visual formats;
- correctness, interaction, editing, scrolling, filtering, and sorting must be preserved.

The primary rendering invariant is:

> Mounted UI work is bounded by viewport and overscan, not by total logical row or column count.

For a table, mounted cell cost must therefore scale approximately with `visibleRows * visibleColumns`, not `allRows * allColumns`.

## Confirmed current behavior and evidence

Current repository evidence:

- `src/entities/databaseData/DatabaseDataTable.vue` renders every `itemId` and, inside every row, every property with nested `v-for` loops;
- `src/entities/databaseData/useDatabaseData.ts` consumes the complete ordered filtered ID list from the worker-facing database service;
- filtering/sorting are owned by `src/shared/service/databaseDocument` and currently return a complete ordered ID list;
- rendered editable values establish multiple reactive reads through database property/effective/stored value composables, so full-table materialization amplifies subscription cost as well as DOM/component cost;
- `src/shared/ui/Table/MDTable.vue` is a native table presentation primitive and has no virtualization contract;
- no repository-owned generic virtualizer currently exists.

The current defect is consistent with unbounded main-thread rendering work. Profiling still has to quantify actual costs and determine whether any secondary bottleneck remains after bounded rendering.

## Non-goals

This work does not by itself:

- change database filtering, sorting, persistence, or view semantics;
- introduce pagination as product behavior;
- require fixed row heights or fixed column widths;
- recreate native `table-layout: auto` by rendering all hidden cells for measurement;
- migrate existing `MDList` consumers as part of this defect;
- turn `MDTable` into a generic virtual-table framework;
- introduce worker paging, indexes, batch-read protocols, or new caches without measured need;
- build a generic data-visualization framework for tree, kanban, masonry, calendar, graph, or other unconfirmed layouts;
- guarantee literally unlimited document size independent of available memory/CPU.

## Affected scenarios

Required scenarios include:

- switch from a short filtered database view to a full large view and back;
- fast view switching while previous rendering/query work may still be settling;
- vertical scrolling to deep rows;
- horizontal scrolling to deep columns;
- dynamic row height caused by wrapping, relations, editing, or other content changes;
- dynamic column width discovered from rendered content;
- inline editing of a currently visible deep cell;
- filter/sort correctness and ordering;
- relation-valued cells and other variable-height content;
- desktop and mobile viewport behavior.

## Boundaries and ownership

| Owner | Responsibility in this work |
| --- | --- |
| feature | No new business state. Existing user actions remain unchanged. |
| `entities/databaseData` | Database-specific integration: complete row/property identities, table/grid composition, visible cell rendering, database sizing policy, sticky/action behavior, and table measurement coordination. |
| widget | Composition only. Must not own virtual ranges, sizing policy, filtering, or sorting. |
| page/pane | No change expected. |
| `shared/ui/virtualization` | Upper-layer-independent dynamic virtualization primitives for large scrollable 1D/2D collections. No database, Material, selection, filter/sort, or product semantics. |
| `shared/ui/Table` | Preserve current presentation ownership by default. Change only if implementation evidence proves an unavoidable generic table-surface requirement. |
| service/worker | Preserve current canonical filter/sort result initially. Optimize only when measured compute/transfer cost remains material. |

The shared module is justified by a current lower-level responsibility, not hypothetical reuse: dynamic virtualization is required now, while database semantics must not leak into a reusable geometry engine.

## Source of truth

- ordered row membership: existing complete worker/service `itemIdList` unless profiling proves that contract itself must change;
- property membership/order: existing database property/view contract;
- stored values: existing database document state;
- virtual ranges, measurements, offsets, overscan, and discovered sizes: ephemeral presentation state only.

Virtualization must never become a second filtering, sorting, or data-ordering source of truth.

## State shape

The generic layer needs presentation facts conceptually equivalent to:

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
- scroll-container geometry;
- provisional estimates for unseen items;
- measured sizes for mounted items;
- overscan.

Database measurements use stable identities:

- rows: `DatabaseItemId`;
- columns: `DatabasePropertyId`.

Measurements are not persisted document/view facts.

## Dynamic sizing contract

Fixed dimensions are forbidden as a correctness requirement.

Required behavior:

1. unseen items may use provisional estimates only to construct virtual geometry;
2. after mount, actual DOM measurement is authoritative;
3. mounted items may change size repeatedly as content, wrapping, relations, editing, or viewport geometry changes;
4. size changes update virtual geometry without mounting the complete collection;
5. corrections before the visible anchor preserve stable scrolling rather than visibly jumping the viewport.

A mature headless engine with dynamic measurement and scroll correction is preferred over a Mioframe-owned offset/measurement algorithm. `@tanstack/vue-virtual` remains the current candidate and must pass the controlled capability proof before dependency adoption.

## Minimum sufficient design

### Shared virtualization primitive

After the candidate capability proof succeeds, add a narrow `src/shared/ui/virtualization` module.

Its abstraction is a dynamic virtual axis, not presentation-specific components such as `VirtualTable`, `VirtualCardList`, or `VirtualMaterialList`.

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

It exposes derived visible items, total virtual size, dynamic measurement integration, and `scrollToIndex`/equivalent navigation.

A two-dimensional grid is composition of one vertical and one horizontal axis. Do not create a second independent grid virtualization algorithm.

The exact names and adapter surface remain deferred until the capability experiment proves the smallest sufficient contract.

### Database grid integration

`entities/databaseData` consumes generic geometry and owns database-specific rendering:

```text
complete ordered row IDs ------> vertical virtual axis ---+
                                                        |
complete property IDs ---------> horizontal virtual axis -+--> visible cell matrix
```

Only rows/columns selected by the virtual ranges may instantiate expensive cell UI/reactive reads.

### Row sizing

Row height is dynamic. Rendered rows are measured after layout and remeasured after content/width changes. Relation content or wrapped values may increase or decrease row height without violating the virtualization contract.

### Column sizing

Column width is dynamic, but horizontal virtualization cannot know exact intrinsic width requirements of content that has never rendered.

The architecture therefore uses **progressively discovered intrinsic sizing** as the baseline model:

- unseen columns use provisional estimates;
- headers and mounted cells contribute measured requirements;
- discovering a wider requirement may enlarge the presented column;
- hidden cells are never bulk-rendered solely to discover width;
- discovered measurements remain ephemeral presentation state.

Profiling/prototype work must finalize when widths may shrink/reset, which scope owns measurement lifetime, and how width changes trigger row remeasurement. These are sizing-policy details, not a reason to return to full materialization.

### Additional optimizations

Two-axis dynamic virtualization is mandatory independently of profiling because the confirmed row/column scale makes complete DOM materialization unacceptable.

Possible secondary changes require measured evidence:

- remove duplicate/unnecessary per-cell reactive reads;
- change value-read granularity;
- optimize worker filter/sort computation;
- reduce worker-to-main transfer cost;
- introduce range/query protocols only if the complete-ID contract is proven to be a bottleneck.

Do not bundle these merely because they may improve performance.

## Simplest viable alternative

Vertical-only virtualization is simpler but insufficient because large column counts are a confirmed requirement.

Progressive full rendering is simpler but insufficient because it eventually materializes the entire logical collection and violates the bounded-rendering invariant.

The minimum complete design is therefore dynamic virtualization in both axes, database-specific two-axis composition, and no broader visualization framework.

## Rejected approaches

Rejected unless new evidence invalidates the current requirements:

- full row/column DOM materialization;
- progressive rendering that eventually mounts the complete table;
- CSS hiding or `content-visibility` as the primary scalability mechanism;
- fixed row height or fixed column width as a required contract;
- hidden offscreen rendering of all rows/cells for measurement;
- pagination solely to avoid rendering cost;
- independent custom virtualizers for table, list, and cards;
- moving database logic into generic shared virtualization;
- immediate worker paging/index infrastructure without profiling evidence;
- a generic visualization framework covering unconfirmed layouts.

## Shared UI blast radius

Intended first-pass blast radius:

- add one isolated shared virtualization module;
- database table becomes its first production consumer;
- no existing `MDList` consumer migration;
- no behavioral change to `MDTable` unless later implementation evidence proves it necessary.

Any change to existing shared list/table primitives requires separate consumer/blast-radius review.

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
| Editing | Visible values remain editable without stale writes or lost focus from ordinary virtualization updates. |
| View switching | Old virtual/measurement state does not leak into a newly selected view. |
| Reuse boundary | Generic virtualization contains no database, Material, filter/sort, selection, or product-specific contract. |

## Performance contract under investigation

Primary metrics:

- event-loop acknowledgement after the actual view-switch action;
- first frame opportunity after that action;
- maximum switch-associated main-thread long task;
- count/total duration of switch-associated long tasks;
- switch-to-usable duration;
- mounted row/column/cell counts relative to viewport/overscan;
- worker query compute latency;
- worker-to-main result delivery cost;
- scripting/component, style/layout, and paint attribution from focused profiling runs.

Initial responsiveness budget to validate in the controlled harness:

- no switch-associated main-thread block over **100 ms**;
- target individual main-thread work slices at or below the **50 ms** browser long-task threshold;
- structural bounded-rendering assertions are preferred over wall-clock-only assertions wherever possible.

These timing numbers are research targets, not yet persistent CI budgets. Profiling determines whether they are sufficiently stable and representative to promote to automated regression gates.

## Risk matrix

| Risk | Why it matters | Required resolution |
| --- | --- | --- |
| Dynamic row measurement | wrapping/relation content changes height | capability/browser proof before implementation ready |
| Dynamic column measurement | hidden content cannot provide exact intrinsic width | finalize and prove progressive sizing policy |
| Scroll anchoring | corrected sizes above viewport can jump content | browser proof with deep scrolling and resize |
| Cell reactive fan-out | visible cells may remain too expensive | profile after bounded rendering before changing read APIs |
| Worker filter/sort | 30k+ logical data still requires computation | measure separately from UI rendering |
| Worker transfer | complete ID arrays may become material at larger scales | measure before protocol change |
| Relation rendering | nested/variable content can amplify measurement/rendering | dedicated representative scenario |
| Focus/edit lifecycle | virtual removal can destroy focused elements | define expected offscreen behavior before implementation ready |
| Accessibility semantics | final DOM/layout may affect table semantics/navigation | browser/component proof against final design |
| Performance-test noise | absolute timing is hardware-sensitive | structural invariants plus controlled repeated measurements |

## Required test proof

`docs/testing/architecture.md` remains canonical.

Before production implementation readiness, resolve proof ownership for:

- deterministic adapter/geometry contracts owned by Mioframe rather than third-party behavior;
- reusable browser behavior for dynamic measurement, scrolling, and anchoring of the shared integration;
- centralized application E2E for complete database view-switch/edit/scroll behavior;
- task-specific controlled baseline/candidate performance measurements;
- persistent performance checks only for budgets proven stable and worth maintaining.

`happy-dom` cannot prove geometry, scrolling, measurement, or responsiveness. Lower-level/test-owned setup may create a valid large database document, but the view-switch action under product E2E must use the real UI.

Exact spec paths, durable impact mappings, and persistent-vs-task-specific measurement ownership are finalized after profiling and before implementation tasking.

## Required verification sequence

1. capture controlled current-implementation baseline using `docs/database-virtualization-profiling.md`;
2. run dynamic vertical, horizontal, two-axis, resize, and scroll-anchor capability experiments for the candidate engine;
3. update this architecture with measured sizing/adapter decisions and any justified secondary optimization;
4. make the implementation-readiness verdict `ready` only when public contracts, sizing semantics, proof ownership, dependency choice, and required budgets are explicit;
5. run implementation preflight before production code changes;
6. implement the accepted design;
7. rerun the same performance harness against the candidate and retain structural scalability regression proof.

## Forbidden

Do not:

- replace two-axis dynamic virtualization with full/progressive materialization without new architecture evidence;
- modify production rendering before the current baseline is captured;
- choose secondary optimization work from intuition alone;
- add permanent production diagnostics solely for one-off profiling;
- require fixed item dimensions;
- render hidden complete datasets for measurement;
- weaken filter/sort/edit behavior to satisfy performance numbers;
- add arbitrary sleeps/retries or inflated timeouts to performance/browser proof;
- expose an external virtualizer directly to database/widgets when the accepted shared adapter can own the integration;
- ask coding work to resolve architecture decisions still marked deferred here.

## Implementation readiness

Resolved architecture direction:

- two-axis virtualization is required;
- dynamic sizes are required;
- rendering cost must be viewport-bounded;
- reusable upper-layer-independent dynamic virtualization infrastructure is required;
- database-specific composition remains in `entities/databaseData`;
- service/worker remains the canonical ordering/filtering owner initially;
- profiling is controlled and automated;
- 30,000+ rows and large-column scenarios are explicit scale requirements;
- secondary optimizations require measured evidence.

Unresolved implementation blockers:

- measured baseline cost decomposition;
- candidate virtualizer capability proof in Mioframe's Vue/browser conditions;
- exact shared adapter API/dependency choice;
- final column width discovery/reset/shrink semantics;
- focus/edit behavior when a virtualized item leaves the viewport;
- final stable performance budgets and persistent-vs-task-specific ownership;
- evidence on whether worker query/transfer or per-cell read contracts need changes;
- exact proof/spec ownership and implementation file set.

Verdict: **architecture baseline accepted; production implementation not ready**.
