# Database virtualization

Status: **shared virtualization architecture accepted; PR #217 completion is blocked only by Database table integration/visual compatibility**.

This is the architecture source of truth for PR #217. Workflow or merge instructions in older profiling/result documents are historical where they conflict with this file.

Current contracts:

- integration correction: `docs/database-virtualization-integration-correction-handoff.md`;
- implementation preflight: `docs/database-virtualization-integration-correction-preflight.md`;
- active review: `src/entities/databaseData/REVIEW.md`;
- raw measurements: `docs/database-virtualization-production-results.md`;
- deferred residual performance work: `docs/database-chrome-jank-follow-up.md`.

## PR #217 goal

Ship a structurally scalable Database table that preserves existing product behavior and normal table presentation.

Required structural target remains at least 30,000 rows × 300 properties without materializing the 9,000,000 logical row/property intersections.

## Accepted architecture

- `@tanstack/vue-virtual` remains the sole virtual-item range/measurement/cache engine.
- `useVirtualCollection` remains the shared one-axis virtualization boundary.
- Database uses independent row and property virtual collections over canonical complete sources.
- Native `<table>` rendering remains.
- Only mounted row × mounted property intersections instantiate expensive outer cells.
- Service/worker remains canonical for row membership/filter/sort/order.
- Existing inline-edit, relation-root, accessibility, dynamic-sizing, sticky-surface, and value ownership remains unchanged.
- No paging/index/cache/worker redesign, second geometry engine, generic virtual grid/table, or new virtualization manager is justified in #217.

Structural boundedness and deep correctness are accepted from existing product proof.

## Database table integration

`entities/databaseData` owns how virtual ranges are represented inside the native table. `shared/ui/Table` remains generic and must not become Database-virtualization-aware.

`DatabaseDataTable` uses presentation spacer DOM around mounted ranges. A spacer is truthful only while it represents a non-zero virtual distance.

### Boundary invariant

> Leading/trailing row and column spacer DOM exists only when the corresponding virtual distance is greater than zero.

When the virtual distance is zero, the logical real row/cell must be the physical table boundary.

This matters because `MDTable` intentionally derives its outer corners and bottom-edge behavior from physical first/last table structure. Always-rendered zero-size spacers currently steal that structure and cause the operator-confirmed border/radius regression.

### Selected correction

Use the existing `rows.leadingSize`, `rows.trailingSize`, `columns.leadingSize`, and `columns.trailingSize` as the only facts.

- render each spacer `<col>`, `<th>`, `<td>`, or `<tr>` only when its matching size is greater than zero;
- count only rendered spacer columns in physical colspan calculations;
- retain non-zero spacers unchanged as presentation-only geometry;
- do not duplicate `MDTable` corner/border rules in Database CSS;
- do not change shared `MDTable`.

If this minimum correction is insufficient, architecture must be revisited before adding another styling system.

## Required #217 scenarios

Before merge:

1. initial logical top/left uses real cells/rows as physical boundaries;
2. interior virtual ranges keep non-zero spacer geometry;
3. logical bottom/right restores real cells/rows as physical boundaries;
4. top-level action-column and relation/no-action tables remain correct;
5. vertical/horizontal deep scrolling still reaches correct sentinels;
6. mounted rows/properties/cells remain bounded;
7. ARIA counts/indices, dynamic row sizing, measured property width, sticky surfaces, nested relations, and editing remain correct;
8. the real application table visually matches the pre-virtualization border/corner behavior at representative start and end states.

Application E2E remains the product/browser proof owner in `tests/e2e/databaseVirtualizationFlows.spec.ts`.

The current visual runner is Storybook-only and `databaseData` has no isolated Storybook product-service fixture. Do not introduce product bootstrap/mocking infrastructure solely for a screenshot. The structural boundary is protected in E2E; operator inspection of the real application table is the final appearance check for this correction.

## Residual Chromium jank

Residual heterogeneous-content Chrome jank is **not a merge blocker for PR #217** after the scope decision recorded here.

Retained evidence:

- sparse all-string verifier control remains fast and bounded;
- heterogeneous/Number fixtures reproduce slower switches and intermittent vertical Long Tasks;
- horizontal scrolling stayed clean in the diagnostic;
- Firefox was noticeably better in operator testing on the same laptop;
- the actual production owner is unresolved.

That work moves to `docs/database-chrome-jank-follow-up.md` and a separate PR.

Do not add Number-specific, geometry, worker/query/storage, Material, or shared virtualization changes to #217 based on the current reproducer label.

PR #217 is acceptable with this known follow-up risk provided:

- the integration/visual regression is fixed;
- structural boundedness/correctness remains intact;
- the accepted all-string control has no evidence of regression from the integration correction;
- no new obvious user-facing performance regression is introduced by the correction;
- exact-head GitHub CI is green.

## Forbidden in the current correction

- shared `MDTable` changes;
- new Database-specific border/radius framework;
- geometry ownership changes;
- TanStack or `useVirtualCollection` changes;
- Number/value/query performance optimization;
- worker/query/storage/paging/index/cache work;
- verifier/benchmark infrastructure;
- screenshots inside application E2E;
- timeout inflation, sleeps, force, or retry-as-success;
- unrelated cleanup.

## Readiness

Shared virtualization: **accepted**.  
Bounded mounted work: **accepted**.  
Product correctness architecture: **accepted**.  
Residual Chromium jank: **deferred to a separate PR with retained evidence**.  
Database table visual/integration compatibility: **blocked pending the ready correction**.  
Merge readiness: **should not merge until the integration blocker is fixed, operator appearance is accepted, and exact-head CI is green**.
