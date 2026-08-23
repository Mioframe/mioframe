# Database virtualization production migration handoff

Status: **ready**.

## Goal

Migrate the real Database UI in PR #217 to the accepted native-table two-axis virtualization model, then profile the same PR through the required 30,000 × 300 case.

## Confirmed current behavior

- `DatabaseDataTable` currently renders the full `itemIdList × properties` cross product.
- `useDatabaseData` already receives canonical filtered/sorted row IDs from service `filteredIdList`.
- `.database-view` is the existing physical 2D scroll root.
- `DatabaseViewLayout` currently has no explicit wrapper/root ownership; `after` is passed into table `<tfoot>`.
- `EditableInlineValue` owns draft state locally, so virtual unmount would otherwise be able to destroy an active draft.
- relation editing renders another `DatabaseDataTable` inside its own overflow composition.

## Non-goals

- no worker/query/storage redesign before production profiling;
- no paging/range protocol;
- no generic virtual grid/table/list, pinning, edit manager, geometry cache, or second observer/range engine;
- no change to filter/sort/view semantics or user action priority.

## Affected scenarios

- short filtered -> full large -> short view switching;
- deep 2D scrolling and dynamic row/column sizing;
- inline edit commit/cancel plus row/column eviction and view switch;
- sticky header/action behavior and toolbar auto-hide;
- relation/nested database rendering;
- native table accessibility on desktop and mobile.

## Boundaries and ownership

| Layer | Decision |
| --- | --- |
| feature | Existing mutation flows remain unchanged. |
| entity | `databaseData` owns table virtualization DOM; `databaseValue` owns the narrow value write entry point needed by lifted edit lifecycle. |
| widget | Own explicit scroll roots, surface offsets, toolbar/`after`, and one active inline-edit session. |
| page/pane | No new responsibility. |
| shared | `useVirtualCollection` remains the only virtualization API; `MDTable` remains presentation-only. |
| service/worker | Existing row membership/filter/sort/order remain source of truth. |

## Source of truth and state shape

- rows: existing complete `filteredIdList` result;
- properties: existing ordered `propertiesIdList`;
- geometry: TanStack through two independent `useVirtualCollection` instances;
- view selection: existing `useDatabaseViewSelection` contract;
- edit: at most one widget-owned `{ itemId, propertyId, draft, resolving }` session; no geometry/service objects.

## Public entry points

- `DatabaseDataTable` gains explicit physical-root/surface-offset inputs required by its consumer-owned scroll topology;
- `DatabaseViewLayout` becomes an explicit wrapper and root/surface adapter;
- `entities/databaseValue` exposes a narrow write operation usable after the editing cell unmounts;
- no change to `useVirtualCollection` public API.

## Minimum sufficient design

- keep native `<table>`;
- virtualize rows and properties independently;
- render only current row × property intersections;
- keep action column outside property virtualization;
- move `after` out of `<tfoot>`;
- lift only the active edit session because current cell-local ownership is insufficient under real virtual eviction;
- pass top-level and relation roots explicitly;
- profile only after bounded rendering exists.

Simpler alternatives are insufficient: row-only virtualization leaves cost proportional to all columns; cell-local edit state cannot survive confirmed virtual unmount; worker paging is unnecessary to obtain bounded DOM and has no measured justification yet.

## Rejected approaches

- row-only final solution;
- direct TanStack use in Database;
- 2D coordinator or generic `VirtualGrid`/`VirtualTable`;
- edited-row/column pinning or range extractor;
- widget direct `shared/service` persistence;
- heuristic scroll-parent discovery;
- preemptive worker/query/index/cache redesign.

## Shared UI blast radius

None expected. `useVirtualCollection` and `MDTable` public contracts remain unchanged. If production proof requires changing either shared owner, stop and return for architecture review.

## Acceptance matrix

- bounded actual mounted rows, property headers, and data `<td>` independent of total dataset size;
- exact filter membership/sort order and no stale old-view cells;
- deep vertical/horizontal reach and truthful non-zero surface offsets;
- dynamic row sizing and progressive column sizing;
- active draft survives virtual eviction/failure and Escape still cancels;
- view change resolves edit before source replacement;
- sticky header/action and toolbar behavior preserved;
- nested relation table uses explicit independent root;
- native logical row/column semantics preserved;
- G1 30,000 × 300 succeeds and real short -> full timing is measured.

## Risk matrix

- **high:** edit lifecycle across unmount/view switch -> lift one active session and prove in app E2E;
- **high:** real root/surface topology -> explicit root + product geometry proof;
- **high:** 9M logical intersections -> direct bounded-DOM proof + profiling;
- **medium:** relation nested root and dynamic height -> explicit relation root + representative relation E2E;
- **medium:** mobile/sticky/overlay interaction -> preserve persistent E2E applicability and test public behavior;
- **low:** shared virtualization regression -> existing deterministic capability proof remains owner unless shared code changes.

## Required proof

- application E2E owns complete production migration scenarios;
- existing capability Storybook browser proof remains the shared/native geometry owner and is rerun only if those owners change;
- performance evidence is task-specific in-page measurement from `docs/database-virtualization-profiling.md`;
- no permanent wall-clock CI budget is introduced until controlled measurements show one is stable enough.

## Required verification

Coding implementation uses focused verifier-managed checks needed for touched risks. Architect owns final full-PR semantic review and exact-head GitHub CI after implementation/profiling complete.

## Forbidden

No separate migration/profiling PR, worker redesign without evidence, second geometry system, generic pinning/edit manager, direct widget service access, heuristic roots, hidden full-dataset rendering, or weakened/flaky proof.

## Implementation readiness

Required product/architecture decisions: **resolved**.

Dependencies and owner boundaries: **explicit**.

Unresolved blockers: **none before production implementation**.

Verdict: **ready**.
