# Database virtualization

Status: **virtualization architecture accepted; native-table integration selected; focused browser proof and implementation preflight pending; secondary optimizations evidence-gated**.

This document is the architecture source of truth for large database rendering. `docs/virtualization-library.md` owns the generic TanStack-backed axis. `docs/database-virtualization-profiling.md` owns baseline/performance analysis and evidence-gated follow-up optimization.

Virtualization is a fixed part of the solution. Profiling does not decide whether to virtualize or which engine to use.

## Accepted architecture

- database rows and properties are both virtualized;
- `@tanstack/vue-virtual` is used only through `shared/ui/virtualization/useVirtualAxis`;
- database rendering composes one vertical and one horizontal axis;
- native HTML table semantics are preserved as the primary rendering model;
- no generic `VirtualTable`, `useVirtualGrid`, custom virtualizer, or database-aware shared abstraction is introduced;
- row and column sizes are dynamic and measured from real mounted DOM;
- TanStack's stable-key measurement cache is the geometry source of truth for both axes;
- database does not maintain a duplicate row/column geometry cache;
- top-level database keeps its existing physical scroll surface rather than introducing a nested table-only scrollbar;
- scroll roots are explicit presentation dependencies, never discovered heuristically by walking the DOM;
- canonical membership/order remains service/worker-owned;
- all non-virtualization performance work stays evidence-gated.

## Goal

Eliminate multi-second blocking when switching from a short filtered view to a large full view while supporting very large logical row and property counts.

Confirmed requirements:

- at least 30,000 logical rows;
- very large property counts;
- dynamic content-dependent row height and column width;
- responsive desktop and mobile browser interaction;
- exact current filtering/sorting/data behavior;
- inline editing, sticky actions, recursive relation rendering, and existing product composition remain correct;
- reusable virtualization infrastructure remains domain-agnostic.

Primary invariant:

> Mounted expensive UI is bounded by viewport and overscan, not by total logical row or column count.

For cells this means approximately `visibleRows × visibleColumns`, not `allRows × allColumns`.

## Current repository evidence

Current `DatabaseDataTable.vue` renders all item/property intersections using nested `v-for`, inside native `MDTable`. The current table also puts the widget-owned `after` content into `<tfoot>` and adds `role="list"`/`role="listitem"` over native table groups/rows.

Current `DatabaseViewWidget.vue` owns the actual `.database-view { overflow: auto }` surface. `DatabaseViewLayout.vue` currently tries to observe `DatabaseDataTable` as a scroll target even though that component is not the physical scroll owner.

Current inline editing state and draft are cell-local and the editor overlay is anchored to the cell DOM. Recursive relation values can render another `DatabaseViewLayout` and currently expose a local `overflow: auto` relation surface.

These facts drive the integration decisions below.

## Ownership

| Owner | Responsibility |
| --- | --- |
| `shared/ui/virtualization` | Generic TanStack-backed one-axis range, measurement, scroll correction, overscan, deep navigation. |
| `entities/databaseData` | Native table DOM, row/column virtual composition, table-specific CSS sizing constraints, semantic row/column metadata, sticky action-cell integration. |
| database widgets | Physical scroll-root composition, toolbar/after composition, inline edit lifecycle, relation/nested-view scroll topology. |
| page/pane | Existing pane/layout ownership remains unchanged. |
| service/worker | Filter/sort/order/data source of truth. |
| `shared/ui/Table` | Existing native presentation primitive; no virtualization responsibility. |

Do not move database-specific sizing, edit, relation, or sticky semantics into shared virtualization merely to reduce files.

## Source of truth and state

- logical row sequence: current worker/service ordered item IDs;
- logical property sequence: current database property/view contract;
- values: existing database document state;
- virtual ranges/offsets/measurements: TanStack runtime state behind `useVirtualAxis`;
- physical scroll roots: widget/composition state;
- inline edit draft: existing edit owner until committed/cancelled.

No virtual geometry is persisted into Automerge or view data.

Stable keys:

- vertical axis: `DatabaseItemId`;
- horizontal axis: `DatabasePropertyId`.

Filter/sort/reorder changes position, not identity. Geometry follows stable keys where the engine supports it.

## Native-table rendering model

The initial implementation keeps `MDTable` and native table markup. Do not move to a div/CSS-grid table unless focused browser proof demonstrates a blocking native-table limitation.

The database renders only the current virtual ranges plus presentation-only spacers.

Conceptually:

```text
<table>
  <colgroup>
    [left virtual spacer]
    [visible property columns]
    [right virtual spacer]
    [optional viewport-fill spacer]
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

### Vertical padding

The first and last virtual row offsets are represented by presentation-only spacer rows. Spacer rows/cells:

- contain no product UI;
- are excluded from accessibility semantics;
- have no normal cell padding/borders/pseudo-row decoration;
- exist only to represent virtual extent inside native table flow.

Do not absolutely position every row unless native-table proof fails. Keeping rows in table flow lets the browser own cross-cell row height.

### Horizontal padding

Hidden columns are represented by left/right presentation spacer columns/cells derived from horizontal virtual offsets.

Visible headers and body cells use the same horizontal virtual range. Header and body must never derive independent visible property sets.

A presentation-only fill column may absorb spare viewport width when the logical table is narrower than the available surface so current fill-to-width behavior can be preserved without stretching measured logical property widths. It is not a logical property and is not part of horizontal virtualizer count.

Exact filler CSS is resolved by the native-table capability proof; it must not become database state.

## Column sizing: browser layout + horizontal DOM measurement

There is **no separate database column-size cache/coordinator** in the initial architecture.

The browser's native table layout is used as the aggregator for currently mounted content:

```text
mounted body cells + header
          ↓
native table column layout
          ↓
visible <th> final width
          ↓
horizontal useVirtualAxis.measureElement(<th>)
          ↓
TanStack measurement cache keyed by DatabasePropertyId
```

This is simpler than separately observing every cell and recomputing a logical width.

### Progressive discovery semantics

Horizontal virtualization cannot know content that has never mounted. Therefore exact full-table intrinsic width across hidden rows is not a contract.

For an unseen property:

1. horizontal axis starts from an estimate;
2. the property enters the virtual range;
3. its header/body cells participate in native table layout;
4. header width is measured by the horizontal axis;
5. TanStack retains the discovered size by stable property key;
6. later mounted wider content may enlarge the native column and trigger a new header measurement.

When a previously measured property remounts, its current virtual-item size is used as the presentation minimum so ordinary scrolling does not repeatedly shrink/regrow the column. A responsive maximum constraint may intentionally cap that minimum; such an explicit viewport constraint may allow the measured cache to shrink.

Consequences:

- ordinary scroll is effectively grow-only for discovered property width;
- content becoming shorter does not require immediate width shrink;
- reopening/remounting the database may rediscover widths from estimates;
- no hidden cells are mounted solely to discover width;
- no second Map of authoritative widths shadows TanStack.

Exact min/max CSS values remain a presentation/visual preflight detail, not an architecture decision.

### Native auto-layout requirement

Do not switch the table to CSS `table-layout: fixed` merely to simplify virtualization. The preferred design deliberately uses native layout of the currently mounted cells so body content can influence the measured header width.

The capability proof must verify that virtual spacer columns and current `MDTable` styling do not make this unstable. If they do, revise database presentation policy before introducing custom geometry algorithms.

## Row sizing: direct vertical DOM measurement

A mounted logical row has one authoritative DOM owner: its `<tr>`.

```text
visible row <tr>
     ↓
vertical useVirtualAxis.measureElement
     ↓
TanStack row measurement
```

There is no database row-height cache.

The row's current height is determined by currently mounted columns. When horizontal virtualization changes visible columns, wrapping/relation content can reflow the row; ResizeObserver/TanStack measurement updates vertical geometry.

Exact maximum row height across columns that are not currently mounted is not a contract. Creating such a cache would duplicate geometry state and can accumulate permanently oversized rows.

Required behavior is stable correction, not invariant height:

- row may grow or shrink after horizontal range/content changes;
- visible anchor must remain acceptably stable through TanStack correction;
- offscreen rows are remeasured when mounted again;
- no hidden columns are rendered to calculate a hypothetical full-row maximum.

## Scroll topology

### Top-level database

Preserve the current top-level scroll behavior: `DatabaseViewWidget`'s `.database-view` remains the physical two-dimensional scroll root.

This avoids introducing a nested table-only scrollbar and preserves the current relationship between table, success content, toolbar auto-hide, and surrounding widget layout.

The widget supplies this element explicitly to `DatabaseViewLayout`/database rendering for both axes.

`DatabaseViewLayout` must stop treating `DatabaseDataTable` itself as the scroll owner. Right-edge/elevation state must observe the actual supplied horizontal root.

### Surface offset

The table may start after other content in the same scroll root. Each axis therefore receives the virtual surface's current offset through shared `scrollMargin`.

The consumer computes the offset from actual DOM geometry; shared virtualization does not discover it.

Layout changes before the table, such as appearance/dismissal of content above it, must update this margin without recreating the logical dataset.

### Sticky occlusion

Use shared scroll padding facts for navigation:

- vertical start padding reflects the sticky header when needed;
- horizontal end padding reflects the sticky action surface when needed.

The virtualizer does not create these sticky surfaces.

### Nested relation views

Recursive relation rendering is a current supported path, so scroll ownership cannot assume every `DatabaseViewLayout` has identical roots.

Target contract:

- nested view inherits the containing database's vertical scroll root so large nested content can participate in the same vertical document flow;
- when the current relation presentation provides its own horizontal `overflow: auto` surface, the nested view uses that local element as its horizontal root;
- each axis receives its own correct surface offset relative to its root;
- root discovery remains explicit through widget/composition contracts, not `closest()`/computed-style heuristics.

The exact narrow ref/provide/prop mechanism for exposing the relation horizontal surface is selected in implementation preflight. Do not redesign relation business state to solve this presentation dependency.

Large nested-relation fan-out is not a separate performance target for this PR, but representative nested relation rendering/scrolling must remain correct and must not break the parent virtualizer.

## Sticky action column

The action column is not a database property and is not part of the horizontal virtualizer count.

It remains:

- mounted for every mounted logical row;
- sticky at the trailing edge;
- outside logical property indexing;
- independently sized by its presentation content.

The property virtual range controls only database property cells.

The action header, when present, follows the same rule.

## Toolbar / `after` ownership

The current `after` slot is widget composition (currently a `DatabaseToolbar` placeholder), not a data-table row.

Do not keep it inside virtualized `<tfoot>`.

Move `after` composition outside `DatabaseDataTable` into `DatabaseViewLayout` so:

- table row/column semantics describe only the database table;
- virtual spacer/colspan logic does not need to account for a toolbar row;
- toolbar placeholder behavior remains widget-owned;
- accessibility row counts are not polluted by a non-data control row.

This is an ownership correction required by the virtualization integration, not a generic `MDTable` change.

## Inline editing and focus

Do not add generic pinning/range-extractor APIs to shared virtualization for the current editor.

Current inline edit draft and overlay are cell-local and the overlay is anchored to cell DOM. Minimum target behavior:

- explicit cancel keeps current Escape/cancel semantics;
- a scroll of either axis while an inline editor is open commits current draft and closes the editor before its anchor can be virtualized out;
- a view switch resolves the active inline edit before old-view cells are removed;
- asynchronous persistence may finish after close, but the draft must already be captured by the owning edit action;
- no invisible offscreen focused/editor DOM is retained merely to preserve focus.

Browser proof must verify event/update ordering. If commit-before-unmount cannot be made deterministic with the current cell-local edit owner, the fallback is to lift only the active edit session state to the nearest truthful database presentation owner. Do **not** solve this by pinning arbitrary rows/columns in the generic virtualizer.

For a focused but non-editing cell, ordinary pointer/touch scrolling may remove it from DOM and browser focus may fall away. No spreadsheet-style offscreen focus persistence or arrow-key navigation is introduced by this PR.

## Accessibility semantics

Preserve native `<table>/<thead>/<tbody>/<tr>/<th>/<td>` semantics.

Remove the current `role="list"` / `role="listitem"` overrides from table body/rows in the virtualized target.

Because only a subset of rows/columns exists in DOM, expose logical table dimensions and positions:

- table `aria-rowcount` = header row + logical data rows;
- table `aria-colcount` = logical property columns + action column when present;
- header row is logical row 1;
- a data row at zero-based logical index `i` uses `aria-rowindex = i + 2`;
- a property cell/header at zero-based logical property index `j` uses `aria-colindex = j + 1`;
- action cells use the logical trailing index when present;
- virtual spacer/fill rows/cells are presentation-only and hidden from the accessibility tree.

Do not convert the table to ARIA `grid` or introduce spreadsheet keyboard semantics unless a separate product requirement exists.

Browser accessibility proof must verify that spacer DOM does not corrupt the exposed logical indices/counts.

## View/filter/sort lifecycle

Stable item/property keys allow measurement reuse across ordinary filter/sort/view changes while the same database presentation remains mounted.

Do not manually clear all TanStack measurements on every view switch. That would throw away useful geometry and increase scroll/layout churn.

Expected lifecycle:

- reorder/filter/view membership changes update index→stable-key mapping;
- matching stable keys may retain measurements;
- newly encountered keys start from estimates;
- document/table unmount releases engine state;
- removed domain items/properties require no persisted geometry cleanup outside the runtime virtualizer lifecycle.

Add an explicit cache-reset protocol only if browser proof demonstrates a correctness requirement that stable keys and DOM remeasurement cannot satisfy.

## Shared UI blast radius

Initial production work should not change `MDTable` behavior for other consumers. Current search shows database data table is the only production `MDTable` consumer, but shared ownership still remains presentation-only.

Database-specific spacer/border/layout overrides belong to `DatabaseDataTable`, not to a generic virtualization mode in `MDTable`.

## Evidence-gated secondary optimizations

Not accepted yet:

- per-cell subscription/read redesign;
- read batching;
- worker filter/sort algorithm changes;
- worker-to-main protocol changes;
- paging/range requests;
- indexes/caches for this performance problem;
- broader storage/query changes.

After virtualization, rerun the same profiler and stop if no material bottleneck remains.

## Acceptance matrix

| Contract | Required outcome |
| --- | --- |
| Large rows | 30,000+ logical rows with viewport-bounded mounted rows. |
| Large columns | Mounted property headers/cells bounded by horizontal viewport. |
| Combined grid | `30,000 × 300` sparse logical grid does not materialize its cross product. |
| Column discovery | Newly visible wider content can expand a column; ordinary scroll does not cause destructive width oscillation. |
| Row dynamics | Horizontal/content changes may reflow rows and are remeasured without full remount. |
| Scroll root | Top-level view keeps one existing scroll surface; virtualizer observes that actual owner. |
| Sticky actions | Trailing actions remain reachable and outside logical property virtualization. |
| Editing | Scroll/view change cannot silently discard an inline draft. |
| Relations | Representative recursive relation view remains correct with explicit axis roots. |
| Accessibility | Logical row/column counts and indices remain exposed despite partial DOM. |
| Correctness | Filtered/full membership and sorting remain exact. |
| Dependency boundary | Database code does not import TanStack directly. |

## Required focused browser proof before implementation preflight closes

In addition to shared adapter proof, validate the database integration model with real browser geometry:

1. native table with vertical spacer rows preserves correct offsets and dynamic row measurement;
2. horizontal spacer columns plus visible native cells produce stable table layout;
3. body content can expand a visible column and header `measureElement` observes the resulting width;
4. cached width used as a remount minimum prevents ordinary shrink/regrow oscillation;
5. responsive max constraint can intentionally shrink/re-measure when viewport policy requires it;
6. sticky header/action behavior is correct with virtual padding;
7. table surface `scrollMargin` remains correct when content above it changes;
8. inline edit resolves before scroll-driven virtual unmount;
9. logical ARIA counts/indices remain correct with spacer elements;
10. representative nested relation uses correct vertical/horizontal roots.

If native table fails one of these because of an unavoidable browser/table-layout limitation, revisit only the database DOM presentation model. Do not reopen TanStack/shared virtualization architecture unless the failure is actually in the engine contract.

## Forbidden

- direct TanStack imports outside shared virtualization;
- custom row/column offset algorithms in database code;
- duplicate authoritative row/column measurement maps;
- hidden full-dataset measurement;
- fixed-size correctness assumptions;
- generic pinning/range-extractor API solely for current inline editing;
- heuristic nearest-scroll-parent discovery;
- toolbar controls represented as virtual/data table rows;
- ARIA grid conversion without a product requirement;
- worker/query/batching/index changes without measured evidence;
- weakening browser/performance proof with sleeps/retries/time inflation.

## Implementation readiness

### Shared virtualization

Architecture and engine are accepted. Focused adapter browser proof and exact TypeScript preflight remain.

### Database rendering

The target architecture is now resolved:

- native-table-first DOM;
- spacer-row/column virtualization;
- direct `<tr>` and `<th>` dynamic measurement;
- no duplicate database geometry cache;
- explicit axis scroll roots and surface margins;
- current top-level scroll surface preserved;
- sticky action excluded from logical property axis;
- toolbar/after moved out of table semantics;
- commit/close edit lifecycle rather than generic pinning;
- native table accessibility with logical count/index metadata.

Remaining gate is **capability proof**, not an unresolved architecture choice. Exact CSS values, ref/provide signatures, test file paths, and installed-package TypeScript signatures are implementation-preflight details.

### Secondary optimizations

Status: **not architected; evidence-gated**.

Overall verdict: **database virtualization architecture is ready for focused browser capability proof; production coding follows once that proof and implementation preflight confirm the selected native-table integration**.
