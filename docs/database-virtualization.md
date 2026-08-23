# Database virtualization

Status: **shared virtualization architecture accepted; Database table integration architecture reopened for geometry-refresh performance and visual-boundary compatibility; merge blocked**.

This is the architecture source of truth for large Database rendering in PR #217.

Related current contracts:

- shared virtualization API: `src/shared/ui/virtualization/README.md`;
- active review findings: `src/entities/databaseData/REVIEW.md`;
- raw product measurements: `docs/database-virtualization-production-results.md`;
- superseded switch-only diagnostic: `docs/database-virtualization-performance-attribution-handoff.md`, `docs/database-virtualization-performance-attribution-preflight.md`;
- accepted semantic/proof correction history remains in the existing `docs/database-virtualization-*-handoff.md` / `*-preflight.md` records.

## Goal

Scale Database rendering to at least 30,000 rows and hundreds of properties, including 30,000 × 300 = 9,000,000 logical row/property intersections, while preserving exact filter/sort/view behavior, editing, relations, native table semantics, accessibility, stable visual appearance, and desktop/Mobile Chrome usability.

Primary structural invariant:

> For fixed viewport and overscan, mounted expensive rows, properties, and cells are bounded independently of total logical dataset size.

Responsiveness and presentation are also required product behavior. Bounded DOM alone is not acceptance when the view still freezes during switching/scrolling or the table loses its established border/radius appearance.

## Accepted virtualization architecture

The following decisions remain accepted and are not reopened by the new findings:

- `@tanstack/vue-virtual` is the only virtual-item range/measurement/cache engine.
- `useVirtualCollection` is the only Mioframe shared virtualization boundary and its public API remains unchanged unless new evidence proves it insufficient.
- Database uses independent row and property virtual collections over the existing complete canonical sources.
- Native `<table>` flow remains the renderer.
- Only mounted row × mounted property intersections instantiate expensive cells.
- Service/worker remains canonical for row membership/filter/sort/order.
- No UI-side paging/source reconstruction, worker redesign, generic virtual grid/table, second virtual-item geometry system, pinning, independent size maps, or virtual-item registry is justified.

## Accepted ownership outside the reopened integration boundary

| Owner                              | Responsibility                                                                                                                                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `shared/ui/virtualization`         | Generic one-axis collection virtualization and `vItem` measurement binding.                                                                                                                            |
| `entities/databaseData`            | Native Database table rendering, row/property virtual collections, spacer representation, logical accessibility, sticky action cells, and Database-local visual adaptation required by virtualization. |
| `entities/databaseValue`           | Narrow value read/write contracts used by inline editing.                                                                                                                                              |
| `features/databaseInlineValueEdit` | One active inline-edit session, serialized resolve/commit, recovery, and persistence-failure semantics.                                                                                                |
| Database widget/composition        | Physical-root choice, table/toolbar/relation composition, screen branches, view/configuration state, and cross-feature orchestration.                                                                  |
| service/worker                     | Canonical data/filter/sort/order.                                                                                                                                                                      |
| `shared/ui/Table`                  | Generic table presentation. It must not become Database-virtualization-aware merely to repair this consumer.                                                                                           |

Inline-edit ownership, persistence error semantics, product behavior decomposition, accessibility semantics, and existing service/entity sources of truth remain accepted from the earlier architecture and correction rounds.

## Source of truth

- rows/order/filter/sort: existing `filteredIdList` exposed through `useDatabaseData`;
- properties/order: existing `propertiesIdList`;
- view selection: existing `useDatabaseViewSelection`;
- values: existing Database value entity/service contracts;
- top-level physical root: `.database-view`;
- relation editor root: `.relation-value-field__data`;
- inline/recursive relation preview root: Database-widget-owned local overflow element that physically contains the nested layout;
- edit draft/persistence failure: `features/databaseInlineValueEdit`;
- active source/shape configuration surface: widget-owned controlled state.

## Native table virtualization

`DatabaseDataTable` still renders the logical structure through physical spacer DOM:

```text
<table>
  <colgroup> leading spacer | mounted properties | trailing spacer | action </colgroup>
  <thead>     leading spacer | mounted headers    | trailing spacer | action </thead>
  <tbody>     top spacer | mounted logical rows × mounted properties | bottom spacer </tbody>
</table>
```

The action column remains outside horizontal property virtualization. Spacer DOM is presentation-only and excluded from logical accessibility semantics.

The spacer representation itself is not rejected, but it must not redefine the visible outer border/corner contract of the table. The current implementation does so because `MDTable` derives visible corners/borders from physical first/last children while Database virtualization inserts spacers at those structural boundaries.

### Required visual boundary

The corrected Database table must preserve the pre-PR visible table appearance:

- outer border remains visually continuous;
- top-left/top-right/bottom-left/bottom-right radii belong to the logical visible table boundary, not to hidden spacer cells/rows;
- scrolling horizontally or vertically must not reveal broken/missing duplicate outer edges;
- sticky action/header surfaces remain visually integrated;
- spacer elements remain presentation-only.

This adaptation belongs to `entities/databaseData` unless evidence shows a generic `MDTable` defect affecting ordinary non-virtualized consumers. Do not change shared `MDTable` merely to teach it about Database spacer conventions.

## Root and surface geometry — architecture reopened

A Database virtualizer needs the truthful distance from its physical scroll root origin to the table collection surface.

The previous accepted revision moved root/table bounding ownership into `DatabaseDataTable` and refreshed it from that component's `onUpdated()` lifecycle. New evidence invalidates acceptance of that lifecycle boundary:

- the current table component is also the component whose mounted virtual ranges change during scrolling;
- every such component update can therefore trigger root/table bounding refresh/layout reads;
- manual Chrome testing now reports perceptible scrolling freezes;
- the retained faster `68a71e89...` implementation kept equivalent surface refresh in the parent layout lifecycle rather than the virtual-range-rendering table component.

Therefore the requirement is now:

> Root-to-surface position measurement must not be driven by ordinary virtual-range updates.

The replacement architecture must keep geometry truthful when the table actually moves relative to its physical root while avoiding surface-position measurement on steady-state row/property range rendering.

### Simplest viable direction

The preferred architecture for the next correction is to restore geometry ownership to the component that owns the concrete table surface placement relative to the physical root, rather than the virtual-range-rendering `DatabaseDataTable` lifecycle:

- `DatabaseViewLayout` owns its table-surface placement for top-level and recursive Database composition;
- `RelationValueFieldData` owns its table-surface placement inside the relation editor root;
- those concrete composition owners provide the resulting narrow vertical/horizontal surface offsets to `DatabaseDataTable`;
- `DatabaseDataTable` consumes those offsets but does not run root/table bounding refresh from its own virtual-range `onUpdated()` path.

This intentionally re-allows narrow numeric surface-offset inputs because measured/current user evidence shows that hiding the geometry completely inside `DatabaseDataTable` couples layout measurement to its hot virtual-render lifecycle. The earlier prohibition is superseded.

Do not introduce a shared root manager, provider/inject context, automatic scroll-parent discovery, generic geometry service, or second virtual-item measurement/cache system. Two explicit local composition owners are preferable to a new abstraction.

The final correction may refine the exact event/observer triggers inside those composition owners, but they must correspond to real surface movement/resize/composition changes rather than every virtual range update.

## Dynamic sizing and sticky UI

Rows and mounted property headers continue to be measured through the shared per-instance `vItem`. TanStack owns measured size and scroll correction.

Production wrapping remains intact. A mounted property may use public virtual item `size` as remount `min-width`; no parallel width map exists.

The trailing action column stays mounted for each mounted logical row and remains outside property virtualization. Sticky header/action behavior remains part of the required product and visual contract.

## Inline editing and source/configuration behavior

The previously accepted inline-edit architecture remains unchanged:

- one lifted session in `features/databaseInlineValueEdit`;
- exact draft recovery on failed persistence;
- serialized resolve/commit;
- resolve before switching explicit view or opening source/shape configuration;
- no second/local draft, registry, provider, generic manager, or widget-owned value persistence.

The Database widget continues to own cross-feature screen/configuration decisions, while entities/services remain the source of truth for domain data.

## Accessibility

Preserve native table semantics:

- `aria-rowcount` = header + complete logical rows;
- `aria-colcount` = complete logical properties + action column when present;
- row `i` uses `aria-rowindex = i + 2`;
- property `j` uses `aria-colindex = j + 1`;
- action uses the trailing logical column index;
- spacer/fill DOM is hidden from logical semantics;
- no `role=list/listitem` override;
- no ARIA-grid keyboard model.

## Required user scenarios after the reopen

The next correction must preserve all previously accepted product behavior and additionally prove the newly reported scenarios:

1. Short filtered view -> Full view does not exhibit the current remaining perceptible freeze.
2. Representative sustained vertical scrolling through a large Database does not exhibit the current repeated freezes/jank.
3. Representative horizontal scrolling across a wide Database does not exhibit equivalent jank.
4. Mounted rows/properties/cells stay bounded during switching and scrolling.
5. Deep logical row/property/value sentinels remain correct after scrolling.
6. Table outer borders and corner radii match the established pre-virtualization appearance at the initial/top-left state and after representative deep scrolling.
7. Existing nested relation roots, dynamic row sizing, sticky surfaces, inline editing, and desktop/Mobile Chrome behavior remain correct.

## Proof ownership

Application E2E remains the owner of complete cross-owner product behavior in `tests/e2e/databaseVirtualizationFlows.spec.ts`.

Browser proof must cover real scrolling/geometry behavior through verifier-managed execution. Screenshots must not be embedded in behavior specs.

The visual border/radius contract needs bounded visual regression proof at the executable owner/location allowed by the current `docs/testing/migration-plan.md`. The correction preflight must inspect that plan before selecting the durable visual spec location. Visual proof owns stable appearance only; scrolling responsiveness remains browser/performance evidence.

Task-specific performance evidence must include:

- current corrected Short -> Full behavior;
- representative vertical and horizontal scrolling behavior;
- mounted work counts;
- relevant Long Task / responsiveness observations using the existing profiling contract.

Do not use direct Playwright/Vite/browser commands or coding-agent historical checkout/worktree/bisect orchestration. Use repository verifier surfaces.

## Performance status

Structural scalability is accepted: current measurements keep 12 mounted rows / 8 property headers / 96 expensive cells for S0/G1 and do not materialize the 9,000,000 logical intersections.

Responsiveness is not accepted:

- the later current-geometry measurement reported S0 usable 1582.5–1950.8 ms and G1 1950.7–2516.8 ms with repeated 291–429 ms Long Tasks;
- operator Chrome testing confirms the Full-view freeze is shorter than the original defect but remains perceptible;
- operator Chrome testing additionally confirms perceptible freezes during scrolling.

The former switch-only verifier diagnostic is superseded. The next pass is an implementation correction after the geometry/presentation architecture above is reflected in a dedicated handoff/preflight, not another switch-only measurement pass.

After correction, collect fresh verifier-managed evidence for S0 and G1 plus representative scrolling. The full R1/R2/R3/R4/C1/C2/C3 matrix is not required unless the corrected evidence exposes a new scale-specific uncertainty.

## Forbidden

- replacing TanStack or adding a second range/size/cache/anchor engine without new evidence;
- worker/query/storage redesign, paging, caches, or indexes before the table-integration correction is measured;
- root/table surface bounding refresh from ordinary `DatabaseDataTable` virtual-range updates;
- generic root/geometry manager, provider/inject context, or automatic scroll-parent discovery;
- changing shared `MDTable` to understand Database virtualization unless a separate shared-UI review proves a generic defect;
- spacer DOM becoming the visible border/radius boundary;
- private virtualizer markers in product proof;
- test-only production seams;
- timeout inflation, sleeps, force, retry-as-success, or weakened performance criteria;
- direct Playwright/Vite/browser execution for required proof;
- coding-agent historical checkout/worktree/bisect orchestration;
- unrelated widget/service cleanup.

## Readiness

Shared/native virtualization capability: **accepted**.

Bounded mounted-DOM invariant: **accepted**.

Database table integration geometry lifecycle: **reopened; current table-owned `onUpdated` surface refresh is not accepted**.

Database table visual compatibility: **blocked; borders/corner radii regressed under spacer DOM**.

Inline-edit ownership/error semantics: **accepted**.

Application-E2E behavior decomposition: **accepted but incomplete for the newly reported scrolling responsiveness scenario**.

Merge readiness: **blocked; prepare and implement one architecture-resolved Database table integration correction, then obtain fresh switch/scroll/visual proof and green exact-head GitHub CI**.
