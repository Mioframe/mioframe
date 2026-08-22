# Database virtualization

Status: **architecture revised; direct TanStack integration selected; native-table-first capability proof pending; secondary optimizations evidence-gated**.

This document is the architecture source of truth for large database rendering. Dependency policy is in `docs/virtualization-library.md`; browser capability proof is in `docs/database-virtualization-browser-proof.md`; performance evidence is in `docs/database-virtualization-profiling.md`.

## Goal

Make database rendering scale to at least 30,000 rows and very large property counts without multi-second main-thread blocking while preserving filter/sort correctness, editing, relations, table semantics, and mobile/desktop usability.

Primary invariant:

> Mounted expensive UI is bounded by viewport and overscan, not by total logical rows or columns.

## Accepted architecture

- `@tanstack/vue-virtual` is used directly by `entities/databaseData`.
- Database owns one vertical and one horizontal TanStack virtualizer.
- No shared Mioframe virtualization wrapper exists while database is the only confirmed production consumer.
- Native `<table>` flow remains the preferred rendering model.
- Rows and properties are both virtualized.
- TanStack is the only virtual geometry engine/cache.
- Database does not keep parallel row-height or column-width maps.
- Service/worker remains canonical for row membership/order/filter/sort.
- Secondary worker/query/subscription optimizations require evidence after bounded rendering exists.

## Ownership

| Owner | Responsibility |
| --- | --- |
| `entities/databaseData` | Direct TanStack setup, native table DOM, two-axis composition, spacer DOM, database sizing policy, logical table accessibility, sticky action-cell integration. |
| database widgets | Physical scroll-root wiring, toolbar/after composition, edit lifecycle, relation/nested-view composition. |
| service/worker | Canonical filter/sort/order/data contracts. |
| `shared/ui/Table` | Existing table presentation only; no virtualization responsibility. |

External vendor imports are allowed in the entity implementation; internal FSD dependencies still follow `entities -> shared`.

## Source of truth

- logical rows/order: existing worker/service item IDs;
- logical properties/order: current view/property contract;
- values: database document state;
- vertical geometry: TanStack measurement cache keyed by `DatabaseItemId`;
- horizontal geometry: TanStack measurement cache keyed by `DatabasePropertyId`;
- scroll root: explicit widget/composition DOM owner;
- inline draft: current edit owner until commit/cancel.

Virtual geometry is ephemeral and is never persisted.

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

Virtual spacer DOM is presentation-only and hidden from accessibility semantics.

If a focused browser proof shows native flow cannot satisfy required geometry without substantial custom machinery, the first fallback is semantic table tags with virtualization-compatible CSS grid/flex/positioning. Do not jump directly to a div/ARIA-grid implementation.

## Direct TanStack integration

Use TanStack's normal Vue API locally. Vendor conventions such as `data-index`, `measureElement`, `getVirtualItems`, `getTotalSize`, `scrollMargin`, and `scrollToIndex` remain private database implementation details.

Do not wrap these merely to rename them.

If `DatabaseDataTable.vue` becomes materially unreadable, a database-local helper such as `useDatabaseVirtualization.ts` may be extracted. It must remain specific to the current database rendering problem and must not become a generic axis/grid API.

## Dynamic row sizing

Each mounted logical row is measured from its real `<tr>`.

Rows must support both growth and shrink after mount. Visible-column changes, wrapping, relation content, and editing may change row height. TanStack owns measurement updates and scroll correction.

There is no row-height cache outside TanStack and no attempt to pre-measure hidden columns.

## Dynamic column sizing

Each visible property uses its `<th>` as the horizontal measurement owner. Native table layout aggregates mounted header/body content before TanStack reads the resulting width.

Exact intrinsic width across never-rendered rows is not required.

Column sizing policy is intentionally simple:

1. unseen property starts from an estimate;
2. mounted native table layout discovers a width;
3. TanStack caches it by stable property ID;
4. later wider mounted content may grow it;
5. cached `virtualColumn.size` may be used as the remount `min-width` so normal horizontal scrolling does not shrink/regrow columns;
6. live shrink of a previously discovered column width is **not** a required contract in this work;
7. a full table/presentation remount may start geometry discovery again.

Do not add a responsive-reset protocol or parallel width map without a current product requirement.

## Two-axis composition

```text
item IDs ----> row virtualizer ------+
                                      +--> visible cell intersections
properties --> column virtualizer ---+
```

Only current row/column intersections instantiate expensive cells.

No generic grid coordinator is introduced.

## Scroll topology

### Top-level database

Existing `.database-view { overflow: auto }` remains the physical two-dimensional scroll root. `DatabaseViewLayout` must stop treating `DatabaseDataTable` itself as the scroll owner.

The production integration may use TanStack `scrollMargin`/scroll padding directly where the table surface is offset within that root or sticky surfaces occlude navigation.

### Lifetime rule

A virtualizer instance and its scroll-root identity have the same lifetime. Do not design arbitrary live scroll-root replacement.

If composition replaces the physical scroll root, recreate/remount the owning virtualization instance.

### Nested relations

Nested relation root wiring remains a production-integration concern. Pass the truthful roots explicitly; do not discover them through `closest()` or computed-style heuristics.

## Sticky action column

The action column is not a logical database property and is excluded from horizontal virtualizer count. It remains mounted for every mounted row and stays sticky at the trailing edge.

## Toolbar / `after`

The current `after` slot is widget composition, not table data. Production migration moves it out of `<tfoot>` and composes it beside the table.

Do not add virtualization responsibility to `MDTable`.

## Inline editing

Virtualization owns geometry only.

Required behavior:

- ordinary scrolling does not close an editor while its cell remains mounted;
- Escape remains cancel;
- before virtual eviction destroys an editing cell, its current draft must be captured/resolved so it is not silently lost;
- view switch resolves active edit before old-view cells disappear;
- no generic pinning/range-extractor abstraction is introduced first.

Prefer current cell-local ownership. Lift only the active edit session if real product proof shows cell-local lifecycle cannot resolve eviction deterministically.

## Accessibility

Preserve native table semantics and remove current `role="list"` / `role="listitem"` overrides in the virtualized target.

- `aria-rowcount` = header + logical rows;
- `aria-colcount` = logical properties + action column when present;
- row index `i` uses `aria-rowindex = i + 2`;
- property index `j` uses `aria-colindex = j + 1`;
- action cells use trailing logical column index;
- virtual spacer/fill DOM is `aria-hidden`/otherwise absent from logical semantics.

Do not introduce ARIA grid/spreadsheet keyboard behavior.

## Capability gate before production migration

The earlier shared-adapter capability stage is superseded. Before production migration, run one direct database-oriented native-table capability proof using `@tanstack/vue-virtual` directly.

It must prove only integration risks Mioframe owns:

- bounded row/column/cell DOM at large logical size;
- native spacer rows/columns;
- deep vertical and deep horizontal offsets;
- dynamic row grow **and shrink**;
- body-driven dynamic column growth and remount stability;
- actual `MDTable` border/layout geometry in Chromium and Firefox;
- native table semantics and logical ARIA metadata.

Do not add generic list/grid fixtures or tests for TanStack's own API behavior.

## Product proof after capability gate

Production migration must then prove:

- short filtered -> full large view switching;
- exact filter/sort membership/order;
- bounded mounted rows/columns/cells;
- deep vertical/horizontal scrolling;
- actual `.database-view` scroll root and sticky header/action behavior;
- edit eviction/view-switch behavior;
- representative relation nesting;
- toolbar/after outside table semantics;
- desktop/mobile correctness;
- controlled performance targets from profiling plan.

## Secondary optimization gate

After bounded rendering, rerun profiling. Only measured remaining bottlenecks may justify cell subscription, worker/query/transfer, paging, indexes, or caches.

## Forbidden

- `src/shared/ui/virtualization` or another generic wrapper without a second current consumer;
- custom offset/range/anchor algorithms;
- independent ResizeObserver or geometry cache;
- hidden full-dataset measurement;
- generic `VirtualGrid`/pinning APIs;
- heuristic scroll-parent discovery;
- toolbar controls as table rows;
- worker/query/batching/index changes without evidence;
- sleeps, force, broad retries, or timeout inflation in proof.

## Readiness

Architecture: **ready for direct database-oriented capability correction**.

Production migration remains gated on that proof and its review.
