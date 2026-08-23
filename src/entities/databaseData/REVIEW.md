# Review

Verdict: blocked

## Scope reviewed

- PR #217 current Database virtualization and native-table integration.
- Current bounded-DOM/deep-correctness evidence.
- Verifier-managed all-string S0/G1 performance evidence.
- Operator manual Chrome/Firefox testing of a real Database with heterogeneous property types.
- Current `DatabaseDataTable` geometry lifecycle and virtual spacer DOM.
- `MDTable` structural border/corner-radius styling.

## Blockers

### B1 — Current proof does not cover the Chrome-only heterogeneous-content jank seen in real use

Owner: `src/entities/databaseData`

Problem: the canonical verifier-managed all-string fixture is fast on the current production implementation, while operator testing on the same laptop reports perceptible Short -> Full delay and scrolling freezes in Chrome for a real Database containing different property types; Firefox does not show the same problem. The previous synthetic fixture therefore does not reproduce the user-facing defect. This also means the current table-owned `onUpdated(updateSurfaceBounds)` lifecycle is not established as the sole/root cause: the same lifecycle is present in the fast all-string verifier run. The missing discriminator is heterogeneous cell/render composition and browser engine behavior.

Evidence:

- [`../../../docs/database-virtualization-production-results.md`](../../../docs/database-virtualization-production-results.md) — current-head verifier-managed all-string S0 median usable 281.1 ms and G1 median usable 321.5 ms, with zero Long Tasks in all six samples, bounded 12 / 8 / 96 mounted work, and deep correctness passing.
- [`DatabaseDataTable.vue`](./DatabaseDataTable.vue) — current table geometry lifecycle is present in the implementation that produced the fast all-string verifier result, so geometry refresh alone does not explain the observed defect.
- [`../../widgets/DocumentView/Database/DatabasePropertyValueInline.vue`](../../widgets/DocumentView/Database/DatabasePropertyValueInline.vue) — different property types dispatch to distinct Boolean, Number, String, Date, and Relation render paths.
- [`../../widgets/DocumentView/Database/DatabaseRelationValueInline.vue`](../../widgets/DocumentView/Database/DatabaseRelationValueInline.vue) — a rendered relation value can compose a nested `DatabaseViewLayout`/virtualized Database inside a cell, which is materially different from the all-string performance fixture.
- Operator manual testing on the same laptop: heterogeneous table janks in Chrome during Full-view switching and scrolling; Firefox does not exhibit the same problem.

Basis:

- [`../../../AGENTS.md`](../../../AGENTS.md) — preserve confirmed user scenarios, keep main-thread work bounded for large datasets/mobile browsers, and return to architecture when repeated correction rounds reveal missing scenarios.
- [`../../../.agents/skills/ui-browser-behavior/SKILL.md`](../../../.agents/skills/ui-browser-behavior/SKILL.md) — browser-, scrolling-, geometry-, and rendering-dependent behavior requires faithful browser proof in the affected engine rather than proxy coverage.
- [`../../../docs/database-virtualization-profiling.md`](../../../docs/database-virtualization-profiling.md) — attribute remaining main-thread work before selecting an optimization or architectural correction.

Risk: merging on the strength of the all-string benchmark would accept a real Chrome regression that remains visible in normal heterogeneous databases. Conversely, changing geometry, worker/query behavior, or shared virtualization before reproducing the heterogeneous discriminator risks correcting the wrong subsystem.

Required final state: reproduce the real class of defect with one deterministic heterogeneous Database fixture and the same product actions in desktop Chrome and Firefox. The proof must isolate which property/render path or combination introduces the Chrome-only switch/scroll cost, while retaining bounded mounted work. Only then route a production correction to the narrowest actual owner. The all-string fast result remains a control case.

Verification: verifier-managed browser diagnostic using the same deterministic heterogeneous fixture in Chrome and Firefox, covering both Short -> Full and representative sustained vertical/horizontal scrolling. Record mounted work and main-thread responsiveness/Long Tasks. Use focused variants to narrow the discriminator (for example base scalar types versus relation content) without changing production code during attribution.

### B2 — Virtual spacer DOM breaks the existing table border and corner-radius contract

Owner: `src/entities/databaseData`

Problem: virtualization inserts leading/trailing spacer columns and top/bottom spacer rows as physical first/last children of the native table. `MDTable` applies visible outer corners and row borders using structural `:first-child`, `:last-child`, and `tr::after` selectors. Spacer elements therefore become structural visual boundaries instead of real visible header/data surfaces. Manual testing confirms broken borders and corner radii.

Evidence:

- [`DatabaseDataTable.vue`](./DatabaseDataTable.vue) — every header/data row contains leading/trailing spacer cells and `tbody` contains leading/trailing spacer rows.
- [`../../shared/ui/Table/MDTable.vue`](../../shared/ui/Table/MDTable.vue) — outer radii depend on physical first/last sections/rows/cells and row side borders are drawn by `tr::after`.
- Base `DatabaseDataTable.vue` before PR #217 rendered real properties/items at the physical table boundaries.

Basis:

- [`../../../AGENTS.md`](../../../AGENTS.md) — preserve existing user-visible behavior and control shared-UI blast radius.
- [`../../../.agents/skills/visual-regression-testing/SKILL.md`](../../../.agents/skills/visual-regression-testing/SKILL.md) — stable visible appearance requires bounded visual proof owned by the truthful UI owner.

Risk: the performance PR visibly degrades an ordinary Database table, while modifying shared `MDTable` merely for one virtualized consumer could spread the regression to unrelated tables.

Required final state: retain the pre-PR visible outer border and corner radii at the logical table boundary in initial and representative scrolled states. Spacer DOM remains presentation-only. Prefer a Database-table-local adaptation; do not change shared `MDTable` unless a separate shared-UI review proves a generic defect.

Verification: bounded visual regression proof for the Database table at representative top-left and scrolled/end states, inspected as intentional compatibility evidence. Browser behavior proof remains separate.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Replacing TanStack or rewriting `useVirtualCollection` without attribution showing the shared engine is responsible.
- Worker/query/storage redesign, paging, indexes, or caches before the heterogeneous Chrome path is attributed.
- Historical checkout/worktree/bisect orchestration by a coding agent.
- Repeating the complete R1/R2/R3/R4/C1/C2/C3 matrix before the heterogeneous discriminator is understood.

## Unresolved questions

- Which heterogeneous property/render path first reproduces the Chrome-only jank: scalar Material-backed cells, relation/nested Database content, or another combination.
- Whether `DatabaseDataTable` surface-bound refresh materially amplifies the heterogeneous Chrome path; the fast all-string run proves it is not sufficient by itself to explain the defect.
- The smallest executable visual-proof location for `DatabaseDataTable` must follow the current `docs/testing/migration-plan.md` when correction preflight is prepared.
