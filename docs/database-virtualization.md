# Database virtualization

Status: **shared virtualization architecture accepted; Database table integration remains blocked by Chrome-only heterogeneous-content responsiveness and visual-boundary regressions**.

This is the architecture source of truth for large Database rendering in PR #217.

Related current contracts:

- shared virtualization API: `src/shared/ui/virtualization/README.md`;
- active review findings: `src/entities/databaseData/REVIEW.md`;
- raw product measurements: `docs/database-virtualization-production-results.md`;
- completed sparse all-string diagnostic: `docs/database-virtualization-performance-attribution-handoff.md`, `docs/database-virtualization-performance-attribution-preflight.md`.

## Goal

Scale Database rendering to at least 30,000 rows and hundreds of properties, including 30,000 × 300 = 9,000,000 logical row/property intersections, while preserving exact filter/sort/view behavior, editing, relations, native table semantics, accessibility, stable appearance, and responsive desktop/mobile use.

Primary structural invariant:

> For fixed viewport and overscan, mounted expensive rows, properties, and cells are bounded independently of total logical dataset size.

Bounded DOM is necessary but not sufficient. Real heterogeneous databases must also remain responsive while switching views and scrolling.

## Accepted architecture

- `@tanstack/vue-virtual` is the only virtual-item range/measurement/cache engine.
- `useVirtualCollection` remains the Mioframe shared virtualization boundary.
- Database uses independent row and property virtual collections over canonical complete sources.
- Native `<table>` flow remains the renderer.
- Only mounted row × mounted property intersections instantiate expensive outer cells.
- Service/worker remains canonical for row membership/filter/sort/order.
- No UI-side paging/source reconstruction, worker redesign, generic virtual grid/table, second geometry engine, independent size maps, or virtual-item registry is justified by current evidence.

Accepted ownership outside the unresolved performance discriminator remains unchanged: `entities/databaseData` owns Database table rendering/integration; Database value/property owners render their domain content; widgets compose nested relation/value behavior; `shared/ui/Table` remains generic presentation.

## Native table virtualization

`DatabaseDataTable` renders physical spacer DOM around the mounted logical range:

```text
<table>
  <colgroup> leading spacer | mounted properties | trailing spacer | action </colgroup>
  <thead>     leading spacer | mounted headers    | trailing spacer | action </thead>
  <tbody>     top spacer | mounted logical rows × mounted properties | bottom spacer </tbody>
</table>
```

The action column remains outside horizontal property virtualization. Spacer DOM is presentation-only and excluded from logical accessibility semantics.

### Visual boundary

The current spacer structure conflicts with `MDTable` structural first/last-child border and radius rules. The corrected Database table must preserve the pre-PR visible outer border/corner appearance at logical boundaries in initial and scrolled states.

This adaptation belongs to `entities/databaseData` unless a separate shared-UI review proves a generic `MDTable` defect. Do not make shared `MDTable` Database-virtualization-aware merely to repair this consumer.

## Performance evidence — current interpretation

### Structural scalability

Accepted:

- all measured S0/G1 runs retain 12 mounted rows / 8 property headers / 96 expensive outer cells;
- G1 does not materialize the 9,000,000 logical row/property intersections;
- deep logical row/property/value correctness passes.

### Canonical all-string control

The verifier-managed current-head all-string diagnostic on production-equivalent head `1c1a3789ef66cc950eba543566502aec8567f3ec` is fast:

- S0 usable: 269.8 / 281.1 / 283.8 ms; median 281.1 ms;
- G1 usable: 323.5 / 321.5 / 305.9 ms; median 321.5 ms;
- zero Long Tasks in all six samples;
- mounted work remains 12 / 8 / 96;
- deep correctness passes.

This is canonical verifier-owned evidence for the sparse all-string rectangular fixture.

A previous non-verifier current-geometry run reported 1.6–2.5 s usable times and 291–429 ms Long Tasks. Because the canonical verifier run on the same production implementation does not reproduce that behavior, the earlier result is retained only as environment/protocol warning evidence, not as proof of a general runtime regression.

### Real heterogeneous Chrome defect

Operator testing on the same laptop provides the relevant failing discriminator:

- a real Database containing different property types still has a perceptible Short -> Full delay in Chrome;
- scrolling that table in Chrome produces freezes/jank;
- Firefox on the same laptop does not exhibit the same problem.

The all-string fixture therefore does not represent the failing content shape.

`DatabasePropertyValueInline` dispatches Boolean, Number, String, Date, and Relation values to distinct render paths. Relation content is especially distinct because a relation value may compose a nested `DatabaseViewLayout`/virtualized Database inside an outer cell.

## Root/surface geometry — candidate only

The current `DatabaseDataTable` derives root-to-table surface offsets and refreshes root/table bounds from its own update lifecycle. This remains a plausible hot-path amplifier because the component also updates as virtual ranges change.

However, the canonical fast all-string verifier run uses this same implementation. Current evidence therefore does **not** justify declaring the geometry lifecycle the root cause or immediately restoring historical numeric-offset ownership.

Required rule:

> Do not change root/surface ownership until heterogeneous Chrome attribution shows that geometry refresh contributes materially to the failing path.

If attribution later proves it significant, choose the smallest correction that keeps surface offsets truthful without coupling expensive layout reads to ordinary virtual-range updates. Numeric surface offsets or composition-owned measurement may then be reconsidered from evidence; no generic geometry manager/provider or second virtual-item measurement system is justified now.

## Heterogeneous attribution requirement

Before the next production performance correction, reproduce the failing class with one deterministic heterogeneous fixture through repository verifier surfaces.

The attribution proof must:

1. run the same fixture and product actions in desktop Chrome and Firefox;
2. cover Short -> Full and representative sustained vertical/horizontal scrolling;
3. retain the existing sparse all-string fixture as a fast control;
4. record mounted outer rows/headers/cells and main-thread responsiveness/Long Tasks;
5. narrow the discriminator with minimal fixture variants rather than production changes.

Start with the smallest representative property mix. If it reproduces, narrow by property/render path. In particular, distinguish ordinary scalar types from relation/nested-Database content before selecting a correction owner.

Stop attribution once the smallest reproducible path and narrowest actual owner are established. Do not optimize worker/query/storage, shared virtualization, geometry, or Material components speculatively.

## Dynamic sizing and nested content

Rows and mounted property headers continue to be measured through the shared `vItem`; TanStack owns measured size and scroll correction.

Production wrapping, progressive widths, sticky header/action surfaces, nested relation roots, recursive relation previews, and inline editing remain required behavior.

A bounded outer `12 / 8 / 96` count does not prove nested relation content is cheap: a mounted relation cell may compose additional nested Database UI. Heterogeneous performance proof must therefore describe the rendered content shape, not only the outer logical matrix.

## Accessibility

Preserve native table semantics and logical row/property indices; spacer DOM remains hidden from logical semantics; do not introduce an ARIA-grid keyboard model.

## Proof ownership

Application E2E remains the owner of complete product scenarios in `tests/e2e/databaseVirtualizationFlows.spec.ts`.

Task-specific performance attribution may use temporary nested E2E diagnostics, but execution must go through `pnpm verify` surfaces. No direct Playwright/Vite/browser orchestration and no coding-agent historical checkout/worktree/bisect workflow.

The visual border/radius contract requires separate bounded visual-regression proof at the executable owner/location allowed by the current testing migration plan. Screenshots prove stable appearance only; they do not prove scrolling performance.

## Required scenarios before acceptance

1. Sparse all-string S0/G1 remains fast and bounded.
2. A deterministic heterogeneous fixture matching the failing class is responsive in Chrome.
3. The same heterogeneous fixture is compared in Firefox so the engine-specific difference is understood.
4. Short -> Full has no material perceptible freeze in the failing heterogeneous Chrome case.
5. Sustained vertical and horizontal scrolling has no material repeated jank in that case.
6. Mounted outer work remains bounded and deep correctness passes.
7. Nested relation/dynamic sizing/sticky/editing/accessibility behavior remains correct.
8. Table borders and corner radii match the established pre-virtualization appearance in initial and representative scrolled/end states.

## Forbidden

- selecting geometry, TanStack, worker/query/storage, or Material as root cause before heterogeneous attribution;
- replacing TanStack or adding a second range/size/cache engine without evidence;
- paging/index/cache redesign before the actual failing render path is identified;
- generic geometry manager/provider or automatic root discovery;
- changing shared `MDTable` merely to understand Database spacer conventions;
- spacer DOM owning visible borders/radii;
- test-only production seams;
- timeout inflation, sleeps, force, retry-as-success, or weakened performance criteria;
- direct Playwright/Vite/browser execution for required proof;
- coding-agent historical checkout/worktree/bisect orchestration;
- unrelated cleanup.

## Readiness

Shared virtualization: **accepted**.

Bounded mounted-DOM invariant: **accepted**.

Sparse all-string current-head responsiveness: **accepted in verifier-owned Chrome evidence**.

Heterogeneous real-table responsiveness: **blocked; Chrome-only switch/scroll jank must be reproduced and attributed by render path**.

Root/surface geometry ownership: **not selected as correction yet; candidate only**.

Database table visual compatibility: **blocked; borders/corner radii regressed under spacer DOM**.

Inline-edit/error/accessibility ownership: **accepted**.

Merge readiness: **blocked; attribute and correct the heterogeneous Chrome path, restore table visual boundaries, then obtain focused switch/scroll/visual proof and green exact-head GitHub CI**.
