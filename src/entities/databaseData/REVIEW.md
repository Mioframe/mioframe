# Review

Verdict: blocked

## Scope reviewed

- PR #217 current Database virtualization/native-table integration.
- Accepted sparse all-string verifier control.
- Completed heterogeneous Chromium attribution.
- Current value/property render/query path.
- Virtual spacer DOM against `MDTable` border/radius styling.

## Blockers

### B1 — Number fixture reproduces blocking, but the production owner is not isolated yet

Owner: unresolved inside the Database value/render/query path.

Problem: the heterogeneous diagnostic reproduces the Chromium performance class. Scalar mix is materially slower than the accepted all-string control, and Number isolation reproduces repeated >200 ms switch Long Tasks in both samples. Vertical wheel scrolling also produces intermittent >100 ms Long Tasks. However, the evidence does not establish `databaseNumber` UI as root cause: Number and String inline renderers are both trivial text/span output, while property/effective-value query infrastructure is shared. The report also does not establish an equal stored-value density/shape comparison between String and Number fixtures.

Evidence:

- [`../../../docs/database-virtualization-heterogeneous-attribution-handoff.md`](../../../docs/database-virtualization-heterogeneous-attribution-handoff.md) — Number isolation: switch 631.3/635.5 ms, three Long Tasks per sample with 241/244 ms maxima; vertical scroll has a 210 ms Long Task in one of two samples; horizontal scrolling is clean; boundedness/correctness pass.
- [`../databaseNumber/NumberValueInline.vue`](../databaseNumber/NumberValueInline.vue) and [`../databaseString/StringValueInline.vue`](../databaseString/StringValueInline.vue) — both specialized renderers are simple span/text-or-empty-icon components.
- [`../databaseValue/useDatabaseEffectiveValue.ts`](../databaseValue/useDatabaseEffectiveValue.ts) and [`../../shared/service/databaseDocument/databaseDataService.ts`](../../shared/service/databaseDocument/databaseDataService.ts) — effective-value subscription/query path is shared across property types.

Basis:

- [`../../../docs/database-virtualization-profiling.md`](../../../docs/database-virtualization-profiling.md) — remaining material main-thread work must be attributed before selecting an optimization owner.
- [`../../../AGENTS.md`](../../../AGENTS.md) — choose the narrowest truthful owner and avoid speculative architecture/optimization.

Risk: treating `Number` as implementation owner merely because it is the reproducing fixture can produce a local workaround while leaving the actual value-density/query/layout cost intact.

Required final state: distinguish Number type from stored-value density/shape and shared query/layout effects with one controlled equal-density String-vs-Number comparison or equivalent narrow evidence. Then select the narrowest production owner and architecture before coding. Preserve the accepted bounded virtualization architecture meanwhile.

Verification: focused verifier-managed Chromium attribution using identical logical shape, persisted-value density/positions, Short/Full views, viewport, and scroll protocol for String and Number variants. Record switch and vertical-scroll Long Tasks plus boundedness/correctness. Stop once the responsible layer can be selected; do not broaden to a full matrix.

### B2 — Virtual spacer DOM breaks the existing table border and corner-radius contract

Owner: `src/entities/databaseData`

Problem: leading/trailing spacer cells and top/bottom spacer rows become physical first/last table children, while `MDTable` derives visible borders/radii from structural first/last selectors. Manual testing confirms broken borders and corner radii.

Evidence:

- [`DatabaseDataTable.vue`](./DatabaseDataTable.vue) — virtualization inserts spacer rows/cells at physical table boundaries.
- [`../../shared/ui/Table/MDTable.vue`](../../shared/ui/Table/MDTable.vue) — visible outer borders/radii depend on physical first/last structure.

Basis:

- [`../../../AGENTS.md`](../../../AGENTS.md) — preserve existing user-visible behavior and control shared-UI blast radius.
- [`../../../.agents/skills/visual-regression-testing/SKILL.md`](../../../.agents/skills/visual-regression-testing/SKILL.md) — stable appearance requires bounded visual proof at the truthful owner.

Risk: PR #217 visibly regresses ordinary Database presentation.

Required final state: preserve the pre-PR visible outer border and corner radii at logical table boundaries in initial and representative scrolled states. Keep the adaptation Database-local unless separate evidence establishes a generic shared `MDTable` defect.

Verification: bounded visual proof for initial/top-left and representative scrolled/end states, with browser behavior proof kept separate.

## Major issues

None.

## Minor issues

None.

## Accepted risks

None.

## Items not required

- Replacing TanStack or rewriting `useVirtualCollection` without new evidence.
- Worker/query/storage redesign, paging, indexes, or caches before B1 attribution identifies that owner.
- Adding Firefox to the application-E2E verifier for this diagnostic.
- Historical checkout/worktree/bisect orchestration.
- Full performance matrix before the narrow reproducer is understood.

## Unresolved questions

- Whether the Number reproducer is caused by numeric type itself, stored-value density/shape, shared value-query/subscription work, or layout/measurement triggered by those values.
- Whether table surface-bound refresh materially amplifies the identified path.
