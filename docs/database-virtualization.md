# Database virtualization

Status: **database virtualization architecture accepted; `@tanstack/vue-virtual` selected through the shared adapter; secondary optimizations remain evidence-gated**.

This document is the architecture source of truth for large database rendering. The reusable virtualization primitive and dependency boundary are defined in `docs/virtualization-library.md`. Controlled profiling and secondary-optimization analysis are defined in `docs/database-virtualization-profiling.md`.

Virtualization is a decided part of the solution. Profiling does not decide whether database rendering is virtualized; it measures the current defect, validates the selected integration, sets budgets, and determines whether any additional optimization is justified.

## Accepted architecture

- large database rendering uses viewport-bounded rendering rather than progressive full materialization;
- rows and columns are both virtualized;
- item dimensions are dynamic and may change after mount;
- fixed row or column size is not a correctness contract;
- `@tanstack/vue-virtual` is the selected engine, imported only by `src/shared/ui/virtualization`;
- shared exposes one headless dynamic-axis primitive under the contract in `docs/virtualization-library.md`;
- database rendering composes one vertical and one horizontal axis against the same scroll element;
- there is no generic production `useVirtualGrid`, `VirtualTable`, or database-aware shared component;
- database row/column composition, cell rendering, sizing policy, editing, focus, sticky behavior, and table-specific measurement coordination remain in `entities/databaseData`;
- canonical ordered row membership remains service/worker-owned initially;
- virtualization never becomes a second source of truth for filter/sort/order/data;
- other performance changes are introduced only when profiling demonstrates a remaining bottleneck.

## Evidence-gated secondary optimizations

These are deliberately **not** accepted architecture yet:

- changing per-cell read/subscription contracts;
- batching database value/property reads;
- worker filter/sort algorithm changes;
- worker-to-main transfer changes;
- paging/range protocols;
- indexes or caches introduced for this performance problem;
- broader changes to database storage/query contracts.

Each requires a measured cause, correct owner, acceptance criterion, and proof.

## Goal

Remove multi-second UI blocking when switching from a small filtered database view to a large full view while making database rendering scale to very large logical collections.

Confirmed requirements:

- reproducible automated profiling rather than live-device-only diagnosis;
- at least 30,000 logical rows as a required scale baseline;
- very large property/column counts are valid;
- row height and column width may depend on content and may change after mount;
- virtualization infrastructure is reusable by future large collection presentations without database semantics;
- filtering, sorting, editing, scrolling, view switching, accessibility, and correctness remain intact.

Primary invariant:

> Mounted UI work is bounded by viewport and overscan, not by total logical row or column count.

For database cells, mounted work therefore scales approximately with `visibleRows * visibleColumns`, not `allRows * allColumns`.

## Confirmed current behavior

Current rendering materializes every row and every property intersection in `DatabaseDataTable.vue`. The database query path already returns the complete ordered filtered item ID list through the service/worker boundary. Rendered editable cells also establish multiple reactive reads, so full materialization multiplies component/subscription cost in addition to DOM/layout work.

This establishes why bounded rendering is required independently of the exact performance attribution. Profiling still determines how much additional work, if any, remains after virtualization.

## Ownership

| Owner | Responsibility |
| --- | --- |
| `shared/ui/virtualization` | TanStack-backed generic one-axis geometry, measurement, overscan, scroll correction, deep navigation. |
| `entities/databaseData` | Database-specific two-axis composition, cell rendering, row/column sizing policy, edit/focus behavior, sticky/action behavior, table measurement coordination. |
| widget | Composition only; no virtual ranges, sizing policy, filtering, or sorting. |
| page/pane | No performance/domain ownership change expected. |
| service/worker | Canonical filtering/sorting and ordered membership; optimize only from evidence. |
| `shared/ui/Table` | Preserve existing presentation ownership unless preflight proves a necessary generic surface change. |

## Source of truth

- ordered row membership: current worker/service item ID result;
- column/property membership and order: current database property/view contract;
- stored values: current database document state;
- virtual ranges, offsets, overscan, measurements, discovered sizes: ephemeral presentation state.

Measurements are never persisted as database facts by the virtualization layer.

## Two-axis composition

```text
complete ordered row IDs ------> vertical useVirtualAxis ---+
                                                        |
complete property IDs ---------> horizontal useVirtualAxis -+--> visible cell matrix
```

Both axes use the same physical scroll element. Only intersections selected by both current virtual ranges instantiate expensive cell UI/reactive reads.

No shared grid coordinator is required for the initial implementation.

## Row sizing

Rows are dynamically measured DOM items.

The vertical shared axis uses the TanStack-backed `measureElement` path. Wrapping, relation content, editing, and column-width changes may alter height after mount and must remeasure the row without full-collection remount.

A column width change can therefore trigger:

```text
column width changes
       ↓
visible cells reflow
       ↓
row height changes
       ↓
measureElement / ResizeObserver
       ↓
vertical geometry updates
```

## Column sizing

Horizontal virtualization cannot know the intrinsic width requirement of content that has never rendered. Exact full native-table auto sizing across every hidden row is therefore not a valid requirement alongside bounded rendering.

`entities/databaseData` owns a column measurement coordinator:

```text
header measurement
      +
visible cell measurements
      ↓
database column sizing policy
      ↓
shared setItemSize(columnIndex, width)
      ↓
TanStack resizeItem
```

Initial semantics to validate in browser tests:

- unseen columns use provisional estimates;
- headers and mounted cells contribute actual requirements;
- hidden cells are never bulk-mounted only for sizing;
- width changes reflow and remeasure visible rows;
- repeated scrolling must not cause destructive width oscillation.

Still to finalize before database implementation preflight:

- whether discovered width is grow-only within a view/session;
- when a column may shrink;
- measurement reset boundary;
- min/max width policy;
- viewport-resize behavior.

These are database presentation decisions, not shared virtualizer responsibilities.

## Focus and editing

Shared virtualization owns geometry and `scrollToIndex`, not focus or edit state.

`entities/databaseData` must define before implementation preflight:

- behavior when a focused/editing cell approaches the virtual boundary;
- keyboard navigation to offscreen logical rows/columns;
- overlays/editors whose anchor cell leaves the range;
- view switching while editing.

Keeping the full dataset mounted is not an allowed solution.

## Selected engine boundary

`@tanstack/vue-virtual` is fixed as the virtualization engine through `src/shared/ui/virtualization`.

Database code must not import TanStack directly or depend on TanStack-specific public types/options. The integration proof verifies actual Mioframe use of dynamic vertical/horizontal sizing, one shared scroll container, deep navigation, post-mount resize, and scroll anchoring.

Reopen the engine decision only if required behavior would otherwise force Mioframe to own substantial general-purpose virtualization machinery. Narrow adapter code or an ordinary integration quirk is not sufficient reason.

## Simplest viable design

Rejected simpler alternatives:

- vertical-only virtualization — insufficient because large column counts are confirmed;
- progressive full rendering — eventually recreates O(rows × columns) mounted UI;
- `content-visibility`/CSS hiding — does not prevent expensive Vue/component/subscription creation;
- fixed-size virtualization — violates dynamic content requirements;
- generic grid/table/list rendering framework — broader than current needs;
- custom Mioframe virtualizer — duplicates mature infrastructure and creates unnecessary ownership.

The minimum complete rendering solution is therefore two dynamic virtual axes from the shared TanStack-backed primitive plus database-owned composition.

## Shared UI blast radius

Initial implementation should:

- add `@tanstack/vue-virtual`;
- add isolated `src/shared/ui/virtualization` with tests/public entry point;
- make database rendering its first production consumer;
- not migrate existing `MDList` consumers;
- not put virtualization into `MDTable` or Material components merely to support this feature.

Any required change to an existing shared list/table primitive needs its own consumer/blast-radius review.

## Acceptance matrix

| Contract | Required outcome |
| --- | --- |
| Large rows | 30,000+ logical rows do not cause full row materialization. |
| Large columns | Large property counts do not cause full column/cell materialization. |
| Combined scale | Mounted cells remain bounded by viewport ranges plus overscan. |
| Dynamic sizes | Correctness does not rely on fixed dimensions; post-mount changes work. |
| Responsiveness | Switching to the large view does not create multi-second main-thread blocking. |
| Correctness | Full/filtered views retain exact membership and sorting. |
| Scrolling | Deep vertical and horizontal targets are reachable and stable. |
| Editing | Visible deep cells remain editable with correct persistence/state. |
| View switching | No stale virtual/measurement state leaks between views. |
| Dependency boundary | Database/future consumers do not depend directly on TanStack APIs. |
| Reuse boundary | Shared virtualization contains no database, Material, filter/sort, selection, or business semantics. |

## Performance analysis

`docs/database-virtualization-profiling.md` owns the controlled measurement plan.

Research targets currently include:

- event-loop yield after the real view-switch interaction;
- frame opportunity;
- max/count/total browser long tasks;
- target-view usability time;
- mounted row/column/cell counts;
- worker query cost and result delivery when material;
- script/layout/paint attribution through selected CDP diagnostic runs.

Initial timing targets remain research targets, not permanent CI budgets:

- no switch-associated main-thread block above 100 ms;
- preferred work slices at or below the 50 ms long-task threshold.

Persistent proof should favor structural bounded-rendering invariants where possible.

## Secondary optimization gate

After a bounded-rendering implementation exists, rerun the same profiling harness.

Then:

1. visible-range setup expensive → profile and reduce only proven cell read/subscription cost;
2. worker filter/sort expensive → design worker-owned query optimization;
3. result transfer expensive → quantify before changing query protocol;
4. measurement/layout expensive → simplify database sizing/integration before adding caches/state;
5. no material remaining bottleneck → stop optimizing.

## Forbidden

- make virtualization conditional on profiling reproducing the freeze;
- expose TanStack directly to database/widgets;
- implement another generic virtualization algorithm beside TanStack;
- require fixed item dimensions;
- mount hidden full datasets for measurement;
- move database sizing/edit/focus policy into shared virtualization;
- change filter/sort behavior to make rendering cheaper;
- add worker batching/index/paging/read APIs without measured evidence;
- add production diagnostics solely for one-off profiling;
- weaken performance/browser proof with sleeps, retries, or timeout inflation.

## Implementation readiness

### Shared virtualization library

Architecture: **accepted**. Engine: **`@tanstack/vue-virtual` selected**.

Remaining gate: focused integration proof and implementation preflight for exact API/test paths.

### Database virtualization

Architecture and ownership: **accepted**.

Remaining implementation-preflight decisions:

- column discovery/reset/shrink semantics;
- focus/edit lifecycle;
- exact DOM/table layout integration;
- exact proof/spec paths;
- final adapter TypeScript signatures after the TanStack integration proof.

### Secondary optimizations

Status: **not architected; evidence-gated**.

Overall verdict: **virtualization architecture and engine selection are fixed; production implementation waits only for the focused integration/preflight decisions, while all non-virtualization optimizations remain open by design**.
