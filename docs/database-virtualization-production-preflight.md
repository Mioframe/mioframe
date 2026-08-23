# Database virtualization production migration preflight

Status: **architecture resolved; production implementation may begin in PR #217**.

This preflight covers the production Database migration stage of PR #217 (`fix/database-large-data-performance`). It does not create a new PR boundary. The completed shared virtualization and native-table capability work is the prerequisite for this stage, not the final task result.

## Goal

Migrate the real Database UI to the accepted two-axis native-table virtualization architecture while preserving canonical data behavior and product interaction semantics.

The implementation must make expensive mounted work viewport-bounded and prepare the real product for the required 30,000 × 300 profiling matrix.

## Confirmed current owners

### `entities/databaseData`

Current production owner:

- `DatabaseDataTable.vue` renders the entire `itemIdList × properties` cross product;
- `useDatabaseData.ts` receives canonical active-view row IDs from service `filteredIdList`;
- no UI-side sort/filter ownership is required or permitted.

Production migration keeps the same row source and property source and changes only rendering/geometry ownership.

### Database widget composition

Current production owner:

- `.database-view` in `DatabaseViewWidget.vue` is the physical 2D scroll root through `overflow: auto`;
- `DatabaseViewLayout.vue` currently relies on inherited class/ref landing on `DatabaseDataTable` and observes that element for trailing-edge state;
- `after` currently passes through `DatabaseDataTable` into `<tfoot>`;
- inline edit state is currently local to `EditableInlineValue.vue`;
- view selection is provided by `useDatabaseViewSelection`.

Migration makes these ownership boundaries explicit rather than adding another abstraction.

### Relation composition

`RelationValueFieldData.vue` also consumes `DatabaseDataTable`, inside a relation-specific overflow composition owned by `RelationValueField.vue`.

Nested tables therefore require an explicit root input and independent virtualization instances.

## Accepted final state

### `DatabaseDataTable`

Own:

- `useVirtualCollection` row instance over the existing item ID list;
- `useVirtualCollection` horizontal instance over the existing ordered property IDs;
- native `<colgroup>` virtual left/right columns;
- native `<tbody>` top/bottom spacer rows;
- exact row × visible-property expensive-cell intersection;
- row `<tr>` measurement through the shared `vItem` directive;
- property `<th>` measurement through the shared `vItem` directive;
- progressive column minimum sizing using public virtual item size only;
- native table logical ARIA metadata;
- sticky action-cell integration.

Do not own:

- the physical scroll root;
- filter/sort/view decisions;
- toolbar composition;
- active edit lifecycle;
- relation root discovery;
- worker/query behavior.

### `DatabaseViewLayout`

Become an explicit composition wrapper.

Own:

- the explicit scroll-root input from the outer Database widget;
- table-surface DOM reference used to derive truthful vertical/horizontal `surfaceOffset`;
- trailing-edge state needed for action elevation;
- sibling composition of `DatabaseDataTable` and `after` content.

The existing `after` slot leaves table semantics and is rendered after the table.

### `DatabaseViewWidget`

Keep `.database-view` as the one top-level physical 2D scroll root.

Own:

- passing that root explicitly to `DatabaseViewLayout`;
- active inline-edit session lifecycle;
- resolving an active edit before explicit view selection changes;
- preserving current toolbar auto-hide target.

### `entities/databaseValue`

Expose only the narrow domain value write contract required to resolve an active edit session after the corresponding cell component is no longer mounted.

Do not introduce a generic mutation manager or service object passthrough.

### Relation composition

Pass the actual relation overflow root explicitly to the nested `DatabaseDataTable` consumer path. The nested table owns its own two virtualization instances and shares no geometry state with the outer table.

## Data and state contracts

### Rows

Source of truth remains the complete current service result:

```text
service/worker filter + sort + ordering
            ↓
      filteredIdList
            ↓
      useDatabaseData
            ↓
     DatabaseDataTable
            ↓
 useVirtualCollection(rows)
```

No slice/range query is added during this migration.

### Properties

Source of truth remains the current ordered `propertiesIdList`.

No separate virtualized property store or reorder state is introduced.

### Geometry

Only TanStack, through `useVirtualCollection`, owns virtual item geometry, measurement cache, range calculation, ResizeObserver behavior, and scroll correction.

Composition may derive collection-surface offsets from known DOM locations, but must not create a second item geometry system.

### Inline edit session

At most one active top-level inline edit session exists.

Minimum session identity/state:

- item ID;
- property ID;
- current draft value;
- active/resolving state needed to serialize commit/cancel/view-switch behavior.

The session must not contain virtual item descriptors, DOM elements, service clients, provider objects, or broad document state.

## Inline edit lifecycle

The current cell-local draft is insufficient once cells can be virtually unmounted, so only the active session is lifted.

Required lifecycle:

1. opening an editor initializes/claims the active session;
2. field changes update the session draft before the cell can disappear;
3. Escape cancels and clears without persisting;
4. ordinary commit writes through the existing domain contract and clears after success;
5. virtual eviction cannot silently destroy the draft because the draft already belongs to the session;
6. an eviction-triggered resolution uses the same commit semantics;
7. failed persistence keeps the draft recoverable and does not report success by clearing it;
8. remount of the same cell restores the active draft when the session is still unresolved;
9. beginning another edit resolves the previous session first;
10. a view-switch request resolves the active session before mutating explicit view state;
11. if edit resolution fails, the view switch does not proceed.

Do not pin edited rows/columns or expand virtual ranges to keep editors alive.

## Surface offset contract

The accepted shared API requires collection-surface-relative geometry.

Production must pass truthful offsets from the explicit root to the table surface for both axes.

Implementation constraints:

- derive only from composition-owned elements;
- keep the values reactive to layout changes that can move the table surface;
- no scroll-parent discovery;
- no separate `ResizeObserver` for virtual item geometry;
- no custom scroll correction.

A narrow composition measurement mechanism may be used solely to maintain the root-to-surface offset when the known table position changes.

## Native-table DOM contract

Production table shape:

```text
<table>
  <colgroup>
    left virtual spacer
    visible property columns
    right virtual spacer
    optional fill
    action column
  </colgroup>

  <thead>...</thead>

  <tbody>
    top virtual spacer row
    visible logical rows
    bottom virtual spacer row
  </tbody>
</table>
```

Requirements:

- same visible property collection is used by header and every mounted row;
- virtual spacer/fill cells are hidden from logical accessibility semantics;
- action column is not part of the property collection;
- actual expensive data `<td>` count remains bounded;
- production wrapping/dynamic-height behavior is preserved rather than copying capability-only nowrap styling.

## Accessibility contract

Remove production `role="list"` / `role="listitem"` overrides.

Expose:

- native table semantics;
- full logical `aria-rowcount`;
- full logical `aria-colcount`;
- `aria-rowindex` for mounted logical rows;
- `aria-colindex` for mounted property and action cells;
- no virtual spacer rows/cells in logical semantics.

Do not add ARIA grid/spreadsheet interaction semantics.

## Sticky and toolbar behavior

Preserve:

- sticky header behavior;
- sticky trailing action cells;
- current trailing-edge elevation behavior;
- toolbar reachability and auto-hide against the real `.database-view` root.

Move `after`/toolbar placeholder outside `<tfoot>` without changing its user interaction tier.

## Product scenarios that must not change

- exact active-view filter membership;
- exact sort order;
- default/effective view behavior;
- short -> full -> short switching;
- no stale old-view cells;
- inline string/number/date/boolean editing behavior;
- Escape cancel;
- item context actions;
- property update behavior;
- relation selection/editing and relation view selection;
- recursive relation preview behavior;
- toolbar actions;
- mobile/desktop reachability.

## Required implementation proof

Application E2E is the truthful lane for complete production behavior.

Required coverage after migration:

- existing Database item/view/query/relation scenarios remain green;
- short filtered -> full large -> short switching with sentinels and no stale cells;
- bounded actual mounted rows, headers, and expensive `<td>` cells;
- deep vertical/horizontal scroll correctness;
- actual `.database-view` root and non-zero surface offset;
- dynamic row resizing under representative product content;
- progressive column sizing/remount stability;
- sticky header/action behavior;
- inline commit/cancel plus vertical eviction, horizontal eviction, and view-switch draft safety;
- nested relation table using explicit relation root;
- logical table counts/indices;
- desktop/mobile execution according to existing applicability metadata.

Use public DOM and user input. Do not inspect TanStack private state.

## Performance stage after migration

Run the matrix in `docs/database-virtualization-profiling.md`, with G1 = 30,000 × 300 mandatory.

Record actual mounted DOM counts and in-page timing for the real short-filtered -> full-view interaction.

Do not add worker/query/storage optimizations until this evidence identifies a remaining bottleneck.

## Acceptance criteria

Production migration implementation is complete when:

- real Database uses the accepted two-axis virtualization architecture;
- expensive mounted DOM is bounded for fixed viewport/overscan;
- filter/sort/view source-of-truth behavior is unchanged;
- edit eviction and view switching cannot silently lose a draft;
- nested relation rendering uses explicit roots;
- toolbar/`after` is outside table semantics;
- logical native table accessibility is preserved;
- product browser proof covers the changed risks;
- no parallel geometry/range/cache/pinning system exists.

This does not complete PR #217 by itself. Profiling and any evidence-gated remaining performance work follow in the same PR.

## Verification during implementation

Coding-agent feedback should use focused verifier-managed checks needed for the changed risks, for example:

```text
pnpm verify --only type-check
pnpm verify --only e2e --files <affected production database specs>
pnpm verify --only storybook-behavior --files <existing capability owner specs when shared/native geometry is touched>
```

Do not require a coding agent to run a broad final repository gate merely for handoff. Exact-head GitHub CI remains architect-owned after the full PR is ready.

## Forbidden

- separate PR for production migration or profiling;
- row-only virtualization as the final solution;
- UI-side filter/sort/slice ownership;
- new paging/range worker API without profiling evidence;
- direct TanStack usage outside the accepted shared wrapper;
- direct widget `shared/service` access for edit persistence;
- generic `VirtualGrid`, `VirtualTable`, `VirtualList`, pinning, edit manager, or 2D coordinator;
- independent row-height/column-width map;
- second ResizeObserver/range/anchor engine;
- heuristic scroll-root discovery;
- keeping `after` inside `<tfoot>`;
- silent active-draft loss on cell eviction;
- weakening browser proof with sleeps, force, broad retries, larger tolerances, or timeout inflation.

## Preflight result

Architecture decision: **ready**.

Implementation owner boundaries: **resolved**.

Known production lifecycle blocker (inline draft eviction): **resolved architecturally by lifting only the active edit session**.

Worker/query redesign: **not justified before profiling**.

Production implementation may begin on `fix/database-large-data-performance` in PR #217.
