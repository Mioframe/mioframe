# Database virtualization

Status: **architecture accepted; shared `useVirtualCollection` capability passed; native-table capability passed deterministically; production migration architecture resolved; implementation and profiling remain in PR #217**.

This document is the architecture source of truth for large database rendering in PR #217 (`fix/database-large-data-performance`). Shared virtualization API is defined in `src/shared/ui/virtualization/README.md`; browser capability proof is in `docs/database-virtualization-browser-proof.md`; production migration handoff is in `docs/database-virtualization-production-handoff.md`; production implementation preflight is in `docs/database-virtualization-production-preflight.md`; performance evidence is owned by `docs/database-virtualization-profiling.md`.

## Goal

Make database rendering scale to at least 30,000 rows and hundreds of properties, including 30,000 × 300 = 9,000,000 logical row/property intersections, without multi-second main-thread blocking while preserving filter/sort correctness, editing, relations, table semantics, and mobile/desktop usability.

Primary invariant:

> Mounted expensive UI is bounded by viewport and overscan, not by total logical rows or columns.

The complete Notion performance task, including production migration, product proof, profiling, evidence-gated follow-up fixes, and merge readiness, remains inside PR #217. The completed capability stage is a prerequisite, not a standalone final deliverable.

## Non-goals

- no worker/query/storage redesign before profiling proves it necessary;
- no paging or batch protocol introduced only to support virtualization;
- no generic virtual table/grid/list component;
- no second measurement, cache, range, or scroll-anchor engine;
- no change to canonical filter/sort membership or ordering rules;
- no redesign of Database actions, relation semantics, or editing UX beyond lifecycle safety required by virtual unmount.

## Accepted architecture

- `@tanstack/vue-virtual` is the selected and only geometry engine.
- `src/shared/ui/virtualization/useVirtualCollection` is the only Mioframe virtualization boundary.
- Database composes one virtual collection for rows and one for properties.
- Shared virtualization owns collection/range/measurement binding only; it does not render database DOM.
- Native `<table>` flow remains the production rendering model unless focused product proof demonstrates a blocker requiring substantial custom geometry machinery.
- Rows and properties are both virtualized.
- TanStack is the only virtual geometry engine/cache.
- Database does not keep parallel row-height or column-width maps.
- Service/worker remains canonical for row membership/order/filter/sort.
- Secondary worker/query/subscription optimizations require evidence after bounded rendering exists in production.

## Ownership

| Owner                       | Responsibility                                                                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `shared/ui/virtualization`  | Generic one-axis logical collection -> virtual items/extents + `vItem` measurement directive.                                                                |
| `entities/databaseData`     | Native table DOM, row/column collection composition, spacer DOM, database column sizing policy, logical table accessibility, sticky action-cell integration. |
| `entities/databaseValue`    | Narrow domain value read/write entry points used by inline editing; no widget-owned service access.                                                          |
| database widget/composition | Physical scroll-root wiring, truthful surface offsets, toolbar/`after` composition, active inline-edit session lifecycle, relation/nested-view root wiring.  |
| service/worker              | Canonical filter/sort/order/data contracts.                                                                                                                  |
| `shared/ui/Table`           | Existing table presentation only; no virtualization responsibility.                                                                                          |

## Source of truth

- logical rows/order: existing service `filteredIdList` result exposed through `useDatabaseData`;
- logical properties/order: existing `propertiesIdList` contract;
- values: database document state through entity/service contracts;
- active database view: existing `useDatabaseViewSelection` effective view contract;
- vertical geometry: TanStack through the row `useVirtualCollection` instance keyed by `DatabaseItemId`;
- horizontal geometry: TanStack through the property `useVirtualCollection` instance keyed by `DatabasePropertyId`;
- top-level scroll root: the existing `.database-view` element with `overflow: auto`;
- nested relation scroll root: the explicit relation composition overflow owner;
- active inline draft: one widget-owned active edit session when an editor is open.

Virtual geometry is ephemeral and never persisted.

## Production composition

### Top-level database

`DatabaseViewWidget` keeps `.database-view` as the physical two-dimensional scroll root.

`DatabaseViewLayout` becomes an explicit composition container instead of relying on inherited attributes/ref landing on `DatabaseDataTable`. It receives the physical scroll root explicitly and composes:

```text
.database-view (physical 2D scroll root)
  optional content before table
  DatabaseViewLayout
    DatabaseDataTable
    after / DatabaseToolbar placeholder
```

The toolbar/`after` surface is widget composition and must not remain inside `<tfoot>`.

### Nested relation database

`RelationValueFieldData` still consumes `DatabaseDataTable`, but the relation composition passes its actual overflow root explicitly. No `closest()`, computed-style inspection, or generic scroll-parent discovery is allowed.

Nested relation rendering remains a consumer of the same `DatabaseDataTable` contract; it does not introduce another virtualization abstraction.

## Rendering model

Use semantic table tags and native table flow:

```text
<table>
  <colgroup>
    [left virtual spacer]
    [visible property columns]
    [right virtual spacer]
    [optional fill]
    [action column]
  </colgroup>

  <thead>
    [left spacer]
    [visible property headers]
    [right spacer]
    [fill]
    [sticky action header]
  </thead>

  <tbody>
    [top virtual spacer row]
    [visible logical rows]
    [bottom virtual spacer row]
  </tbody>
</table>
```

Virtual spacer/fill DOM is presentation-only and excluded from logical accessibility semantics.

Only the current virtual row × virtual property intersection creates expensive value cells. The full logical cross product must never be materialized in Vue or DOM.

If focused production proof shows native flow cannot satisfy required geometry without substantial custom machinery, stop implementation and return evidence for architecture review before selecting a fallback. Do not switch to div/ARIA-grid rendering by default.

## Row integration

`DatabaseDataTable` continues to obtain its row collection from `useDatabaseData`; service behavior is unchanged.

```ts
const rows = useVirtualCollection(itemIdList, {
  root: scrollRoot,
  key: (itemId) => itemId,
  estimateSize: ROW_ESTIMATE,
  surfaceOffset: verticalTableOffset,
});

const vVirtualRow = rows.vItem;
```

Database renders only `rows.items` and applies `vItem` to each real logical `<tr>`.

Top/bottom extents come from `rows.leadingSize` / `rows.trailingSize`.

No UI-side filtering, sorting, slicing, membership reconstruction, or alternate row-order state is introduced.

## Property integration

`DatabaseDataTable` virtualizes the existing ordered property ID collection directly.

```ts
const columns = useVirtualCollection(properties, {
  root: scrollRoot,
  key: (propertyId) => propertyId,
  estimateSize: COLUMN_ESTIMATE,
  axis: 'horizontal',
  surfaceOffset: horizontalTableOffset,
});

const vVirtualColumn = columns.vItem;
```

The exact same `columns.items` range is used for `<th>` and every mounted data row.

Left/right extents come from `columns.leadingSize` / `columns.trailingSize`.

The action column is not a logical database property and is excluded from this collection.

## Surface offsets

The physical scroll root and the logical collection surface are different concepts.

For each axis, Database must provide the truthful current distance from the explicit scroll root origin to the table collection surface origin through `surfaceOffset`.

Requirements:

- compute offsets from known composition-owned DOM only;
- support non-zero vertical offset caused by content before the table;
- support horizontal offset caused by the table position within the scroll root;
- update the reactive offset when composition/layout changes can move the surface;
- do not introduce an independent item `ResizeObserver`, geometry cache, range registry, or scroll-anchor algorithm;
- do not discover roots heuristically.

Direct DOM geometry reads at the composition owner are acceptable. A narrow existing VueUse element-geometry primitive may maintain root-to-surface offset if required by composition changes; it must not observe or cache virtual item geometry. TanStack remains owner of item measurement and scroll correction.

## Dynamic sizing

### Rows

Each mounted logical row is measured from its real `<tr>` through `vItem`.

Rows must support growth and shrink after mount. Visible-column changes, wrapping, relation content, and editing may alter height. TanStack owns measurement updates and scroll correction.

No row-height cache exists outside TanStack.

Production migration must not copy capability-only `white-space: nowrap` styling into product cells when that would change existing wrapping behavior.

### Columns

Each visible property uses its `<th>` as the horizontal measurement owner. Native table layout aggregates mounted header/body content before the resulting width is measured.

Column policy:

1. unseen property starts from an estimate;
2. mounted native layout discovers width;
3. TanStack caches it by stable property ID;
4. later wider mounted content may grow it;
5. public virtual item `size` may provide remount `min-width` so ordinary horizontal scrolling does not shrink/regrow the column;
6. live shrink of a previously discovered width is not required;
7. a full table/presentation remount may rediscover geometry.

Do not add a separate width map or reset protocol without a measured production requirement.

## Two-axis composition

```text
service item IDs -> useVirtualCollection(vertical) ---+
                                                     +--> visible cell intersections
property IDs ----> useVirtualCollection(horizontal) -+
```

No generic 2D coordinator is introduced.

## Sticky surfaces

### Header

Native table header behavior remains owned by the existing table presentation/composition. Migration must preserve sticky header behavior while horizontal and vertical virtual spacers are present.

### Action column

The action column remains mounted for every mounted logical row, stays at the trailing edge, and is excluded from horizontal logical property virtualization.

Its sticky/elevation behavior remains product composition behavior; virtualization must not turn it into a virtual property.

## Toolbar / `after`

The current `after` slot is widget composition, not table data.

Production migration removes it from `<tfoot>` and renders it as a sibling after `DatabaseDataTable` inside `DatabaseViewLayout`. The existing floating toolbar still receives the real `.database-view` as its auto-hide target.

Do not add virtualization responsibility to `MDTable` or represent toolbar controls as table rows.

## Inline editing

### Confirmed lifecycle problem

Current `EditableInlineValue` stores `showEditForm` and draft state locally. With virtualized rows/columns, an editing cell can be unmounted by scrolling or a view change; component-local state alone therefore cannot guarantee draft preservation.

### Accepted owner

Database widget/composition owns at most one active inline-edit session for the top-level database surface.

The session contains only narrow UI/domain state required to survive cell unmount:

- `itemId`;
- `propertyId`;
- current draft value;
- active/resolving state required to serialize commit/cancel/view-switch behavior.

It must not contain service clients, provider objects, geometry, virtual range state, DOM elements, or broad database models.

`entities/databaseValue` exposes the narrow value write operation needed to resolve a lifted session. Widget code must not bypass entity contracts with direct `shared/service` access.

### Lifecycle contract

- opening an editor creates/claims the active session and seeds the draft from the current effective value;
- editing updates the active session draft before the cell can disappear;
- Escape cancels and clears the session without writing;
- normal commit writes through the existing domain contract and clears only after success;
- before a virtual range update can destroy the active editor, its draft already belongs to the active session, so unmount itself cannot lose it;
- if the active cell leaves the mounted range, resolve the session deterministically according to the same commit semantics; failed persistence must not silently discard the draft;
- returning to the same logical cell while its session remains active restores that session rather than reseeding from stale display state;
- starting a different cell edit resolves the previous active session first;
- a database view switch resolves the active edit before changing explicit view selection; if resolution fails, the old view remains active and the draft remains recoverable;
- ordinary scrolling does not close an editor while its cell remains mounted.

Do not introduce pinning, custom range extraction, a generic edit manager, or global editor registry.

## View switching

The existing `useDatabaseViewSelection` contract remains the owner of effective selection. Virtualization must not add parallel view state.

Production behavior:

1. user requests another view;
2. widget resolves any active inline edit;
3. after successful resolution, update explicit view selection through the existing contract;
4. service emits the new exact filtered/sorted row ID list;
5. row virtual collection reacts to the new source;
6. no stale old-view row or cell remains mounted after the new source settles.

The critical performance scenario is short filtered view -> full large view over the same database.

## Relations

Relations have two separate risks:

1. relation values may increase mounted row height dynamically;
2. relation editing renders another `DatabaseDataTable` inside an independently scrolling relation surface.

Requirements:

- dynamic outer row height remains TanStack-measured;
- nested table receives its own explicit physical root;
- nested virtualization instances do not share geometry state with the outer table;
- relation filtering/sorting/view selection continue through existing service/entity contracts;
- representative recursive/related rendering remains behaviorally equivalent;
- no root discovery by DOM heuristics.

## Accessibility

Preserve native table semantics and remove current `role="list"` / `role="listitem"` overrides in the virtualized production target.

Logical metadata:

- `aria-rowcount` = header row + full logical data-row count;
- `aria-colcount` = full logical property count + action column when present;
- logical data row at zero-based index `i` uses `aria-rowindex = i + 2`;
- logical property at zero-based index `j` uses `aria-colindex = j + 1`;
- action cells use the trailing logical column index;
- virtual spacer/fill DOM is hidden from logical accessibility semantics.

Do not introduce ARIA grid/spreadsheet keyboard behavior.

## Mobile and desktop

The same ownership and DOM model applies to both product layouts. Production browser proof must preserve:

- two-dimensional scrolling under mobile viewport constraints;
- edit overlay usability and focus behavior;
- sticky header/action behavior where applicable;
- toolbar reachability and auto-hide behavior;
- relation editing composition.

Do not create a separate mobile virtualization path without evidence that the shared production path cannot satisfy the supported viewport behavior.

## Production proof

Application E2E owns complete product scenarios because migration crosses widget, entity, service, editing, relation, and scrolling boundaries.

Required product proof after migration:

- exact filter membership and sort order remain unchanged;
- short filtered -> full large -> short switching;
- no stale cells from the previous view;
- bounded actual mounted logical rows, property headers, and expensive data-cell `<td>` elements;
- deep vertical and horizontal scrolling reaches correct logical sentinels;
- non-zero production surface offset with actual `.database-view` root;
- dynamic row sizing through representative product content;
- progressive native-table column sizing/remount behavior;
- sticky header/action behavior;
- inline edit commit, Escape cancel, vertical eviction, horizontal eviction, and view-switch resolution without silent draft loss;
- representative relation/nested database rendering with explicit root wiring;
- toolbar/`after` outside table semantics;
- logical accessibility counts/indices;
- desktop and mobile applicability according to existing E2E project metadata.

Use public DOM/user behavior as evidence; do not assert TanStack private state.

## Performance acceptance

After production bounded rendering exists, execute the matrix in `docs/database-virtualization-profiling.md`, including required G1 = 30,000 × 300.

Durable invariant:

> For fixed viewport and overscan, mounted expensive rows, columns, and cells remain bounded independently of total logical dataset size.

Research responsiveness targets for the real short -> full interaction:

- no switch-associated main-thread block > 100 ms;
- prefer individual slices <= 50 ms.

Measure in-page browser timing, including event-loop yield, first frame opportunity, switch-to-usable, and Long Task max/count/total. Playwright command duration is not the performance metric.

## Secondary optimization gate

After bounded rendering is implemented, profile first. Only measured remaining bottlenecks may justify changes in this order:

1. visible-cell subscription/setup cost;
2. worker filter/sort cost;
3. worker -> main transfer;
4. batching/paging;
5. indexes/caches.

Any such change requires a new narrow architecture decision inside PR #217 before implementation. Do not pre-approve worker/query/storage redesign in this document.

## Existing capability result

The pre-production capability gate is complete and remains valid.

Passed contracts include:

- bounded row/column/cell DOM at large logical size;
- direct actual mounted logical `<td>` count at initial and deep 2D ranges;
- native spacer rows/columns;
- deep vertical/horizontal geometry;
- dynamic row grow and shrink;
- body-driven column growth and remount stability;
- non-zero `surfaceOffset` geometry;
- above-viewport resize anchor correction;
- actual `MDTable` behavior in Chromium and Firefox;
- native table semantics and logical ARIA metadata.

The risk-specific stability diagnostic reported 300/300 executions with no retries/flaky classification after correcting the two geometry proof races.

Capability proof is a prerequisite, not final product acceptance.

## Forbidden

- direct TanStack imports in database production/capability consumers;
- another Mioframe virtualization wrapper beside `useVirtualCollection`;
- custom offset/range/anchor algorithms;
- independent virtual-item `ResizeObserver` or geometry cache;
- hidden full-dataset measurement;
- generic `VirtualGrid`, `VirtualTable`, `VirtualList`, edit manager, or pinning API;
- heuristic scroll-parent discovery;
- UI-side reconstruction of filter/sort/order;
- toolbar controls represented as table rows;
- widget direct `shared/service` access when an entity contract owns the operation;
- worker/query/batching/index changes without profiling evidence;
- product-wide `white-space: nowrap` or other capability-fixture styling copied without preserving current behavior;
- sleeps, force, broad retries, timeout inflation, or tolerance weakening in proof.

## Readiness

Architecture: **ready for production implementation**.

Shared collection API capability: **passed**.

Database native-table capability: **passed deterministically**.

Production migration handoff: **ready**.

Production migration preflight: **ready**.

Production implementation, product proof, profiling, any evidence-gated follow-up optimization, final semantic review, and exact-head CI are still required before PR #217 can merge.
