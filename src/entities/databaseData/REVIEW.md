# Review

Verdict: blocked

## Scope reviewed

- PR #217 current Database table virtualization and root-to-table geometry.
- Current bounded-DOM/deep-correctness evidence.
- Current `DatabaseDataTable` geometry refresh lifecycle.
- `MDTable` structural border/corner-radius styling against virtual spacer rows/columns.
- Operator manual Chrome testing of Short -> Full switching, steady-state scrolling, and table appearance.

## Blockers

### B1 — Current geometry refresh participates in the virtual-scroll update hot path and scrolling responsiveness is not accepted

Owner: `src/entities/databaseData`

Problem: the current PR reduces the original large-view freeze but does not eliminate it, and manual Chrome testing also exposes perceptible freezes while scrolling. The current `DatabaseDataTable` refreshes root/table bounding geometry from its own `onUpdated()` lifecycle. That component is the owner whose mounted virtual row/property ranges change while scrolling, so root-to-surface layout measurement is now coupled to virtual-range rendering. The previously retained faster implementation performed equivalent root/surface refresh from the parent `DatabaseViewLayout` lifecycle rather than from the range-rendering table component. The current switch-only diagnostic contract is therefore incomplete and superseded.

Evidence:

- [`DatabaseDataTable.vue`](./DatabaseDataTable.vue) — current implementation calls `onUpdated(updateSurfaceBounds)` and `updateSurfaceBounds()` forces both root and table bounding updates inside the component whose virtual items change on scroll.
- [`../../../docs/database-virtualization-production-results.md`](../../../docs/database-virtualization-production-results.md) — current geometry remained bounded but the later run reported 1.6–2.5 s usable-state delays and repeated 291–429 ms Long Tasks.
- [`../../../docs/database-virtualization-performance-attribution-handoff.md`](../../../docs/database-virtualization-performance-attribution-handoff.md) — the former switch-only diagnostic is now superseded because it does not cover scrolling or the visual regression.
- Historical `DatabaseViewLayout.vue` at `68a71e89d03713452946819cb52ba80a64157424` kept the surface measurement lifecycle outside `DatabaseDataTable`; the retained S0/G1 measurements at that state were materially faster.

Basis:

- [`../../../AGENTS.md`](../../../AGENTS.md) — main-thread work must remain bounded for large datasets and mobile browsers; new facts that invalidate a ready handoff require the architecture to be updated explicitly; repeated correction rounds with missing scenarios require returning to architecture.
- [`../../../.agents/skills/ui-browser-behavior/SKILL.md`](../../../.agents/skills/ui-browser-behavior/SKILL.md) — scrolling, geometry, responsive rendering, and browser-observable jank require faithful browser proof through the owning browser lane.
- [`../../../docs/database-virtualization-profiling.md`](../../../docs/database-virtualization-profiling.md) — switch-associated main-thread blocks above the 100 ms research target require diagnosis before performance acceptance.

Risk: a large Database remains visibly unresponsive both when expanding to the full view and during ordinary navigation through that view. Moving more observers/recovery logic into the table without correcting the lifecycle boundary would increase hot-path complexity and risks further layout thrashing.

Required final state: root-to-surface position measurement must not be driven by ordinary virtual-range component updates. The integration must keep offsets truthful when the table actually moves relative to its physical root while keeping steady-state vertical/horizontal scrolling free from the current repeated freezes. Preserve TanStack as the only virtual-item range/size/cache engine and do not introduce a second geometry manager.

Verification: focused verifier-managed browser proof must cover both the real Short -> Full transition and representative sustained vertical/horizontal scrolling on a large Database, while reporting bounded mounted work and relevant Long Tasks/responsiveness evidence. Existing desktop/Mobile Chrome behavior applicability must remain valid.

### B2 — Virtual spacer DOM breaks the existing table border and corner-radius contract

Owner: `src/entities/databaseData`

Problem: virtualization inserts leading/trailing spacer columns and top/bottom spacer rows as physical first/last children of the native table. `MDTable` applies its visible outer corners and row side/bottom borders using structural `:first-child`, `:last-child`, and `tr::after` selectors. As a result, spacer elements become the structural visual boundaries instead of the real visible header/data/footer surfaces. Manual testing confirms broken borders and corner radii.

Evidence:

- [`DatabaseDataTable.vue`](./DatabaseDataTable.vue) — every header/data row now has leading/trailing spacer cells and `tbody` always has leading/trailing spacer rows.
- [`../../shared/ui/Table/MDTable.vue`](../../shared/ui/Table/MDTable.vue) — outer corner radii depend on the physical first/last table section, row, and cell; row side borders are drawn by `tr::after`.
- Base `DatabaseDataTable.vue` at `13ae220900a2a724c867b01b5eb1f045c2a1d857` rendered real properties/items as the physical table boundaries and used the footer/real cells for the bottom visual edge.

Basis:

- [`../../../AGENTS.md`](../../../AGENTS.md) — preserve existing user scenarios and review shared/UI blast radius; a performance change must not silently regress presentation.
- [`../../../.agents/skills/visual-regression-testing/SKILL.md`](../../../.agents/skills/visual-regression-testing/SKILL.md) — stable visible Mioframe appearance requires bounded visual regression proof owned by the truthful UI owner.

Risk: the performance PR visibly degrades the Database table in ordinary use, and changing shared `MDTable` globally merely to accommodate one virtualization consumer could create uncontrolled shared-UI blast radius.

Required final state: the virtualized Database table must retain the pre-PR visible outer border and corner radii at its logical/visible boundaries in normal and scrolled states. Spacer DOM must remain presentation-only and must not become the visible boundary owner. Prefer a Database-table-local adaptation; do not change shared `MDTable` unless review proves the shared contract itself is wrong for all consumers.

Verification: add/restore bounded visual proof for the Database table showing its outer borders/corners in representative top-left and scrolled/end states, and inspect the resulting baselines. Browser behavior proof remains separate from screenshot proof.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Rewriting `useVirtualCollection` or replacing TanStack virtualization without evidence that the shared engine is the defect.
- Worker/query/storage redesign, paging, indexes, or caches before the table-integration hot path is corrected and remeasured.
- Historical checkout/worktree/bisect orchestration by a coding agent.
- Full R1/R2/R3/R4/C1/C2/C3 matrix before the corrected S0/G1 plus scrolling evidence is evaluated.

## Unresolved questions

- The exact proportion of scroll jank attributable to table-owned root/surface bounding refresh versus other current table render/layout work remains to be measured after the architecture boundary is corrected.
- The smallest executable visual-proof location for `DatabaseDataTable` must follow the current `docs/testing/migration-plan.md` when the correction preflight is prepared.
