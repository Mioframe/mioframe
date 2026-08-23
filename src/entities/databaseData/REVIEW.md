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

Problem: the canonical verifier-managed all-string fixture is fast, while operator testing on the same laptop reports perceptible Short -> Full delay and scrolling freezes in Chrome for a real heterogeneous Database; Firefox does not show the same problem. The missing discriminator is heterogeneous cell/render composition. The current table geometry lifecycle is not established as root cause because it is also present in the fast all-string control.

Evidence:

- [`../../../docs/database-virtualization-production-results.md`](../../../docs/database-virtualization-production-results.md) — verifier-managed all-string S0 median 281.1 ms and G1 median 321.5 ms, zero Long Tasks, bounded 12 / 8 / 96 mounted work, deep correctness pass.
- [`../../widgets/DocumentView/Database/DatabasePropertyValueInline.vue`](../../widgets/DocumentView/Database/DatabasePropertyValueInline.vue) — Boolean, Number, String, Date, and Relation use distinct render paths.
- [`../../widgets/DocumentView/Database/DatabaseRelationValueInline.vue`](../../widgets/DocumentView/Database/DatabaseRelationValueInline.vue) — relation content may compose nested Database UI.
- [`../../../playwright.config.ts`](../../../playwright.config.ts) — the current application-E2E verifier has desktop Chromium and Mobile Chrome projects, not Firefox.
- Operator manual testing: heterogeneous table janks in Chrome during Full-view switching and scrolling; Firefox does not exhibit the same problem.

Basis:

- [`../../../AGENTS.md`](../../../AGENTS.md) — preserve confirmed scenarios, keep main-thread work bounded, and attribute repeated missing scenarios before further architecture changes.
- [`../../../.agents/skills/ui-browser-behavior/SKILL.md`](../../../.agents/skills/ui-browser-behavior/SKILL.md) — scrolling/rendering-dependent behavior requires faithful browser proof.
- [`../../../docs/database-virtualization-profiling.md`](../../../docs/database-virtualization-profiling.md) — attribute remaining main-thread work before selecting an optimization.

Risk: accepting the all-string benchmark would leave the real Chrome defect unresolved; speculative geometry/shared/worker changes could target the wrong subsystem.

Required final state: through verifier-managed desktop Chromium, reproduce the failing class with deterministic heterogeneous fixtures and isolate the smallest property/render path that introduces switch/scroll blocking while mounted outer work remains bounded. Treat the Firefox result as operator comparison evidence; do not add a Firefox verifier project in this attribution pass. Then route production correction to the narrowest evidence-backed owner.

Verification: follow [`../../../docs/database-virtualization-heterogeneous-attribution-handoff.md`](../../../docs/database-virtualization-heterogeneous-attribution-handoff.md) and its preflight. Cover Short -> Full plus vertical/horizontal wheel scrolling. Start with scalar mix, isolate scalar types only if needed, then test one representative relation case if scalars remain fast.

### B2 — Virtual spacer DOM breaks the existing table border and corner-radius contract

Owner: `src/entities/databaseData`

Problem: virtualization inserts leading/trailing spacer columns and top/bottom spacer rows as physical first/last children of the native table. `MDTable` applies visible outer corners and row borders using structural `:first-child`, `:last-child`, and `tr::after` selectors. Spacer elements therefore become structural visual boundaries instead of real visible header/data surfaces. Manual testing confirms broken borders and corner radii.

Evidence:

- [`DatabaseDataTable.vue`](./DatabaseDataTable.vue) — every header/data row contains leading/trailing spacer cells and `tbody` contains leading/trailing spacer rows.
- [`../../shared/ui/Table/MDTable.vue`](../../shared/ui/Table/MDTable.vue) — outer radii depend on physical first/last sections/rows/cells and row side borders are drawn by `tr::after`.

Basis:

- [`../../../AGENTS.md`](../../../AGENTS.md) — preserve existing user-visible behavior and control shared-UI blast radius.
- [`../../../.agents/skills/visual-regression-testing/SKILL.md`](../../../.agents/skills/visual-regression-testing/SKILL.md) — stable appearance requires bounded visual proof.

Risk: the performance PR visibly degrades ordinary Database presentation; changing shared `MDTable` for one consumer could spread the regression.

Required final state: retain the pre-PR outer border and corner radii at the logical table boundary in initial and representative scrolled states. Spacer DOM remains presentation-only. Prefer a Database-local adaptation.

Verification: bounded Database-table visual proof at representative top-left and scrolled/end states.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Replacing TanStack or rewriting `useVirtualCollection` before attribution.
- Worker/query/storage redesign, paging, indexes, or caches before attribution.
- Adding Firefox to application-E2E verifier for this diagnostic.
- Historical checkout/worktree/bisect orchestration.
- Repeating the full performance matrix.

## Unresolved questions

- Which property/render path first reproduces the Chrome jank: scalar content, relation/nested Database content, or a combination.
- Whether `DatabaseDataTable` surface-bound refresh materially amplifies that identified path.
- The smallest executable visual-proof location for the later presentation correction.
