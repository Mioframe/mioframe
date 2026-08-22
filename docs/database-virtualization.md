# Database virtualization

Status: **architecture accepted; native-table-first integration selected; capability proof pending; secondary optimizations evidence-gated**.

This document is the architecture source of truth for large database rendering. `docs/virtualization-library.md` owns the reusable TanStack-backed axis. `docs/database-virtualization-browser-proof.md` owns browser capability gates. `docs/database-virtualization-profiling.md` owns performance evidence.

## Goal

Make database rendering scale to at least 30,000 rows and very large property counts without multi-second main-thread blocking, while preserving current data, filtering, sorting, editing, relation, and table behavior.

Primary invariant:

> Mounted expensive UI is bounded by viewport and overscan, not by total logical rows or columns.

Mounted cells therefore scale approximately with `visibleRows × visibleColumns`, never `allRows × allColumns`.

## Accepted architecture

- `@tanstack/vue-virtual` is the selected engine and is imported only by `src/shared/ui/virtualization`.
- Shared exposes one headless `useVirtualAxis`; database composes one vertical and one horizontal axis.
- Native HTML table semantics are the preferred database rendering model.
- Rows and properties are both virtualized.
- Row height and column width are dynamic; fixed dimensions are not a correctness contract.
- TanStack runtime measurement keyed by stable domain IDs is the only virtual geometry source of truth.
- Database does not maintain parallel row-height or column-width caches.
- Top-level database keeps its existing physical scroll surface; no table-only nested scrollbar is added.
- Axis scroll roots are explicit presentation dependencies, never discovered heuristically.
- Service/worker remains the source of truth for ordered row membership and filtering/sorting.
- Non-virtualization performance changes require measured evidence after bounded rendering exists.

## Ownership

| Owner | Responsibility |
| --- | --- |
| `shared/ui/virtualization` | TanStack adapter, one-axis ranges, measurements, estimates, overscan, scroll correction, deep navigation. |
| `entities/databaseData` | Native table DOM, two-axis cell composition, spacer DOM, table-specific size constraints, logical row/column accessibility metadata, sticky action-cell integration. |
| database widgets | Physical scroll-root wiring, toolbar/after composition, inline edit lifecycle, relation/nested-view composition. |
| service/worker | Canonical filter/sort/order/data contracts. |
| `shared/ui/Table` | Existing presentation primitive only; no virtualization responsibility. |

Do not move database-specific editing, relation, sizing policy, sticky behavior, or product composition into shared virtualization.

## Source of truth

- rows/order: existing worker/service ordered item IDs;
- properties/order: existing database property/view contract;
- values: existing database document state;
- vertical geometry: TanStack measurement cache keyed by `DatabaseItemId`;
- horizontal geometry: TanStack measurement cache keyed by `DatabasePropertyId`;
- scroll roots: widget/composition DOM refs;
- inline edit draft: current edit owner until committed/cancelled.

Virtual geometry is ephemeral presentation state and is never persisted into Automerge or database view state.

## Rendering model

Initial database integration keeps semantic table tags and native table flow.

Conceptually:

```text
<table>
  <colgroup>
    [left virtual spacer]
    [visible property columns]
    [right virtual spacer]
    [optional fill spacer]
    [action column]
  </colgroup>

  <thead>
    [left spacer]
    [visible property headers]
    [right spacer]
    [fill spacer]
    [sticky action header]
  </thead>

  <tbody>
    [top virtual spacer row]
    [visible logical rows]
    [bottom virtual spacer row]
  </tbody>
</table>
```

Presentation-only spacers contain no product UI and are excluded from accessibility semantics.

Do not absolutely position rows or replace the table with a div grid unless the focused browser capability proof demonstrates that native table flow cannot satisfy required geometry in supported browsers without substantial custom measurement logic.

If native flow fails, the first fallback is semantic table tags with virtualization-compatible CSS grid/flex/positioned-row layout. Shared virtualization, service ownership, stable keys, and product contracts do not change.

## Dynamic row sizing

A mounted logical row has one DOM measurement owner: its `<tr>`.

```text
<tr> rendered height
       ↓
vertical useVirtualAxis measurement binding
       ↓
TanStack measurement/cache/correction
```

When visible columns, wrapping, relation content, or editing change row height, browser measurement updates vertical geometry.

There is no database row-height cache and no attempt to calculate a maximum height from columns that are not mounted. A row may grow or shrink as currently rendered content changes; scroll correction must remain acceptably stable.

## Dynamic column sizing

A visible logical property uses its `<th>` as the horizontal measurement owner.

Native table layout aggregates the header and currently mounted body cells into the rendered column width:

```text
mounted header + body cells
          ↓
native table layout
          ↓
visible <th> width
          ↓
horizontal useVirtualAxis measurement binding
          ↓
TanStack measurement cache by DatabasePropertyId
```

Exact intrinsic width across never-rendered rows is not a contract; that would require hidden full-dataset measurement.

Progressive discovery rules:

1. unseen property starts from an estimate;
2. when mounted, native table layout determines its current width;
3. horizontal measurement records that width under the stable property key;
4. later wider mounted content may enlarge and remeasure it;
5. previously measured size is used as the remount minimum so ordinary scrolling does not repeatedly shrink/regrow the column;
6. an explicit responsive maximum may intentionally constrain and remeasure it;
7. no separate authoritative width map exists in database code.

Exact min/max CSS values are implementation tuning, not architecture.

## Two-axis composition

```text
ordered item IDs ----> vertical useVirtualAxis -----+
                                                     +--> visible cell intersections
property IDs --------> horizontal useVirtualAxis ---+
```

Only intersections of the current row and property ranges instantiate expensive cell UI/reactive reads.

There is no production `useVirtualGrid` or matrix owner in shared UI.

## Scroll topology

### Top-level database

`DatabaseViewWidget`'s existing `.database-view { overflow: auto }` remains the physical two-dimensional scroll root.

The widget supplies that element explicitly to the database layout. `DatabaseViewLayout` must stop treating `DatabaseDataTable` as the scroll owner.

The table can begin after other content in the same root, so each applicable axis receives the table surface offset through `scrollMargin`. Sticky occlusion used by deep navigation is represented through `scrollPaddingStart`/`scrollPaddingEnd`.

### Nested relation view

Nested relation composition may use different roots by axis:

- vertical axis may participate in the containing database/document scroll flow;
- horizontal axis may use the relation presentation's local overflow surface;
- roots and surface offsets are passed explicitly;
- no `closest()`/computed-style scroll-parent discovery is part of the contract.

The exact prop/provide/ref wiring is an implementation-preflight detail for the production migration.

## Sticky action column

The action column is not a database property and is not part of horizontal virtualizer count.

It remains mounted for every mounted logical row, sticky at the trailing edge, and separately sized by its own presentation content. Property virtualization controls only database property cells.

## Toolbar / `after`

The current `after` slot is widget composition, not table data.

During production migration, move it out of `<tfoot>` and compose it beside `DatabaseDataTable` in the widget/layout owner. This keeps virtual spacers, row/column counts, and accessibility semantics limited to actual table content.

No generic `MDTable` virtualization mode is introduced.

## Inline editing and focus

Shared virtualization owns geometry only. It does not own focus, edit state, pinning, or overlays.

Current inline editor state is cell-local and its overlay is anchored to cell DOM. Target behavior:

- ordinary scrolling does **not** close the editor while its cell remains mounted;
- Escape preserves explicit cancel semantics;
- if virtualization is about to destroy the editing cell, the current draft must be captured and resolved before destruction so it is never silently lost;
- a view switch resolves the active edit before old-view cells disappear;
- persistence may complete asynchronously after the draft has been captured;
- no hidden offscreen editor/focused DOM is retained merely to preserve focus.

Preferred minimum implementation is to use the current cell edit owner and its unmount/lifecycle boundary. If real-browser proof shows commit/capture ordering cannot be made deterministic there, lift only the active edit-session state to the nearest truthful database widget/presentation owner.

Do **not** add generic virtualizer pinning/range-extractor APIs unless a later current requirement proves them necessary.

A focused but non-editing cell may lose browser focus when it leaves the virtual range. Spreadsheet-style offscreen focus persistence or arrow-key navigation is outside this work.

## Accessibility

Preserve native `<table>/<thead>/<tbody>/<tr>/<th>/<td>` semantics.

Remove the current `role="list"` / `role="listitem"` overrides in the virtualized target.

Because only a subset of logical cells exists in DOM:

- table `aria-rowcount` = header row + logical data rows;
- table `aria-colcount` = logical property columns + action column when present;
- data row at logical zero-based index `i` exposes `aria-rowindex = i + 2`;
- property header/cell at logical zero-based index `j` exposes `aria-colindex = j + 1`;
- action cells use the logical trailing column index;
- virtual spacer/fill DOM is presentation-only and hidden from the accessibility tree.

Do not convert to ARIA `grid` or introduce spreadsheet keyboard behavior without a separate product requirement.

## Measurement lifecycle

Stable keys are identity; index is current position.

- vertical key: `DatabaseItemId`;
- horizontal key: `DatabasePropertyId`.

Filter/sort/reorder/view changes update index-to-key mapping. Matching stable keys may retain TanStack measurements while the virtualizer instance remains mounted. New keys start from estimates. Unmount releases runtime geometry.

Do not add manual global cache resets unless browser proof demonstrates a correctness requirement that stable keys plus DOM remeasurement cannot satisfy.

## Shared UI blast radius

Initial shared-library work adds only `src/shared/ui/virtualization`, its public entry point, dependency, and focused proof.

Database-specific spacer/border/layout overrides stay in `entities/databaseData`. Existing `MDTable`, `MDList`, and Material components are not changed merely to host virtualization.

## Capability gate before database migration

Before production `DatabaseDataTable` migration, prove the selected shared adapter and native-table geometry with isolated deterministic fixtures:

- dynamic vertical/horizontal measurement;
- stable-key remapping;
- deep `scrollToIndex`;
- `scrollMargin`/scroll padding;
- one shared scroll root and a narrow different-roots case;
- native spacer rows/columns;
- `<tr>` and `<th>` measurement behavior;
- deep offset stability;
- Chromium and Firefox correctness, including Firefox table-row measurement risk;
- logical ARIA counts/indices with presentation spacers.

This gate deliberately does **not** clone production editor, relation business state, toolbar, or worker behavior into test fixtures. Those are proven during the real product migration.

## Product proof during database migration

The production migration must then prove through the real application/owners:

- short filtered → full large view switching;
- exact filter/sort membership/order;
- bounded mounted rows/columns/cells;
- deep vertical/horizontal scroll;
- actual sticky header/action behavior;
- actual inline edit eviction/view-switch behavior;
- representative relation nesting/root wiring;
- toolbar/after composition outside table semantics;
- desktop/mobile correctness;
- controlled performance targets from `docs/database-virtualization-profiling.md`.

## Secondary optimization gate

After bounded rendering exists, rerun profiling. Only then consider:

1. visible-range cell read/subscription changes;
2. worker filter/sort changes;
3. worker-to-main transfer changes;
4. paging/range protocols;
5. new indexes/caches.

Every additional optimization requires a measured cause and its own owner/proof. If no material bottleneck remains, stop optimizing.

## Forbidden

- direct TanStack imports outside `shared/ui/virtualization`;
- custom row/column offset or scroll-anchor algorithms in database code;
- duplicate authoritative row/column geometry maps;
- hidden full-dataset measurement;
- fixed-size correctness assumptions;
- generic grid/pinning abstractions without a current requirement;
- heuristic scroll-parent discovery;
- toolbar controls represented as data-table rows;
- ARIA-grid conversion without a product requirement;
- worker/query/batching/index changes without measured evidence;
- weakening browser/performance proof with sleeps, retries, force, or timeout inflation.

## Implementation readiness

### Shared adapter + capability proof

Architecture: **ready**.

The next implementation step is the focused capability handoff/preflight in `docs/database-virtualization-capability-handoff.md` and `docs/database-virtualization-capability-preflight.md`.

### Production database migration

Architecture: **accepted**, but implementation is intentionally gated on capability proof. After the gate passes, run a new production-migration preflight against the proven DOM/measurement path.

### Secondary optimizations

Status: **not architected; evidence-gated**.

Overall verdict: **architecture is ready for shared-adapter/native-table capability implementation; production database migration starts only after that proof is reviewed**.
