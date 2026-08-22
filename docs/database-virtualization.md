# Database virtualization

Status: **architecture accepted; shared `useVirtualCollection` capability passed; native-table capability passed deterministically; ready for production database migration architecture/preflight; secondary optimizations evidence-gated**.

This document is the architecture source of truth for large database rendering. Shared virtualization API is defined in `src/shared/ui/virtualization/README.md`; browser capability proof is in `docs/database-virtualization-browser-proof.md`; performance evidence is in `docs/database-virtualization-profiling.md`.

## Goal

Make database rendering scale to at least 30,000 rows and very large property counts without multi-second main-thread blocking while preserving filter/sort correctness, editing, relations, table semantics, and mobile/desktop usability.

Primary invariant:

> Mounted expensive UI is bounded by viewport and overscan, not by total logical rows or columns.

## Accepted architecture

- `@tanstack/vue-virtual` is the selected engine.
- `src/shared/ui/virtualization/useVirtualCollection` is the only Mioframe virtualization boundary.
- Database composes one virtual collection for rows and one for properties.
- Shared virtualization owns collection/range/measurement binding only; it does not render database DOM.
- Native `<table>` flow remains the preferred rendering model.
- Rows and properties are both virtualized.
- TanStack is the only virtual geometry engine/cache.
- Database does not keep parallel row-height or column-width maps.
- Service/worker remains canonical for row membership/order/filter/sort.
- Secondary worker/query/subscription optimizations require evidence after bounded rendering exists in production.

## Ownership

| Owner                      | Responsibility                                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `shared/ui/virtualization` | Generic one-axis logical collection -> virtual items/extents + `vItem` measurement directive.                                                                |
| `entities/databaseData`    | Native table DOM, row/column collection composition, spacer DOM, database column sizing policy, logical table accessibility, sticky action-cell integration. |
| database widgets           | Physical scroll-root wiring, toolbar/after composition, edit lifecycle, relation/nested-view composition.                                                    |
| service/worker             | Canonical filter/sort/order/data contracts.                                                                                                                  |
| `shared/ui/Table`          | Existing table presentation only; no virtualization responsibility.                                                                                          |

## Source of truth

- logical rows/order: existing worker/service item IDs;
- logical properties/order: current view/property contract;
- values: database document state;
- vertical geometry: TanStack through the row `useVirtualCollection` instance keyed by `DatabaseItemId`;
- horizontal geometry: TanStack through the property `useVirtualCollection` instance keyed by `DatabasePropertyId`;
- scroll root: explicit widget/composition DOM owner;
- inline draft: current edit owner until commit/cancel.

Virtual geometry is ephemeral and never persisted.

## Rendering model

Use semantic table tags and native table flow first:

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
    [visible rows]
    [bottom virtual spacer row]
  </tbody>
</table>
```

Virtual spacer DOM is presentation-only and excluded from logical accessibility semantics.

If focused production proof shows native flow cannot satisfy required geometry without substantial custom machinery, stop and return evidence for architecture review before selecting a fallback. Do not switch to div/ARIA-grid rendering by default.

## Row integration

```ts
const rows = useVirtualCollection(itemIdList, {
  root: scrollRoot,
  key: (itemId) => itemId,
  estimateSize: ROW_ESTIMATE,
  surfaceOffset: tableOffset,
});

const vVirtualRow = rows.vItem;
```

Database renders only `rows.items` and applies `v-virtual-row="row"` to each real `<tr>`.

Top/bottom extents come from `rows.leadingSize` / `rows.trailingSize`.

Database does not bind TanStack index attributes or call `measureElement` directly.

## Property integration

```ts
const columns = useVirtualCollection(properties, {
  root: scrollRoot,
  key: (propertyId) => propertyId,
  estimateSize: COLUMN_ESTIMATE,
  axis: 'horizontal',
  surfaceOffset: tableHorizontalOffset,
});

const vVirtualColumn = columns.vItem;
```

The exact same `columns.items` range is used for `<th>` and every mounted data row.

Left/right extents come from `columns.leadingSize` / `columns.trailingSize`.

## Dynamic sizing

### Rows

Each mounted logical row is measured from its real `<tr>` through `vItem`.

Rows must support growth and shrink after mount. Visible-column changes, wrapping, relation content, and editing may alter height. TanStack owns measurement updates and scroll correction.

No row-height cache exists outside TanStack.

### Columns

Each visible property uses its `<th>` as the horizontal measurement owner. Native table layout aggregates mounted header/body content before the resulting width is measured.

Column policy:

1. unseen property starts from an estimate;
2. mounted native layout discovers width;
3. TanStack caches it by stable property ID;
4. later wider mounted content may grow it;
5. public virtual item `size` may provide remount `min-width` so normal horizontal scrolling does not shrink/regrow the column;
6. live shrink of a previously discovered width is not required;
7. a full table/presentation remount may rediscover geometry.

Do not add a separate width map or reset protocol without a production requirement.

## Two-axis composition

```text
item IDs ----> useVirtualCollection(vertical) ---+
                                                 +--> visible cell intersections
properties --> useVirtualCollection(horizontal) -+
```

Only current row/column intersections instantiate expensive cells. No generic grid coordinator is introduced.

## Scroll topology

### Top-level database

Existing `.database-view { overflow: auto }` remains the intended physical 2D scroll root.

The table may start after other content in the same root, so database computes truthful table surface offsets and passes them through `surfaceOffset`; database does not know TanStack scroll-margin terminology.

### Capability finding

Using actual `MDTable` itself as the physical scroll root was rejected: native auto-table min-content behavior caused the table to grow rather than behave as a stable viewport. A dedicated fixed-size overflow wrapper with real `MDTable` inside proved the intended external-scroll-root topology in Chromium and Firefox.

This matches production ownership: the product scroll root belongs to composition, not `MDTable`.

### Lifetime

A `useVirtualCollection` instance and its physical root identity have the same lifetime. If composition structurally replaces the physical root, recreate/remount the owner.

### Nested relations

Nested relation root wiring remains a production-integration concern. Pass truthful roots explicitly; do not discover them with `closest()` or style heuristics.

## Sticky action column

The action column is not a logical database property and is excluded from the horizontal virtual collection. It remains mounted for every mounted row and stays sticky at the trailing edge.

## Toolbar / `after`

The current `after` slot is widget composition, not table data. Production migration moves it out of `<tfoot>` and composes it beside the table.

Do not add virtualization responsibility to `MDTable`.

## Inline editing

Virtualization owns geometry only.

Required production behavior:

- ordinary scrolling does not close an editor while its cell remains mounted;
- Escape remains cancel;
- before virtual eviction destroys an editing cell, its current draft is captured/resolved so it is not silently lost;
- view switch resolves active edit before old-view cells disappear;
- no generic pinning/range-extractor abstraction is introduced first.

Prefer current cell-local ownership. Lift only the active edit session if production proof shows cell-local lifecycle cannot resolve eviction deterministically.

## Accessibility

Preserve native table semantics and remove current `role="list"` / `role="listitem"` overrides in the virtualized production target.

- `aria-rowcount` = header + logical rows;
- `aria-colcount` = logical properties + action column when present;
- logical row `i` uses `aria-rowindex = i + 2`;
- logical property `j` uses `aria-colindex = j + 1`;
- action cells use the trailing logical column index;
- virtual spacer/fill DOM is absent from logical semantics.

Do not introduce ARIA grid/spreadsheet keyboard behavior.

## Capability gate result

The pre-production capability gate is complete.

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

The two previously intermittent geometry proofs were corrected to require self-consistent stable browser snapshots. The `--repeat 10` stability diagnostic reported 300/300 executions with no retries/flaky classification.

See `docs/database-virtualization-browser-proof.md` and `docs/database-virtualization-collection-api-result.md`.

## Production proof after migration

Production migration must prove:

- short filtered -> full large view switching;
- exact filter/sort membership/order;
- bounded mounted rows/columns/cells;
- deep vertical/horizontal scrolling;
- actual `.database-view` root/surface offset and sticky header/action behavior;
- edit eviction/view-switch behavior;
- representative relation nesting;
- toolbar/`after` outside table semantics;
- desktop/mobile correctness;
- controlled performance targets from the profiling plan.

## Secondary optimization gate

After bounded rendering is implemented in production, rerun profiling. Only measured remaining bottlenecks may justify cell-subscription, worker/query/transfer, paging, indexes, caches, or other secondary optimization.

## Forbidden

- direct TanStack imports in database production/capability consumers;
- another Mioframe virtualization wrapper beside `useVirtualCollection`;
- custom offset/range/anchor algorithms;
- independent ResizeObserver or geometry cache;
- hidden full-dataset measurement;
- generic `VirtualGrid`, `VirtualTable`, `VirtualList`, or pinning APIs;
- heuristic scroll-parent discovery;
- toolbar controls represented as table rows;
- worker/query/batching/index changes without evidence;
- sleeps, force, broad retries, timeout inflation, or tolerance weakening in proof.

## Readiness

Architecture: **ready**.

Shared collection API capability: **passed**.

Database native-table capability: **passed deterministically**.

Production database migration has **not started**. Its architecture/preflight is the next stage.
